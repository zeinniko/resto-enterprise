<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $accounts = ChartOfAccount::when($request->search, function ($q) use ($request) {
            $q->where('code', 'like', "\%{$request->search}%")
              ->orWhere('name', 'like', "%{$request->search}%");
        })
        ->when($request->type, fn($q) => $q->where('type',$request->type))
        ->orderBy('code', 'asc')
        ->paginate(15)
        ->withQueryString();

        return Inertia::render('ChartOfAccounts/Index', [
            'accounts' => $accounts,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'code' => 'required|string|max:30|unique:chart_of_accounts,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'normal_balance' => 'required|in:DEBIT,CREDIT',
            'is_active' => 'required|boolean',
        ]);

        ChartOfAccount::create($validated);

        return redirect()->back()->with('success', 'Akun COA berhasil ditambahkan.');
    }

    public function update(Request $request, ChartOfAccount$chartOfAccount)
    {
        $validated =$request->validate([
            'code' => 'required|string|max:30|unique:chart_of_accounts,code,' . $chartOfAccount->id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'normal_balance' => 'required|in:DEBIT,CREDIT',
            'is_active' => 'required|boolean',
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