<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockBatchController extends Controller
{
    public function index(Request $request)
    {
        $query = StockBatch::with([
            'branch:id,name,code',
            'storageLocation:id,name',
            'item:id,name,sku',
            'unit:id,name,symbol',
            'goodsReceiptItem.goodsReceipt:id,receipt_number',
            'productionOrder:id,production_number',
        ]);

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_number', 'like', "\%{$search}%")
                  ->orWhereHas('item', fn($i) => $i->where('name', 'like', "\%{$search}%")
                                                    ->orWhere('sku', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id',$request->branch_id);
        }

        if ($request->boolean('active_only')) {$query->where('current_qty', '>', 0);
        }

        if ($request->filled('expiry_status')) {
            $today = now()->toDateString();$next7Days = now()->addDays(7)->toDateString();

            if ($request->expiry_status === 'expired') {
                $query->whereNotNull('exp_date')->whereDate('exp_date', '<',$today);
            } elseif ($request->expiry_status === 'near_expiry') {$query->whereNotNull('exp_date')
                      ->whereDate('exp_date', '>=', $today)
                      ->whereDate('exp_date', '<=', $next7Days);
            }
        }

        // Ringkasan KPI berdasarkan filter aktif
        $summaryQuery = clone$query;
        $today = now()->toDateString();$next7Days = now()->addDays(7)->toDateString();

        $summary = [
            'active_batches' => (clone $summaryQuery)->where('current_qty', '>', 0)->count(),
            'near_expiry'    => (clone $summaryQuery)->where('current_qty', '>', 0)
                                    ->whereNotNull('exp_date')
                                    ->whereDate('exp_date', '>=', $today)
                                    ->whereDate('exp_date', '<=', $next7Days)
                                    ->count(),
            'expired'        => (clone $summaryQuery)->where('current_qty', '>', 0)
                                    ->whereNotNull('exp_date')
                                    ->whereDate('exp_date', '<', $today)
                                    ->count(),
            'total_value'    => (float) ((clone $summaryQuery)->where('current_qty', '>', 0)
                                    ->sum(DB::raw('current_qty * unit_cost')) ?? 0),
        ];

        $stockBatches =$query
            ->orderByRaw('exp_date IS NULL ASC')
            ->orderBy('exp_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('StockBatches/Index', [
            'stockBatches' => $stockBatches,
            'branches'     => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'summary'      => $summary,
            'filters'      => [
                'search'        => $request->search ?? '',
                'branch_id'     => $request->branch_id ?? '',
                'expiry_status' => $request->expiry_status ?? '',
                'active_only'   => $request->boolean('active_only'),
            ],
        ]);
    }
}