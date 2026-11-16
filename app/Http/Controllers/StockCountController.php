<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockCount;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockCountController extends Controller
{
    public function index(Request $request)
    {
        $query = StockCount::with([
            'branch:id,name,code',
            'storageLocation:id,name',
            'conductor:id,name',
            'approver:id,name',
            'details.item:id,name,sku',
            'details.unit:id,name,symbol',
        ])->withSum('details as total_variance_cost', 'variance_cost');

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('count_number', 'like', "\%{$search}%")
                  ->orWhereHas('storageLocation', fn($l) => $l->where('name', 'like', "\%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status',$request->status);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id',$request->branch_id);
        }

        $stockCounts =$query->latest()->paginate(10)->withQueryString();

        // Snapshot stok sistem per cabang-lokasi-item untuk kalkulasi real-time di modal
        $systemStocks = StockBatch::where('current_qty', '>', 0)
            ->select(
                'branch_id',
                'storage_location_id',
                'item_id',
                DB::raw('SUM(current_qty) as system_qty')
            )
            ->groupBy('branch_id', 'storage_location_id', 'item_id')
            ->get();

        return Inertia::render('StockCounts/Index', [
            'stockCounts'      => $stockCounts,
            'branches'         => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'storageLocations' => StorageLocation::where('is_active', true)->select('id', 'branch_id', 'name')->orderBy('name')->get(),
            'items'            => Item::with('primaryUnit:id,name,symbol')
                                    ->where('is_active', true)
                                    ->select('id', 'name', 'sku', 'primary_unit_id')
                                    ->orderBy('name')
                                    ->get(),
            'units'            => Unit::select('id', 'name', 'symbol')->orderBy('name')->get(),
            'systemStocks'     => $systemStocks,
            'filters'          => $request->only(['search', 'status', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'              => 'required|exists:branches,id',
            'storage_location_id'    => 'required|exists:storage_locations,id',
            'count_number'           => 'required|string|max:50|unique:stock_counts,count_number',
            'count_date'             => 'required|date',
            'details'                => 'required|array|min:1',
            'details.*.item_id'      => 'required|distinct|exists:items,id',
            'details.*.physical_qty' => 'required|numeric|min:0',
            'details.*.unit_id'      => 'required|exists:units,id',
            'details.*.notes'        => 'nullable|string|max:500',
        ], [
            'details.*.item_id.distinct' => 'Item SKU tidak boleh duplikat dalam satu sesi opname.',
        ]);

        DB::transaction(function () use ($validated, $request) {$stockCount = StockCount::create([
                'branch_id'           => $validated['branch_id'],
                'storage_location_id' => $validated['storage_location_id'],
                'count_number'        => $validated['count_number'],
                'count_date'          => $validated['count_date'],
                'status'              => 'DRAFT',
                'conducted_by'        => $request->user()?->id,
            ]);

            foreach ($validated['details'] as$row) {
                $systemQty = (float) StockBatch::where('branch_id',$validated['branch_id'])
                    ->where('storage_location_id', $validated['storage_location_id'])
                    ->where('item_id', $row['item_id'])
                    ->sum('current_qty');

                $physicalQty = (float) $row['physical_qty'];$varianceQty = round($physicalQty -$systemQty, 4);

                $unitCost = (float) (
                    StockBatch::where('branch_id', $validated['branch_id'])
                        ->where('item_id', $row['item_id'])
                        ->latest()
                        ->value('unit_cost')
                    ?? StockBatch::where('item_id', $row['item_id'])
                        ->latest()
                        ->value('unit_cost')
                    ?? 0
                );

                $varianceCost = round($varianceQty * $unitCost, 2);

                $stockCount->details()->create([
                    'item_id'       => $row['item_id'],
                    'system_qty'    => $systemQty,
                    'physical_qty'  => $physicalQty,
                    'variance_qty'  => $varianceQty,
                    'unit_id'       => $row['unit_id'],
                    'unit_cost'     => $unitCost,
                    'variance_cost' => $varianceCost,
                    'notes'         => $row['notes'] ?? null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Sesi Stock Opname berhasil disimpan sebagai DRAFT.');
    }

    public function approve(Request $request, StockCount$stockCount)
    {
        if (!in_array($stockCount->status, ['DRAFT', 'SUBMITTED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Stock Opname ini sudah disetujui sebelumnya.',
            ]);
        }

        DB::transaction(function () use ($stockCount,$request) {
            $userId =$request->user()?->id;
            $stockCount->load('details.item');

            foreach ($stockCount->details as$detail) {
                // Kunci batch di lokasi audit agar stok konsisten saat rekonsiliasi dieksekusi
                $batches = StockBatch::where('branch_id',$stockCount->branch_id)
                    ->where('storage_location_id', $stockCount->storage_location_id)
                    ->where('item_id', $detail->item_id)
                    ->where('current_qty', '>', 0)
                    ->orderByRaw('exp_date IS NULL ASC')
                    ->orderBy('exp_date', 'asc')
                    ->orderBy('created_at', 'asc')
                    ->lockForUpdate()
                    ->get();

                $currentSystemQty = (float)$batches->sum('current_qty');
                $physicalQty      = (float)$detail->physical_qty;
                $varianceQty      = round($physicalQty - $currentSystemQty, 4);$varianceCost     = round($varianceQty * (float)$detail->unit_cost, 2);

                // Sinkronkan snapshot detail dengan kondisi sistem aktual saat approval
                $detail->update([
                    'system_qty'    => $currentSystemQty,
                    'variance_qty'  => $varianceQty,
                    'variance_cost' => $varianceCost,
                ]);

                if ($varianceQty == 0.0) {
                    continue;
                }

                if ($varianceQty > 0) { // Surplus (Stok Fisik > Sistem): buat batch penyesuaian baru
                    $batch = StockBatch::create([
                        'branch_id'           => $stockCount->branch_id,
                        'storage_location_id' => $stockCount->storage_location_id,
                        'item_id'             => $detail->item_id,
                        'batch_number'        => "ADJ-{$stockCount->count_number}",
                        'initial_qty'         => $varianceQty,
                        'current_qty'         => $varianceQty,
                        'unit_id'             => $detail->unit_id,
                        'unit_cost'           => $detail->unit_cost,
                    ]);

                    StockMovement::create([
                        'branch_id'      => $stockCount->branch_id,
                        'item_id'        => $detail->item_id,
                        'stock_batch_id' => $batch->id,
                        'to_location_id' => $stockCount->storage_location_id,
                        'movement_type'  => 'ADJUSTMENT',
                        'qty'            => $varianceQty,
                        'unit_id'        => $detail->unit_id,
                        'reference_type' => StockCount::class,
                        'reference_id'   => $stockCount->id,
                        'created_by'     => $userId,
                    ]);
                } else {
                    // Defisit (Stok Fisik < Sistem): potong batch aktif sesuai urutan FEFO
                    $neededQty = abs($varianceQty);

                    if ($currentSystemQty < $neededQty) {$itemName = $detail->item?->name ?? "Item #{$detail->item_id}";
                        throw ValidationException::withMessages([
                            'message' => "Stok sistem {$itemName} tidak mencukupi untuk penyesuaian defisit ({$neededQty}).",
                        ]);
                    }

                    foreach ($batches as$batch) {
                        if ($neededQty <= 0) {
                            break;
                        }

                        $takeQty = min((float) $batch->current_qty,$neededQty);
                        $batch->decrement('current_qty',$takeQty);

                        StockMovement::create([
                            'branch_id'        => $stockCount->branch_id,
                            'item_id'          => $detail->item_id,
                            'stock_batch_id'   => $batch->id,
                            'from_location_id' => $stockCount->storage_location_id,
                            'movement_type'    => 'ADJUSTMENT',
                            'qty'              => $takeQty,
                            'unit_id'          => $detail->unit_id,
                            'reference_type'   => StockCount::class,
                            'reference_id'     => $stockCount->id,
                            'created_by'       => $userId,
                        ]);

                        $neededQty -=$takeQty;
                    }
                }
            }

            $stockCount->update([
                'status'      => 'APPROVED',
                'approved_by' => $userId,
            ]);
        });

        return redirect()->back()->with('success', 'Stock Opname disetujui & penyesuaian stok sistem berhasil dieksekusi.');
    }

    public function destroy(StockCount $stockCount)
    {
        if ($stockCount->status === 'APPROVED') {
            return redirect()->back()->withErrors([
                'message' => 'Stock Opname yang sudah APPROVED tidak dapat dihapus.',
            ]);
        }

        DB::transaction(function () use ($stockCount) {
            $stockCount->details()->delete();$stockCount->delete();
        });

        return redirect()->back()->with('success', 'Sesi Stock Opname berhasil dihapus.');
    }
}