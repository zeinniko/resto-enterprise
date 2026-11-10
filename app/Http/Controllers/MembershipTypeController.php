<?php

namespace App\Http\Controllers;

use App\Models\MembershipType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MembershipTypeController extends Controller
{
    public function index(Request $request)
    {
        $memberships = MembershipType::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "\%{$request->search}%")
              ->orWhere('code', 'like', "%{$request->search}%");
        })->latest()->paginate(10)->withQueryString();

        return Inertia::render('MembershipTypes/Index', [
            'memberships' => $memberships,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'code' => 'nullable|string|max:30|unique:membership_types,code',
            'name' => 'required|string|max:100|unique:membership_types,name',
            'min_points' => 'required|integer|min:0',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ], [
            'name.unique' => 'Nama tingkat keanggotaan ini sudah terdaftar.',
            'code.unique' => 'Kode level membership ini sudah digunakan.',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = strtoupper(Str::slug($validated['name'], '_'));
        }

        MembershipType::create($validated);

        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil ditambahkan.');
    }

    public function update(Request $request, MembershipType$membershipType)
    {
        $validated =$request->validate([
            'code' => 'nullable|string|max:30|unique:membership_types,code,' . $membershipType->id,
            'name' => 'required|string|max:100|unique:membership_types,name,' . $membershipType->id,
            'min_points' => 'required|integer|min:0',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ], [
            'name.unique' => 'Nama tingkat keanggotaan ini sudah terdaftar.',
            'code.unique' => 'Kode level membership ini sudah digunakan.',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = strtoupper(Str::slug($validated['name'], '_'));
        }

        $membershipType->update($validated);

        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil diperbarui.');
    }

    public function destroy(MembershipType $membershipType)
    {
        $membershipType->delete();

        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil dihapus.');
    }
}