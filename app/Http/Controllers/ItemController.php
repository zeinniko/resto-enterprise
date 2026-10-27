<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with(['category', 'primaryUnit', 'purchaseUnit']);

        if ($request->search) {$query->where(function ($q) use ($request) {
                $q->where('name', 'like', "\%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id',$request->category_id);
        }

        $items =$query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Items/Index', [
            'items' => $items,
            'categories' => Category::select('id', 'name')->get(),
            'units' => Unit::select('id', 'name', 'symbol')->get(),
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|string|max:50|unique:items,sku',
            'name' => 'required|string|max:255',
            'primary_unit_id' => 'required|exists:units,id',
            'purchase_unit_id' => 'required|exists:units,id',
            'shelf_life_days' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        Item::create($validated);

        return redirect()->back()->with('success', 'SKU Item berhasil ditambahkan.');
    }

    public function update(Request $request, Item$item)
    {
        $validated =$request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|string|max:50|unique:items,sku,' . $item->id,
            'name' => 'required|string|max:255',
            'primary_unit_id' => 'required|exists:units,id',
            'purchase_unit_id' => 'required|exists:units,id',
            'shelf_life_days' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'SKU Item berhasil diperbarui.');
    }

    public function destroy(Item $item)
    {
        $item->delete();

        return redirect()->back()->with('success', 'SKU Item berhasil dihapus.');
    }
}