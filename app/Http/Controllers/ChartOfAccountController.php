<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = ChartOfAccount::with('parent');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        $accounts = $query->orderBy('code', 'asc')->paginate(15)->withQueryString();

        $parentAccounts = ChartOfAccount::whereNull('parent_id')
            ->where('is_active', true)
            ->select('id', 'code', 'name')
            ->orderBy('code', 'asc')
            ->get();

        return Inertia::render('ChartOfAccounts/Index', [
            'accounts' => $accounts,
            'parentAccounts' => $parentAccounts,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:chart_of_accounts,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE,COGS',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'required|boolean',
        ], [
            'code.unique' => 'Kode Akun COA ini sudah terdaftar.',
        ]);

        ChartOfAccount::create($validated);

        return redirect()->back()->with('success', 'Akun COA berhasil ditambahkan.');
    }

    public function update(Request $request, ChartOfAccount $chartOfAccount)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:chart_of_accounts,code,' . $chartOfAccount->id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE,COGS',
            'parent_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'required|boolean',
        ], [
            'code.unique' => 'Kode Akun COA ini sudah terdaftar.',
        ]);

        $chartOfAccount->update($validated);

        return redirect()->back()->with('success', 'Akun COA berhasil diperbarui.');
    }

    public function destroy(ChartOfAccount $chartOfAccount)
    {
        $chartOfAccount->delete();

        return redirect()->back()->with('success', 'Akun COA berhasil dihapus.');
    }
}