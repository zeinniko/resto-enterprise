<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountsPayableController extends Controller
{
    public function index(Request $request)
    {
        $payables = AccountsPayable::with(['supplier', 'purchaseOrder', 'branch'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$request->search}%"));
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $cashAccounts = ChartOfAccount::where('type', 'ASSET')->where('is_active', true)->get();

        return Inertia::render('AccountsPayable/Index', [
            'payables' => $payables,
            'cashAccounts' => $cashAccounts,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function pay(Request $request, AccountsPayable $accountsPayable)
    {
        $validated = $request->validate([
            'payment_amount' => 'required|numeric|gt:0|lte:' . ($accountsPayable->total_amount - $accountsPayable->paid_amount),
            'cash_account_id' => 'required|exists:chart_of_accounts,id',
            'payment_date' => 'required|date',
        ]);

        DB::transaction(function () use ($accountsPayable, $validated, $request) {
            $newPaid = $accountsPayable->paid_amount + $validated['payment_amount'];
            $status = $newPaid >= $accountsPayable->total_amount ? 'PAID' : 'PARTIAL';

            $accountsPayable->update([
                'paid_amount' => $newPaid,
                'status' => $status,
            ]);

            // Buat Jurnal Pelunasan Hutang (Debit: Hutang Dagang, Credit: Kas/Bank)
            $apAccount = ChartOfAccount::where('code', '2110')->first(); // Contoh Kode Akun Hutang

            if ($apAccount) {
                $journal = JournalEntry::create([
                    'branch_id' => $accountsPayable->branch_id,
                    'journal_number' => 'PAY-AP-' . strtoupper(uniqid()),
                    'date' => $validated['payment_date'],
                    'description' => "Pembayaran Hutang Supplier Inv: {$accountsPayable->invoice_number}",
                    'total_amount' => $validated['payment_amount'],
                    'status' => 'POSTED',
                    'created_by' => $request->user()?->id ?? 1,
                ]);

                $journal->items()->createMany([
                    ['chart_of_account_id' => $apAccount->id, 'debit' => $validated['payment_amount'], 'credit' => 0],
                    ['chart_of_account_id' => $validated['cash_account_id'], 'debit' => 0, 'credit' => $validated['payment_amount']],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran hutang supplier berhasil diproses.');
    }
}