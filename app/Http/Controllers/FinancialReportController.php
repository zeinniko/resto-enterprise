<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialReportController extends Controller
{
    public function profitAndLoss(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();
        $branchId = $request->branch_id;

        $query = JournalEntry::whereHas('journalEntry', function ($q) use ($startDate, $endDate, $branchId) {
            $q->whereBetween('date', [$startDate, $endDate])
              ->where('status', 'POSTED');
            if ($branchId) {
                $q->where('branch_id', $branchId);
            }
        });

        // Pendapatan (REVENUE)
        $revenueAccounts = ChartOfAccount::where('type', 'REVENUE')
            ->where('is_active', true)
            ->get()
            ->map(function ($acc) use ($query) {
                $debit = (clone $query)->where('chart_of_account_id', $acc->id)->sum('debit');
                $credit = (clone $query)->where('chart_of_account_id', $acc->id)->sum('credit');
                $balance = $credit - $debit;
                return [
                    'id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'total' => $balance,
                ];
            });

        // Beban Operasional & HPP (EXPENSE)
        $expenseAccounts = ChartOfAccount::where('type', 'EXPENSE')
            ->where('is_active', true)
            ->get()
            ->map(function ($acc) use ($query) {
                $debit = (clone $query)->where('chart_of_account_id', $acc->id)->sum('debit');
                $credit = (clone $query)->where('chart_of_account_id', $acc->id)->sum('credit');
                $balance = $debit - $credit;
                return [
                    'id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'total' => $balance,
                ];
            });

        $totalRevenue = $revenueAccounts->sum('total');
        $totalExpense = $expenseAccounts->sum('total');
        $netProfit = $totalRevenue - $totalExpense;

        return Inertia::render('Reports/ProfitAndLoss', [
            'revenueAccounts' => $revenueAccounts,
            'expenseAccounts' => $expenseAccounts,
            'totalRevenue' => $totalRevenue,
            'totalExpense' => $totalExpense,
            'netProfit' => $netProfit,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $branchId = $request->branch_id;

        $getAccountBalances = function ($type) use ($asOfDate, $branchId) {
            return ChartOfAccount::where('type', $type)
                ->where('is_active', true)
                ->get()
                ->map(function ($acc) use ($asOfDate, $branchId, $type) {
                    $query = JournalEntry::where('chart_of_account_id', $acc->id)
                        ->whereHas('journalEntry', function ($q) use ($asOfDate, $branchId) {
                            $q->where('date', '<=', $asOfDate)->where('status', 'POSTED');
                            if ($branchId) {
                                $q->where('branch_id', $branchId);
                            }
                        });

                    $debit = $query->sum('debit');
                    $credit = $query->sum('credit');

                    $balance = ($type === 'ASSET') ? ($debit - $credit) : ($credit - $debit);

                    return [
                        'id' => $acc->id,
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'balance' => $balance,
                    ];
                });
        };

        $assets = $getAccountBalances('ASSET');
        $liabilities = $getAccountBalances('LIABILITY');
        $equity = $getAccountBalances('EQUITY');

        $totalAssets = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity = $equity->sum('balance');

        return Inertia::render('Reports/BalanceSheet', [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'totalAssets' => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity' => $totalEquity,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => [
                'as_of_date' => $asOfDate,
                'branch_id' => $branchId,
            ],
        ]);
    }

    public function cashFlow(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();
        $branchId = $request->branch_id;

        // Ambil ID akun Aset berbasis Kas dan Bank (misal kode 11*)
        $cashAccountIds = ChartOfAccount::where('type', 'ASSET')
            ->where(function ($q) {
                $q->where('code', 'like', '11%')
                  ->orWhere('name', 'like', '%Kas%')
                  ->orWhere('name', 'like', '%Bank%');
            })
            ->pluck('id');

        $query = JournalEntry::whereIn('chart_of_account_id', $cashAccountIds)
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate, $branchId) {
                $q->whereBetween('date', [$startDate, $endDate])
                  ->where('status', 'POSTED');
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            });

        $cashIn = (clone $query)->sum('debit');
        $cashOut = (clone $query)->sum('credit');
        $netCashFlow = $cashIn - $cashOut;

        return Inertia::render('Reports/CashFlow', [
            'cashIn' => $cashIn,
            'cashOut' => $cashOut,
            'netCashFlow' => $netCashFlow,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
        ]);
    }
}