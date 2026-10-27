<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\PettyCash;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PettyCashController extends Controller
{
    public function index(Request $request)
    {
        $records = PettyCash::with('branch')
            ->when($request->search, fn($q) => $q->where('description', 'like', "%{$request->search}%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('PettyCash/Index', [
            'records' => $records,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'type' => 'required|in:IN,OUT',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
        ]);

        PettyCash::create($validated);
        return redirect()->back()->with('success', 'Transaksi kas kecil berhasil dicatat.');
    }
}