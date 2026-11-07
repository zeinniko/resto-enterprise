<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchItem;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BranchItemController extends Controller
{
    public function index(Request $request)
    {
        $query = BranchItem::with(['branch', 'item.primaryUnit']);

        if ($request->search) {
            $query->whereHas('item', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $branchItems = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('BranchItems/Index', [
            'branchItems' => $branchItems,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'items' => Item::where('is_active', true)->select('id', 'name', 'sku')->get(), // Diperbaiki: code -> sku
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'item_id' => [
                'required',
                'exists:items,id',
                Rule::unique('branch_items')->where(fn ($query) => $query->where('branch_id', $request->branch_id)),
            ],
            'min_stock' => 'required|numeric|min:0',
            'reorder_point' => 'required|numeric|min:0',
            'purchase_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ], [
            'item_id.unique' => 'SKU Item ini sudah dialokasikan pada cabang yang dipilih.',
        ]);

        BranchItem::create($validated);

        return redirect()->back()->with('success', 'Setting item cabang berhasil disimpan.');
    }

    public function update(Request $request, BranchItem $branchItem)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'item_id' => [
                'required',
                'exists:items,id',
                Rule::unique('branch_items')
                    ->where(fn ($query) => $query->where('branch_id', $request->branch_id))
                    ->ignore($branchItem->id),
            ],
            'min_stock' => 'required|numeric|min:0',
            'reorder_point' => 'required|numeric|min:0',
            'purchase_price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ], [
            'item_id.unique' => 'SKU Item ini sudah dialokasikan pada cabang yang dipilih.',
        ]);
    
        $branchItem->update($validated);
    
        return redirect()->back()->with('success', 'Setting item cabang berhasil diperbarui.');
    }

    public function destroy(BranchItem $branchItem)
    {
        $branchItem->delete();

        return redirect()->back()->with('success', 'Setting item cabang berhasil dihapus.');
    }
}