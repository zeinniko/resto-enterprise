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
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductionOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductionOrder::with([
            'branch:id,name,code',
            'recipe:id,menu_item_id,yield_qty',
            'recipe.menuItem:id,name',
            'targetItem:id,name,sku',
            'storageLocation:id,name',
            'unit:id,name,symbol',
            'creator:id,name',
            'items.item:id,name,sku',
            'items.unit:id,name,symbol',
        ]);

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('production_number', 'like', "\%{$search}%")
                  ->orWhereHas('targetItem', fn($i) => $i->where('name', 'like', "\%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status',$request->status);
        }

        $productionOrders =$query->latest()->paginate(10)->withQueryString();

        $ckBranches = Branch::where('is_active', true)
            ->whereIn('type', ['HQ', 'CENTRAL_KITCHEN'])
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        $recipes = Recipe::with([
            'menuItem:id,name',
            'recipeItems.item:id,name,sku',
            'recipeItems.unit:id,name,symbol',
        ])
            ->where('is_active', true)
            ->get();

        $targetItems = Item::with('primaryUnit:id,name,symbol')
            ->where('is_active', true)
            ->select('id', 'name', 'sku', 'primary_unit_id')
            ->orderBy('name')
            ->get();

        $storageLocations = StorageLocation::where('is_active', true)
            ->select('id', 'branch_id', 'name')
            ->orderBy('name')
            ->get();

        $units = Unit::select('id', 'name', 'symbol')->orderBy('name')->get();

        return Inertia::render('ProductionOrders/Index', [
            'productionOrders' => $productionOrders,
            'ckBranches'       => $ckBranches,
            'recipes'          => $recipes,
            'targetItems'      => $targetItems,
            'storageLocations' => $storageLocations,
            'units'            => $units,
            'filters'          => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'           => 'required|exists:branches,id',
            'recipe_id'           => 'required|exists:recipes,id',
            'target_item_id'      => 'required|exists:items,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'production_number'   => 'required|string|max:50|unique:production_orders,production_number',
            'target_qty'          => 'required|numeric|gt:0',
            'unit_id'             => 'required|exists:units,id',
            'production_date'     => 'required|date',
        ]);

        DB::transaction(function () use ($validated,$request) {
            $recipe = Recipe::with('recipeItems')->findOrFail($validated['recipe_id']);

            $po = ProductionOrder::create([
                'production_number'   => $validated['production_number'],
                'branch_id'           => $validated['branch_id'],
                'recipe_id'           => $validated['recipe_id'],
                'target_item_id'      => $validated['target_item_id'],
                'storage_location_id' => $validated['storage_location_id'],
                'target_qty'          => $validated['target_qty'],
                'actual_qty'          => 0,
                'unit_id'             => $validated['unit_id'],
                'status'              => 'PLANNED',
                'production_date'     => $validated['production_date'],
                'created_by'          => $request->user()?->id,
            ]);

            $yieldQty   = max((float) $recipe->yield_qty, 1);$multiplier = (float) $validated['target_qty'] /$yieldQty;

            foreach ($recipe->recipeItems as$recipeItem) {
                $qtyNeeded = round((float)$recipeItem->quantity * $multiplier, 4);$po->items()->create([
                    'item_id'      => $recipeItem->item_id,
                    'qty_required' => $qtyNeeded,
                    'qty_used'     => $qtyNeeded,
                    'unit_id'      => $recipeItem->unit_id,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Rencana Produksi Central Kitchen berhasil dibuat.');
    }

    public function start(ProductionOrder $productionOrder)
    {
        if ($productionOrder->status !== 'PLANNED') {
            return redirect()->back()->withErrors([
                'message' => 'Hanya order produksi berstatus PLANNED yang dapat dimulai.',
            ]);
        }

        $productionOrder->update(['status' => 'IN_PROGRESS']);

        return redirect()->back()->with('success', "Produksi {$productionOrder->production_number} sedang diproses (IN_PROGRESS).");
    }

    public function complete(Request $request, ProductionOrder$productionOrder)
    {
        if (!in_array($productionOrder->status, ['PLANNED', 'IN_PROGRESS'])) {
            return redirect()->back()->withErrors([
                'message' => 'Order produksi ini tidak dapat diselesaikan.',
            ]);
        }

        $validated =$request->validate([
            'actual_qty'       => 'required|numeric|gt:0',
            'exp_date'         => 'nullable|date',
            'items'            => 'required|array|min:1',
            'items.*.id'       => 'required|exists:production_order_items,id',
            'items.*.qty_used' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($productionOrder, $validated,$request) {
            $userId =$request->user()?->id;
            $totalProductionCost = 0;

            foreach ($validated['items'] as $itemData) {$poItem = $productionOrder->items()->with(['item', 'unit'])->findOrFail($itemData['id']);
                $qtyUsed = (float)$itemData['qty_used'];

                $poItem->update(['qty_used' =>$qtyUsed]);

                if ($qtyUsed <= 0) {
                    continue;
                }

                $batches = StockBatch::where('branch_id',$productionOrder->branch_id)
                    ->where('item_id', $poItem->item_id)
                    ->where('current_qty', '>', 0)
                    ->orderByRaw('exp_date IS NULL ASC')
                    ->orderBy('exp_date', 'asc')
                    ->orderBy('created_at', 'asc')
                    ->lockForUpdate()
                    ->get();

                $availableQty = (float)$batches->sum('current_qty');
                if ($availableQty < $qtyUsed) {$itemName = $poItem->item?->name ?? "Item #{$poItem->item_id}";
                    $symbol   =$poItem->unit?->symbol ?? '';
                    throw ValidationException::withMessages([
                        'message' => "Stok bahan baku {$itemName} tidak mencukupi (Tersedia: {$availableQty} {$symbol}, Terpakai: {$qtyUsed} {$symbol}).",
                    ]);
                }

                $neededQty =$qtyUsed;
                foreach ($batches as$batch) {
                    if ($neededQty <= 0) {
                        break;
                    }

                    $takeQty = min((float) $batch->current_qty,$neededQty);
                    $batch->decrement('current_qty',$takeQty);

                    $totalProductionCost += ($takeQty * (float)$batch->unit_cost);

                    StockMovement::create([
                        'branch_id'        => $productionOrder->branch_id,
                        'item_id'          => $poItem->item_id,
                        'stock_batch_id'   => $batch->id,
                        'from_location_id' => $batch->storage_location_id,
                        'movement_type'    => 'OUT_PRODUCTION',
                        'qty'              => $takeQty,
                        'unit_id'          => $poItem->unit_id,
                        'reference_type'   => ProductionOrder::class,
                        'reference_id'     => $productionOrder->id,
                        'created_by'       => $userId,
                    ]);

                    $neededQty -=$takeQty;
                }
            }

            $actualQty = (float)$validated['actual_qty'];
            $unitCost  =$actualQty > 0 ? round($totalProductionCost / $actualQty, 2) : 0;

            $newBatch = StockBatch::create([
                'branch_id'           => $productionOrder->branch_id,
                'storage_location_id' => $productionOrder->storage_location_id,
                'item_id'             => $productionOrder->target_item_id,
                'production_order_id' => $productionOrder->id,
                'batch_number'        => "CK-{$productionOrder->production_number}",
                'initial_qty'         => $actualQty,
                'current_qty'         => $actualQty,
                'unit_id'             => $productionOrder->unit_id,
                'unit_cost'           => $unitCost,
                'exp_date'            => $validated['exp_date'] ?: null,
            ]);

            StockMovement::create([
                'branch_id'      => $productionOrder->branch_id,
                'item_id'        => $productionOrder->target_item_id,
                'stock_batch_id' => $newBatch->id,
                'to_location_id' => $productionOrder->storage_location_id,
                'movement_type'  => 'IN_PRODUCTION',
                'qty'            => $actualQty,
                'unit_id'        => $productionOrder->unit_id,
                'reference_type' => ProductionOrder::class,
                'reference_id'   => $productionOrder->id,
                'created_by'     => $userId,
            ]);

            $productionOrder->update([
                'actual_qty' => $actualQty,
                'status'     => 'COMPLETED',
            ]);
        });

        return redirect()->back()->with('success', 'Produksi selesai. Bahan baku dipotong FEFO & batch hasil produksi siap digunakan.');
    }

    public function cancel(ProductionOrder $productionOrder)
    {
        if (!in_array($productionOrder->status, ['PLANNED', 'IN_PROGRESS'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya produksi berstatus PLANNED atau IN_PROGRESS yang dapat dibatalkan.',
            ]);
        }

        $productionOrder->update(['status' => 'CANCELLED']);

        return redirect()->back()->with('success', "Order produksi {$productionOrder->production_number} dibatalkan.");
    }

    public function destroy(ProductionOrder $productionOrder)
    {
        if (!in_array($productionOrder->status, ['PLANNED', 'CANCELLED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya produksi berstatus PLANNED atau CANCELLED yang dapat dihapus.',
            ]);
        }

        DB::transaction(function () use ($productionOrder) {
            $productionOrder->items()->delete();$productionOrder->delete();
        });

        return redirect()->back()->with('success', 'Order produksi berhasil dihapus.');
    }
}