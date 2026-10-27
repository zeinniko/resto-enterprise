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
use Inertia\Inertia;

class WasteLogController extends Controller
{
    public function index(Request $request)
    {
        $query = WasteLog::with(['branch', 'storageLocation', 'item', 'stockBatch', 'unit', 'logger']);

        if ($request->search) {
            $query->whereHas('item', fn($i) => $i->where('name', 'like', "%{$request->search}%"))
                  ->orWhere('reason', 'like', "%{$request->search}%");
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $wasteLogs = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('WasteLogs/Index', [
            'wasteLogs' => $wasteLogs,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'storageLocations' => StorageLocation::where('is_active', true)->get(),
            'items' => Item::with('primaryUnit')->where('is_active', true)->get(),
            'units' => Unit::select('id', 'name', 'symbol')->get(),
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'item_id' => 'required|exists:items,id',
            'qty' => 'required|numeric|gt:0',
            'unit_id' => 'required|exists:units,id',
            'reason' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $neededQty = $validated['qty'];

            // Ambil batch stok FEFO yang tersedia
            $batches = StockBatch::where('branch_id', $validated['branch_id'])
                ->where('storage_location_id', $validated['storage_location_id'])
                ->where('item_id', $validated['item_id'])
                ->where('current_qty', '>', 0)
                ->orderBy('exp_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            if ($batches->sum('current_qty') < $neededQty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'qty' => 'Stok fisik pada lokasi ini tidak mencukupi untuk dicatat sebagai waste.'
                ]);
            }

            foreach ($batches as $batch) {
                if ($neededQty <= 0) break;

                $takeQty = min($batch->current_qty, $neededQty);
                $batch->decrement('current_qty', $takeQty);

                $unitCost = $batch->unit_cost;
                $totalCost = $takeQty * $unitCost;

                $wasteLog = WasteLog::create([
                    'branch_id' => $validated['branch_id'],
                    'storage_location_id' => $validated['storage_location_id'],
                    'item_id' => $validated['item_id'],
                    'stock_batch_id' => $batch->id,
                    'qty' => $takeQty,
                    'unit_id' => $validated['unit_id'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                    'reason' => $validated['reason'],
                    'logged_by' => $request->user()?->id ?? 1,
                ]);

                StockMovement::create([
                    'branch_id' => $validated['branch_id'],
                    'item_id' => $validated['item_id'],
                    'stock_batch_id' => $batch->id,
                    'from_location_id' => $validated['storage_location_id'],
                    'movement_type' => 'WASTE',
                    'qty' => $takeQty,
                    'unit_id' => $validated['unit_id'],
                    'reference_type' => WasteLog::class,
                    'reference_id' => $wasteLog->id,
                    'created_by' => $request->user()?->id ?? 1,
                ]);

                $neededQty -= $takeQty;
            }
        });

        return redirect()->back()->with('success', 'Pencatatan Waste berhasil disimpan & stok FEFO telah dipotong.');
    }
}