<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovement::with([
            'branch', 
            'item', 
            'stockBatch', 
            'fromLocation', 
            'toLocation', 
            'unit', 
            'creator'
        ]);

        if ($request->search) {
            $query->whereHas('item', fn($i) => $i->where('name', 'like', "%{$request->search}%"))
                  ->orWhereHas('stockBatch', fn($b) => $b->where('batch_number', 'like', "%{$request->search}%"));
        }

        if ($request->movement_type) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $movements = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('StockMovements/Index', [
            'movements' => $movements,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['search', 'movement_type', 'branch_id']),
        ]);
    }
}