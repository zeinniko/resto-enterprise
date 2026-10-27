<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ServiceChargeAllocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceChargeController extends Controller
{
    public function index(Request $request)
    {
        $records = ServiceChargeAllocation::with('branch')->latest()->paginate(10);
        return Inertia::render('ServiceCharges/Index', [
            'records' => $records,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'period' => 'required|string|max:7',
            'total_pool' => 'required|numeric|min:0',
        ]);

        ServiceChargeAllocation::create($validated);
        return redirect()->back()->with('success', 'Alokasi service charge berhasil dicatat.');
    }
}