<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branch::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('code', 'like', "%{$request->search}%");
        })->latest()->paginate(10)->withQueryString();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        // Konversi nilai dari Frontend (Kapital) ke nilai Enum DB (headquarter, central_kitchen, outlet)
        $this->normalizeTypeInput($request);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:branches,code', // Diperbaiki: sku -> code
            'name' => 'required|string|max:255',
            'type' => 'required|in:headquarter,central_kitchen,outlet', // Sesuai Enum DB yang ada
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'required|boolean',
        ]);

        Branch::create($validated);

        return redirect()->back()->with('success', 'Cabang baru berhasil ditambahkan.');
    }

    public function update(Request $request, Branch $branch)
    {
        // Konversi nilai dari Frontend (Kapital) ke nilai Enum DB
        $this->normalizeTypeInput($request);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:branches,code,' . $branch->id, // Diperbaiki: sku -> code
            'name' => 'required|string|max:255',
            'type' => 'required|in:headquarter,central_kitchen,outlet',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'required|boolean',
        ]);

        $branch->update($validated);

        return redirect()->back()->with('success', 'Data cabang berhasil diperbarui.');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return redirect()->back()->with('success', 'Cabang berhasil dihapus.');
    }

    /**
     * Helper untuk memetakan input type dari UI ke format enum DB
     */
    private function normalizeTypeInput(Request $request): void
    {
        $typeMap = [
            'HQ' => 'headquarter',
            'CENTRAL_KITCHEN' => 'central_kitchen',
            'OUTLET' => 'outlet',
        ];

        if ($request->has('type') && isset($typeMap[$request->type])) {
            $request->merge(['type' => $typeMap[$request->type]]);
        }
    }
}