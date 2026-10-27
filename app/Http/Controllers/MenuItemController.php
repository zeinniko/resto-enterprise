<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuItem::with('recipe');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        $menuItems = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('MenuItems/Index', [
            'menuItems' => $menuItems,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:menu_items,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'selling_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        MenuItem::create($validated);

        return redirect()->back()->with('success', 'Menu penjualan berhasil ditambahkan.');
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:menu_items,code,' . $menuItem->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'selling_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $menuItem->update($validated);

        return redirect()->back()->with('success', 'Menu penjualan berhasil diperbarui.');
    }

    public function destroy(MenuItem $menuItem)
    {
        if ($menuItem->orderItems()->exists()) {
            return redirect()->back()->withErrors(['message' => 'Menu tidak dapat dihapus karena memiliki riwayat transaksi order.']);
        }

        $menuItem->delete();

        return redirect()->back()->with('success', 'Menu penjualan berhasil dihapus.');
    }
}