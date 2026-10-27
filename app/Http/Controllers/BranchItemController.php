<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchItem;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchItemController extends Controller
{
    public function index(Request $request)
    {
        $items = BranchItem::with(['branch', 'item'])
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('BranchItems/Index', [
            'branchItems' => $items,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'items' => Item::select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'item_id' => 'required|exists:items,id',
            'custom_price' => 'nullable|numeric|min:0',
            'is_available' => 'required|boolean',
        ]);

        BranchItem::create($validated);
        return redirect()->back()->with('success', 'Setting item cabang berhasil disimpan.');
    }
}