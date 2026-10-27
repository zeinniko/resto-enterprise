<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $attendances = Attendance::with('employee')
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Attendances/Index', [
            'attendances' => $attendances,
            'employees' => Employee::where('is_active', true)->select('id', 'name', 'nik')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:PRESENT,LATE,ABSENT,LEAVE',
        ]);

        Attendance::create($validated);
        return redirect()->back()->with('success', 'Presensi berhasil dicatat.');
    }
}