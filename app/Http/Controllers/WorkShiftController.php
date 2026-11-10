<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\WorkShift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = WorkShift::with('branch')
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branches = Branch::where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('WorkShifts/Index', [
            'shifts' => $shifts,
            'branches' => $branches,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'name' => 'required|string|max:100',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_overnight' => 'nullable|boolean',
        ]);

        // Otomatisasi deteksi shift malam lintas hari (contoh: 22:00 s/d 06:00)
        if (!isset($validated['is_overnight'])) {
            $validated['is_overnight'] = $validated['end_time'] <= $validated['start_time'];
        }

        WorkShift::create($validated);

        return redirect()->back()->with('success', 'Master jam shift kerja berhasil dibuat.');
    }

    public function update(Request $request, WorkShift $workShift)
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'name' => 'required|string|max:100',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_overnight' => 'nullable|boolean',
        ]);

        if (!isset($validated['is_overnight'])) {
            $validated['is_overnight'] = $validated['end_time'] <= $validated['start_time'];
        }

        $workShift->update($validated);

        return redirect()->back()->with('success', 'Master jam shift kerja berhasil diperbarui.');
    }

    public function destroy(WorkShift $workShift)
    {
        $workShift->delete();

        return redirect()->back()->with('success', 'Shift kerja berhasil dihapus.');
    }
}