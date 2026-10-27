<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\CostCenter;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JournalController extends Controller
{
    public function index(Request $request)
    {
        $journals = JournalEntry::with(['branch', 'items.account', 'items.costCenter', 'creator'])
            ->when($request->search, fn($q) => $q->where('journal_number', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Journals/Index', [
            'journals' => $journals,
            'branches' => Branch::where('is_active', true)->get(),
            'accounts' => ChartOfAccount::where('is_active', true)->orderBy('code')->get(),
            'costCenters' => CostCenter::where('is_active', true)->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'journal_number' => 'required|string|max:50|unique:journal_entries,journal_number',
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'items' => 'required|array|min:2',
            'items.*.chart_of_account_id' => 'required|exists:chart_of_accounts,id',
            'items.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'items.*.debit' => 'required|numeric|min:0',
            'items.*.credit' => 'required|numeric|min:0',
        ]);

        $totalDebit = collect($validated['items'])->sum('debit');
        $totalCredit = collect($validated['items'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return redirect()->back()->withErrors(['message' => 'Jurnal tidak seimbang! Total Debit dan Credit harus sama.']);
        }

        DB::transaction(function () use ($validated, $totalDebit, $request) {
            $journal = JournalEntry::create([
                'branch_id' => $validated['branch_id'],
                'journal_number' => $validated['journal_number'],
                'date' => $validated['date'],
                'description' => $validated['description'],
                'total_amount' => $totalDebit,
                'status' => 'POSTED',
                'created_by' => $request->user()?->id ?? 1,
            ]);

            foreach ($validated['items'] as $item) {
                $journal->items()->create([
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'cost_center_id' => $item['cost_center_id'] ?? null,
                    'debit' => $item['debit'],
                    'credit' => $item['credit'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Jurnal Umum berhasil dicatat dan di-post.');
    }
}