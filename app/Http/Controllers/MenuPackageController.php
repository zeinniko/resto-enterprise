<?php

namespace App\Http\Controllers;

use App\Models\MenuPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuPackageController extends Controller
{
    public function index(Request $request)
    {
        $packages = MenuPackage::when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('MenuPackages/Index', [
            'packages' => $packages,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        MenuPackage::create($validated);
        return redirect()->back()->with('success', 'Paket combo berhasil dibuat.');
    }
}