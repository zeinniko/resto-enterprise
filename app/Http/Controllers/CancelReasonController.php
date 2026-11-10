<?php

namespace App\Http\Controllers;

use App\Models\CancelReason;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CancelReasonController extends Controller
{
    public function index(Request $request)
    {
        $query = CancelReason::query();

        if ($request->search) {
            $query->where('reason', 'like', "%{$request->search}%");
        }

        $reasons = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('CancelReasons/Index', [
            'reasons' => $reasons,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'type' => 'required|in:ORDER_CANCEL,ITEM_VOID',
            'is_active' => 'required|boolean',
        ]);

        CancelReason::create($validated);

        return redirect()->back()->with('success', 'Alasan pembatalan berhasil ditambahkan.');
    }

    public function update(Request $request, CancelReason $cancelReason)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'type' => 'required|in:ORDER_CANCEL,ITEM_VOID',
            'is_active' => 'required|boolean',
        ]);

        $cancelReason->update($validated);

        return redirect()->back()->with('success', 'Alasan pembatalan berhasil diperbarui.');
    }

    public function destroy(CancelReason $cancelReason)
    {
        $cancelReason->delete();

        return redirect()->back()->with('success', 'Alasan pembatalan berhasil dihapus.');
    }
}