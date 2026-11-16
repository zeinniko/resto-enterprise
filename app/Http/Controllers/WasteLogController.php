<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use App\Models\WasteLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WasteLogController extends Controller
{
    public function index(Request $request)
    {
        $query = WasteLog::with([
            'branch:id,name,code',
            'storageLocation:id,name',
            'item:id,name,sku',
            'stockBatch:id,batch_number,exp_date',
            'unit:id,name,symbol',
            'logger:id,name',
        ]);

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('item', fn($i) => $i->where('name', 'like', "\%{$search}%")
                                                  ->orWhere('sku', 'like', "%{$search}%"))
                  ->orWhereHas('stockBatch', fn($b) => $b->where('batch_number', 'like', "\%{$search}%"));
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id',$request->branch_id);
        }

        if ($request->filled('reason')) {
            $query->where('reason',$request->reason);
        }

        $summaryQuery = clone$query;
        $summary = [
            'total_entries' => (clone $summaryQuery)->count(),
            'total_loss'    => (float) ((clone $summaryQuery)->sum('total_cost') ?? 0), 'expired_loss'  => (float) ((clone$summaryQuery)->where('reason', 'EXPIRED')->sum('total_cost') ?? 0),
        ];

        $wasteLogs =$query->latest()->paginate(15)->withQueryString();

        // Ringkasan stok aktif per cabang-lokasi-item untuk info real-time di form modal
        $availableStocks = StockBatch::where('current_qty', '>', 0)
            ->select(
                'branch_id',
                'storage_location_id',
                'item_id',
                DB::raw('SUM(current_qty) as available_qty')
            )
            ->groupBy('branch_id', 'storage_location_id', 'item_id')
            ->get();

        return Inertia::render('WasteLogs/Index', [
            'wasteLogs'        => $wasteLogs,
            'branches'         => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'storageLocations' => StorageLocation::where('is_active', true)->select('id', 'branch_id', 'name')->orderBy('name')->get(),
            'items'            => Item::with('primaryUnit:id,name,symbol')
                                    ->where('is_active', true)
                                    ->select('id', 'name', 'sku', 'primary_unit_id')
                                    ->orderBy('name')
                                    ->get(),
            'units'            => Unit::select('id', 'name', 'symbol')->orderBy('name')->get(),
            'availableStocks'  => $availableStocks,
            'summary'          => $summary,
            'filters'          => $request->only(['search', 'branch_id', 'reason']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'           => 'required|exists:branches,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'item_id'             => 'required|exists:items,id',
            'qty'                 => 'required|numeric|gt:0',
            'unit_id'             => 'required|exists:units,id',
            'reason'              => 'required|in:EXPIRED,SPOILED_PREP,SPILLED_ACCIDENT,QUALITY_REJECT',
        ]);

        DB::transaction(function () use ($validated,$request) {
            $neededQty = (float)$validated['qty'];
            $userId =$request->user()?->id;

            // Ambil batch stok FEFO yang tersedia di cabang & lokasi tersebut
            $batches = StockBatch::where('branch_id',$validated['branch_id'])
                ->where('storage_location_id', $validated['storage_location_id'])
                ->where('item_id', $validated['item_id'])
                ->where('current_qty', '>', 0)
                ->orderByRaw('exp_date IS NULL ASC')
                ->orderBy('exp_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->get();

            $availableQty = (float)$batches->sum('current_qty');
            if ($availableQty <$neededQty) {
                throw ValidationException::withMessages([
                    'qty' => "Stok fisik pada lokasi ini tidak mencukupi (Tersedia: {$availableQty}).",
                ]);
            }

            foreach ($batches as$batch) {
                if ($neededQty <= 0) {
                    break;
                }

                $takeQty = min((float) $batch->current_qty,$neededQty);
                $batch->decrement('current_qty',$takeQty);

                $unitCost  = (float)$batch->unit_cost;
                $totalCost = round($takeQty * $unitCost, 2);

                $wasteLog = WasteLog::create([
                    'branch_id'           => $validated['branch_id'],
                    'storage_location_id' => $validated['storage_location_id'],
                    'item_id'             => $validated['item_id'],
                    'stock_batch_id'      => $batch->id,
                    'qty'                 => $takeQty,
                    'unit_id'             => $validated['unit_id'],
                    'unit_cost'           => $unitCost,
                    'total_cost'          => $totalCost,
                    'reason'              => $validated['reason'],
                    'logged_by'           => $userId,
                ]);

                StockMovement::create([
                    'branch_id'        => $validated['branch_id'],
                    'item_id'          => $validated['item_id'],
                    'stock_batch_id'   => $batch->id,
                    'from_location_id' => $validated['storage_location_id'],
                    'movement_type'    => 'WASTE',
                    'qty'              => $takeQty,
                    'unit_id'          => $validated['unit_id'],
                    'reference_type'   => WasteLog::class,
                    'reference_id'     => $wasteLog->id,
                    'created_by'       => $userId,
                ]);

                $neededQty -=$takeQty;
            }
        });

        return redirect()->back()->with('success', 'Pencatatan Waste berhasil disimpan & stok FEFO telah dipotong.');
    }
}