<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('branch')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('BranchUsers/Index', [
            'users' => $users,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'role' => 'required|string',
        ]);

        $user->update($validated);
        return redirect()->back()->with('success', 'Hak akses user cabang berhasil diperbarui.');
    }
}