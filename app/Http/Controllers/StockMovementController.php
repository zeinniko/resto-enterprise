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
            'branch:id,name,code',
            'item:id,name,sku',
            'stockBatch:id,batch_number,exp_date',
            'fromLocation:id,name',
            'toLocation:id,name',
            'unit:id,name,symbol',
            'creator:id,name',
            'reference',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('item', fn($i) => $i->where('name', 'like', "%{$search}%")
                                                  ->orWhere('sku', 'like', "%{$search}%"))
                  ->orWhereHas('stockBatch', fn($b) => $b->where('batch_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function (StockMovement $movement) {
                $ref = $movement->reference;
                $refNumber = null;

                if ($ref) {
                    $refNumber = $ref->receipt_number
                        ?? $ref->transfer_number
                        ?? $ref->production_number
                        ?? $ref->opname_number
                        ?? $ref->waste_number
                        ?? $ref->order_number
                        ?? ('#' . $ref->id);
                }

                $movement->setAttribute('reference_label', $refNumber);
                $movement->setAttribute(
                    'reference_short_type',
                    $movement->reference_type ? class_basename($movement->reference_type) : null
                );

                return $movement;
            });

        return Inertia::render('StockMovements/Index', [
            'movements' => $movements,
            'branches'  => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'filters'   => $request->only(['search', 'movement_type', 'branch_id', 'date_from', 'date_to']),
        ]);
    }
}