<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\ProductionOrder;
use App\Models\Recipe;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductionOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductionOrder::with([
            'branch',
            'recipe.menuItem',
            'targetItem',
            'storageLocation',
            'unit',
            'items.item',
            'items.unit'
        ]);

        if ($request->search) {
            $query->where('production_number', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $productionOrders = $query->latest()->paginate(10)->withQueryString();

        $ckBranches = Branch::whereIn('type', ['HQ', 'CENTRAL_KITCHEN'])->get();
        $recipes = Recipe::with(['menuItem', 'recipeItems.item', 'recipeItems.unit'])->where('is_active', true)->get();
        $targetItems = Item::where('is_active', true)->get();
        $storageLocations = StorageLocation::where('is_active', true)->get();
        $units = Unit::select('id', 'name', 'symbol')->get();

        return Inertia::render('ProductionOrders/Index', [
            'productionOrders' => $productionOrders,
            'ckBranches' => $ckBranches,
            'recipes' => $recipes,
            'targetItems' => $targetItems,
            'storageLocations' => $storageLocations,
            'units' => $units,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'recipe_id' => 'required|exists:recipes,id',
            'target_item_id' => 'required|exists:items,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'production_number' => 'required|string|max:50|unique:production_orders,production_number',
            'target_qty' => 'required|numeric|gt:0',
            'unit_id' => 'required|exists:units,id',
            'production_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $recipe = Recipe::with('recipeItems')->findOrFail($validated['recipe_id']);

            $po = ProductionOrder::create([
                'production_number' => $validated['production_number'],
                'branch_id' => $validated['branch_id'],
                'recipe_id' => $validated['recipe_id'],
                'target_item_id' => $validated['target_item_id'],
                'storage_location_id' => $validated['storage_location_id'],
                'target_qty' => $validated['target_qty'],
                'unit_id' => $validated['unit_id'],
                'status' => 'DRAFT',
                'production_date' => $validated['production_date'],
                'created_by' => $request->user()?->id ?? 1,
            ]);

            // Hitung estimasi bahan baku terpakai dari Resep (BOM)
            $multiplier = $validated['target_qty'] / max($recipe->yield_qty, 1);
            foreach ($recipe->recipeItems as $recipeItem) {
                $qtyNeeded = $recipeItem->quantity * $multiplier;
                $po->items()->create([
                    'item_id' => $recipeItem->item_id,
                    'qty_required' => $qtyNeeded,
                    'qty_used' => $qtyNeeded,
                    'unit_id' => $recipeItem->unit_id,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Rencana Produksi Central Kitchen berhasil dibuat.');
    }

    public function complete(Request $request, ProductionOrder $productionOrder)
    {
        if ($productionOrder->status === 'COMPLETED') {
            return redirect()->back()->withErrors(['message' => 'Order produksi sudah selesai sebelumnya.']);
        }

        $validated = $request->validate([
            'actual_qty' => 'required|numeric|gt:0',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:production_order_items,id',
            'items.*.qty_used' => 'required|numeric|gt:0',
        ]);

        DB::transaction(function () use ($productionOrder, $validated, $request) {
            // 1. Update status produksi
            $productionOrder->update([
                'actual_qty' => $validated['actual_qty'],
                'status' => 'COMPLETED',
            ]);

            // 2. Potong bahan mentah berbasis FEFO & hitung HPP produksi
            $totalProductionCost = 0;

            foreach ($validated['items'] as $itemData) {
                $poItem = $productionOrder->items()->findOrFail($itemData['id']);
                $poItem->update(['qty_used' => $itemData['qty_used']]);

                $neededQty = $itemData['qty_used'];
                $batches = StockBatch::where('branch_id', $productionOrder->branch_id)
                    ->where('item_id', $poItem->item_id)
                    ->where('current_qty', '>', 0)
                    ->orderBy('exp_date', 'asc')
                    ->orderBy('created_at', 'asc')
                    ->get();

                foreach ($batches as $batch) {
                    if ($neededQty <= 0) break;

                    $takeQty = min($batch->current_qty, $neededQty);
                    $batch->decrement('current_qty', $takeQty);

                    $totalProductionCost += ($takeQty * $batch->unit_cost);

                    StockMovement::create([
                        'branch_id' => $productionOrder->branch_id,
                        'item_id' => $poItem->item_id,
                        'stock_batch_id' => $batch->id,
                        'from_location_id' => $batch->storage_location_id,
                        'movement_type' => 'OUT_PRODUCTION',
                        'qty' => $takeQty,
                        'unit_id' => $poItem->unit_id,
                        'reference_type' => ProductionOrder::class,
                        'reference_id' => $productionOrder->id,
                        'created_by' => $request->user()?->id ?? 1,
                    ]);

                    $neededQty -= $takeQty;
                }
            }

            // 3. Tambah Stok Hasil Produksi Baru di Central Kitchen (Stock Batch)
            $unitCost = $validated['actual_qty'] > 0 ? ($totalProductionCost / $validated['actual_qty']) : 0;

            $newBatch = StockBatch::create([
                'branch_id' => $productionOrder->branch_id,
                'storage_location_id' => $productionOrder->storage_location_id,
                'item_id' => $productionOrder->target_item_id,
                'production_order_id' => $productionOrder->id,
                'batch_number' => "CK-{$productionOrder->production_number}",
                'initial_qty' => $validated['actual_qty'],
                'current_qty' => $validated['actual_qty'],
                'unit_id' => $productionOrder->unit_id,
                'unit_cost' => $unitCost,
            ]);

            StockMovement::create([
                'branch_id' => $productionOrder->branch_id,
                'item_id' => $productionOrder->target_item_id,
                'stock_batch_id' => $newBatch->id,
                'to_location_id' => $productionOrder->storage_location_id,
                'movement_type' => 'IN_PRODUCTION',
                'qty' => $validated['actual_qty'],
                'unit_id' => $productionOrder->unit_id,
                'reference_type' => ProductionOrder::class,
                'reference_id' => $productionOrder->id,
                'created_by' => $request->user()?->id ?? 1,
            ]);
        });

        return redirect()->back()->with('success', 'Produksi selesai. Bahan baku telah dipotong FEFO & hasil produksi siap digunakan.');
    }
}