<?php

namespace App\Http\Controllers;

use App\Models\CostCenter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CostCenterController extends Controller
{
    public function index(Request $request)
    {
        $costCenters = CostCenter::when($request->search, function ($q) use ($request) {
            $q->where('code', 'like', "%{$request->search}%")
              ->orWhere('name', 'like', "%{$request->search}%");
        })
        ->latest()
        ->paginate(10)
        ->withQueryString();

        return Inertia::render('CostCenters/Index', [
            'costCenters' => $costCenters,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:cost_centers,code',
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ], [
            'code.unique' => 'Kode Cost Center ini sudah terdaftar.',
        ]);

        CostCenter::create($validated);

        return redirect()->back()->with('success', 'Cost Center berhasil ditambahkan.');
    }

    public function update(Request $request, CostCenter $costCenter)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:cost_centers,code,' . $costCenter->id,
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ], [
            'code.unique' => 'Kode Cost Center ini sudah terdaftar.',
        ]);

        $costCenter->update($validated);

        return redirect()->back()->with('success', 'Cost Center berhasil diperbarui.');
    }

    public function destroy(CostCenter $costCenter)
    {
        $costCenter->delete();

        return redirect()->back()->with('success', 'Cost Center berhasil dihapus.');
    }
}