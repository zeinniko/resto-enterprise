<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $brands = Brand::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('code', 'like', "%{$request->search}%");
        })->latest()->paginate(10)->withQueryString();

        return Inertia::render('Brands/Index', [
            'brands' => $brands,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:brands,code',
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        Brand::create($validated);

        return redirect()->back()->with('success', 'Brand baru berhasil ditambahkan.');
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:brands,code,' . $brand->id,
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $brand->update($validated);

        return redirect()->back()->with('success', 'Data brand berhasil diperbarui.');
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return redirect()->back()->with('success', 'Brand berhasil dihapus.');
    }
}