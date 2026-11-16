<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\CostCenter;
use App\Models\Journal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class JournalController extends Controller
{
    public function index(Request $request)
    {
        $hasCostCenter = Schema::hasColumn('journal_entries', 'cost_center_id');

        $relations = [
            'branch:id,name,code',
            'creator:id,name',
            'entries.chartOfAccount:id,code,name,type',
        ];

        if ($hasCostCenter) {$relations[] = 'entries.costCenter:id,name,code';
        }

        $query = Journal::with($relations)
            ->withSum('entries as total_debit', 'debit')
            ->withSum('entries as total_credit', 'credit');

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('journal_number', 'like', "\%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id',$request->branch_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('transaction_date', '>=',$request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('transaction_date', '<=',$request->end_date);
        }

        $journals =$query->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Journals/Index', [
            'journals'      => $journals,
            'branches'      => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'accounts'      => ChartOfAccount::where('is_active', true)->select('id', 'code', 'name', 'type')->orderBy('code')->get(),
            'costCenters'   => $hasCostCenter ? CostCenter::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get() : [],
            'hasCostCenter' => $hasCostCenter,
            'filters'       => $request->only(['search', 'branch_id', 'start_date', 'end_date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'                   => 'required|exists:branches,id',
            'journal_number'              => 'required|string|max:50|unique:journals,journal_number',
            'transaction_date'            => 'required|date',
            'description'                 => 'required|string|max:255',
            'items'                       => 'required|array|min:2',
            'items.*.chart_of_account_id' => 'required|exists:chart_of_accounts,id',
            'items.*.cost_center_id'      => 'nullable|exists:cost_centers,id',
            'items.*.debit'               => 'required|numeric|min:0',
            'items.*.credit'              => 'required|numeric|min:0',
        ]);

        // Validasi tiap baris tidak boleh bernilai 0 di keduanya atau terisi di keduanya sekaligus
        foreach ($validated['items'] as $idx =>$row) {
            $debit  = (float)$row['debit'];
            $credit = (float)$row['credit'];

            if ($debit <= 0 &&$credit <= 0) {
                return redirect()->back()->withErrors([
                    'message' => 'Baris ke-' . ($idx + 1) . ' harus memiliki nominal Debit atau Credit lebih dari 0.',
                ]);
            }

            if ($debit > 0 &&$credit > 0) {
                return redirect()->back()->withErrors([
                    'message' => 'Baris ke-' . ($idx + 1) . ' tidak boleh mengisi Debit dan Credit secara bersamaan.',
                ]);
            }
        }

        $totalDebit  = round(collect($validated['items'])->sum('debit'), 2);
        $totalCredit = round(collect($validated['items'])->sum('credit'), 2);

        if ($totalDebit <= 0 || abs($totalDebit -$totalCredit) > 0.01) {
            return redirect()->back()->withErrors([
                'message' => 'Jurnal tidak seimbang! Total Debit dan Credit harus sama dan lebih besar dari 0.',
            ]);
        }

        $hasCostCenter = Schema::hasColumn('journal_entries', 'cost_center_id');

        DB::transaction(function () use ($validated,$request, $hasCostCenter) {$journal = Journal::create([
                'branch_id'        => $validated['branch_id'],
                'journal_number'   => $validated['journal_number'],
                'transaction_date' => $validated['transaction_date'],
                'description'      => $validated['description'],
                'created_by'       => $request->user()?->id,
            ]);

            foreach ($validated['items'] as $item) {$entryPayload = [
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'debit'               => round((float) $item['debit'], 2), 'credit'              => round((float)$item['credit'], 2),
                ];

                if ($hasCostCenter) {
                    $entryPayload['cost_center_id'] =$item['cost_center_id'] ?? null;
                }

                $journal->entries()->create($entryPayload);
            }
        });

        return redirect()->back()->with('success', 'Jurnal Umum berhasil diposting ke buku besar.');
    }
}