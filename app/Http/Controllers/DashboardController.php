<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\Order;
use App\Models\PurchaseOrder;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->branch_id;

        $totalSales = Order::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where('payment_status', 'PAID')
            ->sum('final_total');

        $totalOrders = Order::when($branchId, fn($q) => $q->where('branch_id', $branchId))->count();
        
        $pendingPOs = PurchaseOrder::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->whereIn('status', ['DRAFT', 'SUBMITTED'])
            ->count();

        $activeShifts = Shift::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where('status', 'OPEN')
            ->count();

        $recentOrders = Order::with(['branch', 'salesMode'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'totalSales' => $totalSales,
                'totalOrders' => $totalOrders,
                'pendingPOs' => $pendingPOs,
                'activeShifts' => $activeShifts,
            ],
            'recentOrders' => $recentOrders,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => ['branch_id' => $branchId],
        ]);
    }
}