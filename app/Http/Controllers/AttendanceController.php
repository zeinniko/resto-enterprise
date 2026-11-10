<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\WorkShift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $attendances = Attendance::with(['employee.branch', 'workShift'])
            ->when($request->search, function ($q) use ($request) {
                $q->whereHas('employee', function ($empQ) use ($request) {
                    $empQ->where('name', 'like', "%{$request->search}%")
                         ->orWhere('employee_code', 'like', "%{$request->search}%")
                         ->orWhere('nik', 'like', "%{$request->search}%");
                });
            })
            ->when($request->date, function ($q) use ($request) {
                $q->whereDate('date', $request->date);
            })
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::where('is_active', true)
            ->select('id', 'name', 'employee_code', 'nik', 'branch_id')
            ->with('branch:id,name,code')
            ->orderBy('name', 'asc')
            ->get();

        $shifts = WorkShift::select('id', 'name', 'start_time', 'end_time')->get();

        return Inertia::render('Attendances/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'shifts' => $shifts,
            'filters' => $request->only(['search', 'date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'work_shift_id' => 'nullable|exists:work_shifts,id',
            'date' => 'required|date',
            'clock_in' => 'nullable|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'status' => 'required|in:PRESENT,LATE,ABSENT,LEAVE,SICK',
            'overtime_hours' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ], [
            'employee_id.required' => 'Pilih karyawan terlebih dahulu.',
            'date.required' => 'Tanggal absensi wajib diisi.',
            'status.in' => 'Status kehadiran tidak valid.',
        ]);

        // Cek duplikasi absensi pada tanggal yang sama
        $exists = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('date', $validated['date'])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'employee_id' => 'Karyawan ini sudah memiliki catatan absensi pada tanggal yang dipilih.',
            ]);
        }

        // Ambil branch_id otomatis dari data karyawan
        $employee = Employee::findOrFail($validated['employee_id']);
        $validated['branch_id'] = $employee->branch_id;

        // Format waktu clock_in & clock_out
        if (!empty($validated['clock_in'])) {
            $validated['clock_in'] = $validated['date'] . ' ' . $validated['clock_in'] . ':00';
        }
        if (!empty($validated['clock_out'])) {
            $validated['clock_out'] = $validated['date'] . ' ' . $validated['clock_out'] . ':00';
        }

        Attendance::create($validated);

        return redirect()->back()->with('success', 'Catatan presensi berhasil disimpan.');
    }

    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'work_shift_id' => 'nullable|exists:work_shifts,id',
            'date' => 'required|date',
            'clock_in' => 'nullable',
            'clock_out' => 'nullable',
            'status' => 'required|in:PRESENT,LATE,ABSENT,LEAVE,SICK',
            'overtime_hours' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $validated['branch_id'] = $employee->branch_id;

        if (!empty($validated['clock_in']) && strlen($validated['clock_in']) === 5) {
            $validated['clock_in'] = $validated['date'] . ' ' . $validated['clock_in'] . ':00';
        }
        if (!empty($validated['clock_out']) && strlen($validated['clock_out']) === 5) {
            $validated['clock_out'] = $validated['date'] . ' ' . $validated['clock_out'] . ':00';
        }

        $attendance->update($validated);

        return redirect()->back()->with('success', 'Presensi karyawan berhasil diperbarui.');
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return redirect()->back()->with('success', 'Presensi berhasil dihapus.');
    }
}