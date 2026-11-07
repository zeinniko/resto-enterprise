<?php

namespace App\Http\Controllers;

use App\Models\MenuExtra;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuExtraController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuExtra::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $extras = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('MenuExtras/Index', [
            'extras' => $extras,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean', // Diperbaiki: is_available -> is_active
        ]);

        MenuExtra::create($validated);

        return redirect()->back()->with('success', 'Topping / Extra berhasil ditambahkan.');
    }

    public function update(Request $request, MenuExtra $menuExtra)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean', // Diperbaiki: is_available -> is_active
        ]);

        $menuExtra->update($validated);

        return redirect()->back()->with('success', 'Topping / Extra berhasil diperbarui.');
    }

    public function destroy(MenuExtra $menuExtra)
    {
        $menuExtra->delete();

        return redirect()->back()->with('success', 'Topping / Extra berhasil dihapus.');
    }
}