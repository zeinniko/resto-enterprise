<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with(['branch', 'user', 'orders']);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $shifts = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'initial_cash' => 'required|numeric|min:0',
        ]);

        // Pastikan tidak ada shift berstatus OPEN untuk user ini di cabang ini
        $activeShift = Shift::where('branch_id', $validated['branch_id'])
            ->where('user_id', $request->user()?->id ?? 1)
            ->where('status', 'OPEN')
            ->first();

        if ($activeShift) {
            return redirect()->back()->withErrors(['message' => 'Anda masih memiliki register shift kasir yang aktif.']);
        }

        Shift::create([
            'branch_id' => $validated['branch_id'],
            'user_id' => $request->user()?->id ?? 1,
            'start_time' => now(),
            'initial_cash' => $validated['initial_cash'],
            'status' => 'OPEN',
        ]);

        return redirect()->back()->with('success', 'Shift kasir baru berhasil dibuka.');
    }

    public function close(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'final_cash_actual' => 'required|numeric|min:0',
        ]);

        $totalSales = $shift->orders()->where('payment_status', 'PAID')->sum('final_total');
        $expectedCash = $shift->initial_cash + $totalSales;

        $shift->update([
            'end_time' => now(),
            'final_cash_expected' => $expectedCash,
            'final_cash_actual' => $validated['final_cash_actual'],
            'status' => 'CLOSED',
        ]);

        return redirect()->back()->with('success', 'Shift kasir berhasil ditutup.');
    }
}