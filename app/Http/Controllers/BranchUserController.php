<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class BranchUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['branchUser.branch'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branches = Branch::where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('BranchUsers/Index', [
            'users' => $users,
            'branches' => $branches,
            'filters' => $request->only(['search']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'role' => 'nullable|string',
        ]);

        // 1. Simpan/update ke tabel penugasan branch_users
        BranchUser::updateOrCreate(
            ['user_id' => $user->id],
            [
                'branch_id' => $validated['branch_id'],
                'role' => $validated['role'] ?? 'STAFF',
            ]
        );

        // 2. Jika kolom branch_id ada pada tabel users, perbarui juga
        if (Schema::hasColumn('users', 'branch_id')) {
            $user->update(['branch_id' => $validated['branch_id']]);
        }

        return redirect()->back()->with('success', 'Hak akses cabang pengguna berhasil diperbarui.');
    }
}