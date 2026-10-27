<?php

namespace App\Http\Controllers;

use App\Models\WorkShift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = WorkShift::latest()->paginate(10);
        return Inertia::render('WorkShifts/Index', ['shifts' => $shifts]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        WorkShift::create($validated);
        return redirect()->back()->with('success', 'Master jam shift kerja berhasil dibuat.');
    }
}