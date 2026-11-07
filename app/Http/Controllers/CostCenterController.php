<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CostCenter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CostCenterController extends Controller
{
    public function index(Request $request)
    {
        $costCenters = CostCenter::with('branch')
            ->when($request->search, function ($q) use ($request) {
                $q->where('sku', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('CostCenters/Index', [
            'costCenters' => $costCenters,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'sku')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'sku' => 'required|string|max:30|unique:cost_centers,sku',
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        CostCenter::create($validated);

        return redirect()->back()->with('success', 'Cost Center berhasil ditambahkan.');
    }

    public function update(Request $request, CostCenter $costCenter)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'sku' => 'required|string|max:30|unique:cost_centers,sku,' . $costCenter->id,
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
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