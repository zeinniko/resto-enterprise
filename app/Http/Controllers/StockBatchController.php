<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockBatchController extends Controller
{
    public function index(Request $request)
    {
        $query = StockBatch::with(['branch', 'storageLocation', 'item', 'unit']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('batch_number', 'like', "%{$request->search}%")
                  ->orWhereHas('item', fn($i) => $i->where('name', 'like', "%{$request->search}%"));
            });
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('active_only') && $request->active_only === 'true') {
            $query->where('current_qty', '>', 0);
        }

        $stockBatches = $query->orderBy('exp_date', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('StockBatches/Index', [
            'stockBatches' => $stockBatches,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['search', 'branch_id', 'active_only']),
        ]);
    }
}