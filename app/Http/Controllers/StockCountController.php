<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockCount;
use App\Models\StockCountDetail;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockCountController extends Controller
{
    public function index(Request $request)
    {
        $query = StockCount::with(['branch', 'storageLocation', 'conductor', 'approver', 'details.item', 'details.unit']);

        if ($request->search) {
            $query->where('count_number', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $stockCounts = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('StockCounts/Index', [
            'stockCounts' => $stockCounts,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'storageLocations' => StorageLocation::where('is_active', true)->get(),
            'items' => Item::with('primaryUnit')->where('is_active', true)->get(),
            'units' => Unit::select('id', 'name', 'symbol')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'count_number' => 'required|string|max:50|unique:stock_counts,count_number',
            'count_date' => 'required|date',
            'details' => 'required|array|min:1',
            'details.*.item_id' => 'required|exists:items,id',
            'details.*.physical_qty' => 'required|numeric|min:0',
            'details.*.unit_id' => 'required|exists:units,id',
            'details.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $stockCount = StockCount::create([
                'branch_id' => $validated['branch_id'],
                'storage_location_id' => $validated['storage_location_id'],
                'count_number' => $validated['count_number'],
                'count_date' => $validated['count_date'],
                'status' => 'DRAFT',
                'conducted_by' => $request->user()?->id ?? 1,
            ]);

            foreach ($validated['details'] as $item) {
                // Hitung sistem Qty berdasarkan total StockBatch lokasi tersebut
                $systemQty = StockBatch::where('branch_id', $validated['branch_id'])
                    ->where('storage_location_id', $validated['storage_location_id'])
                    ->where('item_id', $item['item_id'])
                    ->sum('current_qty');

                $varianceQty = $item['physical_qty'] - $systemQty;

                $latestBatch = StockBatch::where('branch_id', $validated['branch_id'])
                    ->where('item_id', $item['item_id'])
                    ->latest()
                    ->first();

                $unitCost = $latestBatch ? $latestBatch->unit_cost : 0;
                $varianceCost = $varianceQty * $unitCost;

                $stockCount->details()->create([
                    'item_id' => $item['item_id'],
                    'system_qty' => $systemQty,
                    'physical_qty' => $item['physical_qty'],
                    'variance_qty' => $varianceQty,
                    'unit_id' => $item['unit_id'],
                    'unit_cost' => $unitCost,
                    'variance_cost' => $varianceCost,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Sesi Stock Opname berhasil dibuat.');
    }

    public function approve(Request $request, StockCount $stockCount)
    {
        if ($stockCount->status !== 'DRAFT') {
            return redirect()->back()->withErrors(['message' => 'Stock Opname telah diproses sebelumnya.']);
        }

        DB::transaction(function () use ($stockCount, $request) {
            $stockCount->update([
                'status' => 'APPROVED',
                'approved_by' => $request->user()?->id ?? 1,
            ]);

            foreach ($stockCount->details as $detail) {
                if ($detail->variance_qty != 0) {
                    if ($detail->variance_qty > 0) {
                        // Penyesuaian Positif (Stok Fisik > Sistem)
                        $batch = StockBatch::create([
                            'branch_id' => $stockCount->branch_id,
                            'storage_location_id' => $stockCount->storage_location_id,
                            'item_id' => $detail->item_id,
                            'batch_number' => "ADJ-{$stockCount->count_number}",
                            'initial_qty' => $detail->variance_qty,
                            'current_qty' => $detail->variance_qty,
                            'unit_id' => $detail->unit_id,
                            'unit_cost' => $detail->unit_cost,
                        ]);

                        StockMovement::create([
                            'branch_id' => $stockCount->branch_id,
                            'item_id' => $detail->item_id,
                            'stock_batch_id' => $batch->id,
                            'to_location_id' => $stockCount->storage_location_id,
                            'movement_type' => 'ADJUSTMENT_IN',
                            'qty' => $detail->variance_qty,
                            'unit_id' => $detail->unit_id,
                            'reference_type' => StockCount::class,
                            'reference_id' => $stockCount->id,
                            'created_by' => $request->user()?->id ?? 1,
                        ]);
                    } else {
                        // Penyesuaian Negatif (Stok Fisik < Sistem)
                        $neededQty = abs($detail->variance_qty);
                        $batches = StockBatch::where('branch_id', $stockCount->branch_id)
                            ->where('storage_location_id', $stockCount->storage_location_id)
                            ->where('item_id', $detail->item_id)
                            ->where('current_qty', '>', 0)
                            ->orderBy('exp_date', 'asc')
                            ->get();

                        foreach ($batches as $batch) {
                            if ($neededQty <= 0) break;

                            $takeQty = min($batch->current_qty, $neededQty);
                            $batch->decrement('current_qty', $takeQty);

                            StockMovement::create([
                                'branch_id' => $stockCount->branch_id,
                                'item_id' => $detail->item_id,
                                'stock_batch_id' => $batch->id,
                                'from_location_id' => $stockCount->storage_location_id,
                                'movement_type' => 'ADJUSTMENT_OUT',
                                'qty' => $takeQty,
                                'unit_id' => $detail->unit_id,
                                'reference_type' => StockCount::class,
                                'reference_id' => $stockCount->id,
                                'created_by' => $request->user()?->id ?? 1,
                            ]);

                            $neededQty -= $takeQty;
                        }
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'Stock Opname disetujui & penyesuaian stok sistem telah dieksekusi.');
    }
}