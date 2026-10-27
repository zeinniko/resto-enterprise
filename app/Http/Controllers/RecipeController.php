<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\MenuItem;
use App\Models\Recipe;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $query = Recipe::with(['menuItem', 'recipeItems.item', 'recipeItems.unit']);

        if ($request->search) {
            $query->whereHas('menuItem', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        $recipes = $query->latest()->paginate(10)->withQueryString();

        // Ambil menu yang belum memiliki resep atau menu yang sedang diedit
        $availableMenuItems = MenuItem::whereDoesntHave('recipe')->select('id', 'name', 'code')->get();
        $rawItems = Item::with('primaryUnit')->where('is_active', true)->select('id', 'name', 'sku', 'primary_unit_id')->get();
        $units = Unit::select('id', 'name', 'symbol')->get();

        return Inertia::render('Recipes/Index', [
            'recipes' => $recipes,
            'availableMenuItems' => $availableMenuItems,
            'rawItems' => $rawItems,
            'units' => $units,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id|unique:recipes,menu_item_id',
            'yield_qty' => 'required|numeric|gt:0',
            'instructions' => 'nullable|string',
            'is_active' => 'required|boolean',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.waste_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($validated) {
            $recipe = Recipe::create([
                'menu_item_id' => $validated['menu_item_id'],
                'yield_qty' => $validated['yield_qty'],
                'instructions' => $validated['instructions'] ?? null,
                'is_active' => $validated['is_active'],
            ]);

            foreach ($validated['items'] as $recipeItem) {
                $recipe->recipeItems()->create([
                    'item_id' => $recipeItem['item_id'],
                    'quantity' => $recipeItem['quantity'],
                    'unit_id' => $recipeItem['unit_id'],
                    'waste_percentage' => $recipeItem['waste_percentage'] ?? 0,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Resep BOM berhasil disimpan.');
    }

    public function update(Request $request, Recipe $recipe)
    {
        $validated = $request->validate([
            'yield_qty' => 'required|numeric|gt:0',
            'instructions' => 'nullable|string',
            'is_active' => 'required|boolean',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.waste_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($recipe, $validated) {
            $recipe->update([
                'yield_qty' => $validated['yield_qty'],
                'instructions' => $validated['instructions'] ?? null,
                'is_active' => $validated['is_active'],
            ]);

            $recipe->recipeItems()->delete();

            foreach ($validated['items'] as $recipeItem) {
                $recipe->recipeItems()->create([
                    'item_id' => $recipeItem['item_id'],
                    'quantity' => $recipeItem['quantity'],
                    'unit_id' => $recipeItem['unit_id'],
                    'waste_percentage' => $recipeItem['waste_percentage'] ?? 0,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Resep BOM berhasil diperbarui.');
    }

    public function destroy(Recipe $recipe)
    {
        DB::transaction(function () use ($recipe) {
            $recipe->recipeItems()->delete();
            $recipe->delete();
        });

        return redirect()->back()->with('success', 'Resep berhasil dihapus.');
    }
}