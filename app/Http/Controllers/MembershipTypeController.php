<?php

namespace App\Http\Controllers;

use App\Models\MembershipType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MembershipTypeController extends Controller
{
    public function index(Request $request)
    {
        $memberships = MembershipType::latest()->paginate(10);

        return Inertia::render('MembershipTypes/Index', [
            'memberships' => $memberships,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:membership_types,name',
            'min_points' => 'required|integer|min:0',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ]);

        MembershipType::create($validated);

        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil ditambahkan.');
    }

    public function update(Request $request, MembershipType $membershipType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:membership_types,name,' . $membershipType->id,
            'min_points' => 'required|integer|min:0',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ]);

        $membershipType->update($validated);

        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil diperbarui.');
    }

    public function destroy(MembershipType $membershipType)
    {
        $membershipType->delete();
        return redirect()->back()->with('success', 'Tingkat keanggotaan berhasil dihapus.');
    }
}