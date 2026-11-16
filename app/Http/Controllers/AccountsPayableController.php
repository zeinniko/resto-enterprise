<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\Journal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountsPayableController extends Controller
{
    public function index(Request $request)
    {
        $baseQuery = AccountsPayable::query();

        if ($request->filled('branch_id')) {
            $baseQuery->where('branch_id', $request->branch_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'OVERDUE') {
                $baseQuery->whereIn('status', ['UNPAID', 'PARTIAL'])
                    ->whereDate('due_date', '<', now()->toDateString());
            } else {
                $baseQuery->where('status', $request->status);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $baseQuery->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        // Ringkasan KPI Hutang sesuai filter cabang
        $summaryQuery = AccountsPayable::query()
            ->when($request->filled('branch_id'), fn($q) => $q->where('branch_id', $request->branch_id));

        $totalUnpaidRemaining = (float) (clone $summaryQuery)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as remaining')
            ->value('remaining');

        $totalOverdueRemaining = (float) (clone $summaryQuery)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as overdue')
            ->value('overdue');

        $totalPaid = (float) (clone $summaryQuery)->sum('paid_amount');

        $payables = (clone $baseQuery)
            ->with([
                'supplier:id,name',
                'purchaseOrder',
                'branch:id,name,code',
                'journals' => fn($q) => $q->with(['entries.chartOfAccount:id,code,name', 'creator:id,name'])->latest('transaction_date'),
            ])
            ->orderByRaw("CASE WHEN status = 'PAID' THEN 1 ELSE 0 END")
            ->orderBy('due_date', 'asc')
            ->paginate(10)
            ->withQueryString();

        $cashAccounts = ChartOfAccount::where('type', 'ASSET')
            ->where('is_active', true)
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        return Inertia::render('AccountsPayable/Index', [
            'payables'     => $payables,
            'cashAccounts' => $cashAccounts,
            'branches'     => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'summary'      => [
                'unpaid_remaining'  => round($totalUnpaidRemaining, 2),
                'overdue_remaining' => round($totalOverdueRemaining, 2),
                'total_paid'        => round($totalPaid, 2),
            ],
            'filters'      => $request->only(['search', 'status', 'branch_id']),
        ]);
    }

    public function pay(Request $request, AccountsPayable $accountsPayable)
    {
        $validated = $request->validate([
            'payment_amount'  => 'required|numeric|gt:0',
            'cash_account_id' => 'required|exists:chart_of_accounts,id',
            'payment_date'    => 'required|date',
            'notes'           => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($accountsPayable, $validated, $request) {
            $ap = AccountsPayable::with('supplier:id,name')
                ->where('id', $accountsPayable->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($ap->status === 'PAID') {
                throw ValidationException::withMessages([
                    'payment_amount' => 'Tagihan invoice ini sudah lunas sepenuhnya.',
                ]);
            }

            $remaining     = round((float) $ap->total_amount - (float) $ap->paid_amount, 2);
            $paymentAmount = round((float) $validated['payment_amount'], 2);

            if ($paymentAmount > $remaining + 0.01) {
                throw ValidationException::withMessages([
                    'payment_amount' => 'Nominal pembayaran melebihi sisa tagihan (Rp ' . number_format($remaining, 0, ',', '.') . ').',
                ]);
            }

            $newPaid = round((float) $ap->paid_amount + $paymentAmount, 2);
            $status  = $newPaid >= round((float) $ap->total_amount, 2) ? 'PAID' : 'PARTIAL';

            $ap->update([
                'paid_amount' => $newPaid,
                'status'      => $status,
            ]);

            // Cari akun Hutang Usaha (2110 atau fallback akun LIABILITY aktif)
            $apAccount = ChartOfAccount::where('code', '2110')->where('is_active', true)->first()
                ?? ChartOfAccount::where('type', 'LIABILITY')
                    ->where('is_active', true)
                    ->orderByRaw("CASE WHEN name LIKE '%Hutang%' OR name LIKE '%Payable%' THEN 0 ELSE 1 END")
                    ->orderBy('code')
                    ->first();

            if ($apAccount) {
                $supplierName = $ap->supplier?->name ?? 'Supplier';
                $extraNote    = !empty($validated['notes']) ? " ({$validated['notes']})" : '';

                $journal = Journal::create([
                    'branch_id'        => $ap->branch_id,
                    'journal_number'   => 'PAY-AP-' . now()->format('ymd') . '-' . strtoupper(substr(uniqid(), -5)),
                    'transaction_date' => $validated['payment_date'],
                    'description'      => "Pembayaran Hutang {$supplierName} - Inv: {$ap->invoice_number}{$extraNote}",
                    'reference_type'   => AccountsPayable::class,
                    'reference_id'     => $ap->id,
                    'created_by'       => $request->user()?->id,
                ]);

                $journal->entries()->createMany([
                    [
                        'chart_of_account_id' => $apAccount->id,
                        'debit'               => $paymentAmount,
                        'credit'              => 0,
                    ],
                    [
                        'chart_of_account_id' => $validated['cash_account_id'],
                        'debit'               => 0,
                        'credit'              => $paymentAmount,
                    ],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran hutang supplier berhasil diproses & dijurnal.');
    }
}