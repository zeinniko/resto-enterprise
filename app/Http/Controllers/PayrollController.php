<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $payrolls = Payroll::with('employee')
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Payrolls/Index', [
            'payrolls' => $payrolls,
            'employees' => Employee::where('is_active', true)->select('id', 'name', 'nik', 'basic_salary')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => 'required|string|max:7',
            'net_salary' => 'required|numeric|min:0',
            'status' => 'required|in:DRAFT,PAID',
        ]);

        Payroll::create($validated);
        return redirect()->back()->with('success', 'Slip gaji berhasil diproses.');
    }
}