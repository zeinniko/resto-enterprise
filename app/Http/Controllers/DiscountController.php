<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $discounts = Discount::when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Discounts/Index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:PERCENTAGE,FIXED',
            'value' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        Discount::create($validated);
        return redirect()->back()->with('success', 'Diskon berhasil ditambahkan.');
    }

    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:PERCENTAGE,FIXED',
            'value' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $discount->update($validated);
        return redirect()->back()->with('success', 'Diskon berhasil diperbarui.');
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();
        return redirect()->back()->with('success', 'Diskon berhasil dihapus.');
    }
}