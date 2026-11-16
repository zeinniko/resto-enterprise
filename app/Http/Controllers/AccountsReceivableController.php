<?php

namespace App\Http\Controllers;

use App\Models\AccountsReceivable;
use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\Journal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountsReceivableController extends Controller
{
    public function index(Request $request)
    {
        $baseQuery = AccountsReceivable::query();

        if ($request->filled('branch_id')) {
            $baseQuery->where('branch_id',$request->branch_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'OVERDUE') {$baseQuery->whereIn('status', ['UNPAID', 'PARTIAL'])
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', now()->toDateString());
            } else {
                $baseQuery->where('status',$request->status);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $numericId = ltrim($search, '#');

            $baseQuery->where(function ($q) use ($search,$numericId) {
                $q->where('partner_name', 'like', "\%{$search}%");
                if (ctype_digit($numericId)) {
                    $q->orWhere('id', (int)$numericId);
                }
            });
        }

        // Ringkasan KPI Piutang sesuai filter cabang
        $summaryQuery = AccountsReceivable::query()
            ->when($request->filled('branch_id'), fn($q) => $q->where('branch_id',$request->branch_id));

        $totalUnsettled = (float) (clone$summaryQuery)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->selectRaw('COALESCE(SUM(total_amount - received_amount), 0) as remaining')
            ->value('remaining');

        $totalOverdue = (float) (clone$summaryQuery)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->selectRaw('COALESCE(SUM(total_amount - received_amount), 0) as overdue')
            ->value('overdue');

        $totalReceived = (float) (clone$summaryQuery)->sum('received_amount');

        $receivables = (clone$baseQuery)
            ->with([
                'branch:id,name,code',
                'journals' => fn($q) =>$q->with([
                    'entries.chartOfAccount:id,code,name',
                    'creator:id,name',
                ])->latest('transaction_date'),
            ])
            ->orderByRaw("CASE WHEN status = 'PAID' THEN 1 ELSE 0 END")
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date', 'asc')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $cashAccounts = ChartOfAccount::where('type', 'ASSET')
            ->where('is_active', true)
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        $expenseAccounts = ChartOfAccount::where('type', 'EXPENSE')
            ->where('is_active', true)
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        return Inertia::render('AccountsReceivable/Index', [
            'receivables'     => $receivables,
            'cashAccounts'    => $cashAccounts,
            'expenseAccounts' => $expenseAccounts,
            'branches'        => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'summary'         => [
                'unsettled_remaining' => round($totalUnsettled, 2), 'overdue_remaining'   => round($totalOverdue, 2),
                'total_received'      => round($totalReceived, 2), ], 'filters'         =>$request->only(['search', 'status', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'    => 'required|exists:branches,id',
            'partner_name' => 'required|string|max:100',
            'total_amount' => 'required|numeric|gt:0',
            'due_date'     => 'nullable|date',
        ]);

        AccountsReceivable::create([
            'branch_id'       => $validated['branch_id'],
            'partner_name'    => $validated['partner_name'],
            'total_amount'    => round((float) $validated['total_amount'], 2), 'received_amount' => 0, 'due_date'        =>$validated['due_date'] ?? null,
            'status'          => 'UNPAID',
        ]);

        return redirect()->back()->with('success', 'Catatan piutang aggregator berhasil ditambahkan.');
    }

    public function settle(Request $request, AccountsReceivable$accountsReceivable)
    {
        $validated =$request->validate([
            'settled_amount'  => 'required|numeric|gt:0',
            'admin_fee'       => 'nullable|numeric|min:0',
            'fee_account_id'  => 'nullable|exists:chart_of_accounts,id',
            'cash_account_id' => 'required|exists:chart_of_accounts,id',
            'settlement_date' => 'required|date',
            'notes'           => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($accountsReceivable, $validated,$request) {
            $ar = AccountsReceivable::where('id',$accountsReceivable->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($ar->status === 'PAID') {
                throw ValidationException::withMessages([
                    'settled_amount' => 'Tagihan piutang ini sudah dicairkan seluruhnya.',
                ]);
            }

            $remaining     = round((float)$ar->total_amount - (float) $ar->received_amount, 2);$netCashAmount = round((float) $validated['settled_amount'], 2);$adminFee      = round((float) ($validated['admin_fee'] ?? 0), 2);$totalCleared  = round($netCashAmount +$adminFee, 2);

            if ($totalCleared >$remaining + 0.01) {
                throw ValidationException::withMessages([
                    'settled_amount' => 'Total pencairan + potongan biaya melebihi sisa piutang (Rp ' . number_format($remaining, 0, ',', '.') . ').',
                ]);
            }

            if ($adminFee > 0 && empty($validated['fee_account_id'])) {
                throw ValidationException::withMessages([
                    'fee_account_id' => 'Pilih akun beban MDR / biaya admin jika ada potongan biaya.',
                ]);
            }

            $newReceived = round((float)$ar->received_amount + $totalCleared, 2);$status      = $newReceived >= round((float)$ar->total_amount, 2) ? 'PAID' : 'PARTIAL';

            $ar->update([
                'received_amount' => $newReceived,
                'status'          => $status,
            ]);

            // Cari akun Piutang Aggregator (1120 atau fallback akun ASSET bertema Piutang/Receivable)
            $arAccount = ChartOfAccount::where('code', '1120')->where('is_active', true)->first()
                ?? ChartOfAccount::where('type', 'ASSET')
                    ->where('is_active', true)
                    ->where('id', '!=', $validated['cash_account_id'])
                    ->where(function ($q) {$q->where('name', 'like', '%Piutang%')
                          ->orWhere('name', 'like', '%Receivable%')
                          ->orWhere('name', 'like', '%Aggregator%');
                    })
                    ->orderBy('code')
                    ->first();

            if ($arAccount) {$refCode   = 'AR-' . str_pad((string) $ar->id, 5, '0', STR_PAD_LEFT);$extraNote = !empty($validated['notes']) ? " ({$validated['notes']})" : '';

                $journal = Journal::create([
                    'branch_id'        => $ar->branch_id,
                    'journal_number'   => 'SETTLE-AR-' . now()->format('ymd') . '-' . strtoupper(substr(uniqid(), -5)),
                    'transaction_date' => $validated['settlement_date'],
                    'description'      => "Pencairan Piutang {$ar->partner_name} [{$refCode}]{$extraNote}",
                    'reference_type'   => AccountsReceivable::class,
                    'reference_id'     => $ar->id,
                    'created_by'       => $request->user()?->id,
                ]);

                $entries = [
                    [
                        'chart_of_account_id' => $validated['cash_account_id'],
                        'debit'               => $netCashAmount,
                        'credit'              => 0,
                    ],
                ];

                if ($adminFee > 0 && !empty($validated['fee_account_id'])) {$entries[] = [
                        'chart_of_account_id' => $validated['fee_account_id'],
                        'debit'               => $adminFee,
                        'credit'              => 0,
                    ];
                }

                $entries[] = [
                    'chart_of_account_id' => $arAccount->id,
                    'debit'               => 0,
                    'credit'              => $totalCleared,
                ];

                $journal->entries()->createMany($entries);
            }
        });

        return redirect()->back()->with('success', 'Pencairan piutang aggregator berhasil diproses & dijurnal.');
    }
}