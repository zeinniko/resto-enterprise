<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\MenuPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MenuPackageController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuPackage::with(['menuItem', 'items.menuItem']);

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $packages = $query->latest()->paginate(10)->withQueryString();
        $menuItems = MenuItem::where('is_active', true)->select('id', 'name', 'code', 'selling_price')->get();

        return Inertia::render('MenuPackages/Index', [
            'packages' => $packages,
            'menuItems' => $menuItems,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'name' => 'required|string|max:255',
            'package_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.qty' => 'required|integer|min:1',
        ], [
            'menu_item_id.required' => 'Pilih menu POS utama untuk identitas paket ini.',
            'items.required' => 'Masukkan minimal 1 menu penyusun ke dalam paket.',
        ]);

        DB::transaction(function () use ($validated) {
            $package = MenuPackage::create([
                'menu_item_id' => $validated['menu_item_id'],
                'name' => $validated['name'],
                'package_price' => $validated['package_price'],
                'is_active' => $validated['is_active'],
            ]);

            foreach ($validated['items'] as $item) {
                $package->items()->create([
                    'menu_item_id' => $item['menu_item_id'],
                    'qty' => $item['qty'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Paket combo bundling berhasil dibuat.');
    }

    public function update(Request $request, MenuPackage $menuPackage)
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'name' => 'required|string|max:255',
            'package_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($menuPackage, $validated) {
            $menuPackage->update([
                'menu_item_id' => $validated['menu_item_id'],
                'name' => $validated['name'],
                'package_price' => $validated['package_price'],
                'is_active' => $validated['is_active'],
            ]);

            $menuPackage->items()->delete();

            foreach ($validated['items'] as $item) {
                $menuPackage->items()->create([
                    'menu_item_id' => $item['menu_item_id'],
                    'qty' => $item['qty'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Paket combo bundling berhasil diperbarui.');
    }

    public function destroy(MenuPackage $menuPackage)
    {
        DB::transaction(function () use ($menuPackage) {
            $menuPackage->items()->delete();
            $menuPackage->delete();
        });

        return redirect()->back()->with('success', 'Paket combo bundling berhasil dihapus.');
    }
}