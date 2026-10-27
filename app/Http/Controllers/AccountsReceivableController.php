<?php

namespace App\Http\Controllers;

use App\Models\AccountsReceivable;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountsReceivableController extends Controller
{
    public function index(Request $request)
    {
        $receivables = AccountsReceivable::with(['salesMode', 'branch'])
            ->when($request->search, fn($q) => $q->where('reference_number', 'like', "%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $cashAccounts = ChartOfAccount::where('type', 'ASSET')->where('is_active', true)->get();

        return Inertia::render('AccountsReceivable/Index', [
            'receivables' => $receivables,
            'cashAccounts' => $cashAccounts,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function settle(Request $request, AccountsReceivable $accountsReceivable)
    {
        $validated = $request->validate([
            'settled_amount' => 'required|numeric|gt:0|lte:' . ($accountsReceivable->total_amount - $accountsReceivable->settled_amount),
            'cash_account_id' => 'required|exists:chart_of_accounts,id',
            'settlement_date' => 'required|date',
        ]);

        DB::transaction(function () use ($accountsReceivable, $validated, $request) {
            $newSettled = $accountsReceivable->settled_amount + $validated['settled_amount'];
            $status = $newSettled >= $accountsReceivable->total_amount ? 'SETTLED' : 'PARTIAL';

            $accountsReceivable->update([
                'settled_amount' => $newSettled,
                'status' => $status,
            ]);

            // Jurnal Pencairan Piutang Aggregator (Debit: Kas/Bank, Credit: Piutang Aggregator)
            $arAccount = ChartOfAccount::where('code', '1120')->first(); // Contoh Kode Akun Piutang

            if ($arAccount) {
                $journal = JournalEntry::create([
                    'branch_id' => $accountsReceivable->branch_id,
                    'journal_number' => 'SETTLE-AR-' . strtoupper(uniqid()),
                    'date' => $validated['settlement_date'],
                    'description' => "Pencairan Piutang Aggregator Ref: {$accountsReceivable->reference_number}",
                    'total_amount' => $validated['settled_amount'],
                    'status' => 'POSTED',
                    'created_by' => $request->user()?->id ?? 1,
                ]);

                $journal->items()->createMany([
                    ['chart_of_account_id' => $validated['cash_account_id'], 'debit' => $validated['settled_amount'], 'credit' => 0],
                    ['chart_of_account_id' => $arAccount->id, 'debit' => 0, 'credit' => $validated['settled_amount']],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pencairan piutang aggregator berhasil diproses.');
    }
}