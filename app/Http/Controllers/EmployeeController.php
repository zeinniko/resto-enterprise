<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = Employee::with('branch')
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "\%{$request->search}%")
                  ->orWhere('employee_code', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%")
                  ->orWhere('position', 'like', "%{$request->search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branches = Branch::where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'branches' => $branches,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id' => 'required|exists:branches,id',
            'user_id' => 'nullable|exists:users,id',
            'employee_code' => 'required|string|max:30|unique:employees,employee_code',
            'nik' => 'nullable|string|max:20|unique:employees,nik',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'position' => 'required|in:MANAGER,HEAD_CHEF,COOK,WAITER,CASHIER,DISHWASHER,BARISTA',
            'employment_status' => 'required|in:PERMANENT,CONTRACT,DAILY_WORKER',
            'basic_salary' => 'required|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'joined_date' => 'required|date',
            'is_active' => 'required|boolean',
        ], [
            'employee_code.unique' => 'Kode Karyawan ini sudah terdaftar.',
            'nik.unique' => 'NIK Karyawan ini sudah terdaftar.',
            'joined_date.required' => 'Tanggal bergabung karyawan wajib diisi.',
            'position.in' => 'Pilihan jabatan tidak valid sesuai enum database.',
        ]);

        Employee::create($validated);

        return redirect()->back()->with('success', 'Data karyawan berhasil ditambahkan.');
    }

    public function update(Request $request, Employee$employee)
    {
        $validated =$request->validate([
            'branch_id' => 'required|exists:branches,id',
            'user_id' => 'nullable|exists:users,id',
            'employee_code' => 'required|string|max:30|unique:employees,employee_code,' . $employee->id,
            'nik' => 'nullable|string|max:20|unique:employees,nik,' . $employee->id,
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'position' => 'required|in:MANAGER,HEAD_CHEF,COOK,WAITER,CASHIER,DISHWASHER,BARISTA',
            'employment_status' => 'required|in:PERMANENT,CONTRACT,DAILY_WORKER',
            'basic_salary' => 'required|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'joined_date' => 'required|date',
            'is_active' => 'required|boolean',
        ], [
            'employee_code.unique' => 'Kode Karyawan ini sudah terdaftar.',
            'nik.unique' => 'NIK Karyawan ini sudah terdaftar.',
            'joined_date.required' => 'Tanggal bergabung karyawan wajib diisi.',
            'position.in' => 'Pilihan jabatan tidak valid sesuai enum database.',
        ]);

        $employee->update($validated);

        return redirect()->back()->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return redirect()->back()->with('success', 'Karyawan berhasil dihapus.');
    }
}