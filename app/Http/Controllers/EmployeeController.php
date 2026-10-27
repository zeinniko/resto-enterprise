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
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'nik' => 'required|string|max:50|unique:employees,nik',
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'basic_salary' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        Employee::create($validated);

        return redirect()->back()->with('success', 'Data karyawan berhasil ditambahkan.');
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'nik' => 'required|string|max:50|unique:employees,nik,' . $employee->id,
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'basic_salary' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
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