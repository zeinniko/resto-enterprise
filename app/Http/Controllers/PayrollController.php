<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\ServiceChargeAllocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $payrolls = Payroll::with(['employee.branch', 'creator', 'serviceChargeAllocation'])
            ->when($request->search, function ($q) use ($request) {$q->whereHas('employee', function ($eQ) use ($request) {
                    $eQ->where('name', 'like', "\%{$request->search}%")
                       ->orWhere('employee_code', 'like', "%{$request->search}%")
                       ->orWhere('nik', 'like', "%{$request->search}%");
                })->orWhere('period', 'like', "%{$request->search}%");
            })
            ->when($request->period, function ($q) use ($request) {
                $q->where('period',$request->period);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::where('is_active', true)
            ->select('id', 'name', 'employee_code', 'nik', 'basic_salary', 'branch_id')
            ->with('branch:id,name,code')
            ->orderBy('name', 'asc')
            ->get();

        $serviceCharges = ServiceChargeAllocation::select('id', 'branch_id', 'period', 'total_amount_allocated', 'status')
            ->get();

        return Inertia::render('Payrolls/Index', [
            'payrolls' => $payrolls,
            'employees' => $employees,
            'serviceCharges' => $serviceCharges,
            'filters' => $request->only(['search', 'period']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => [
                'required',
                'string',
                'max:7',
                Rule::unique('payrolls')->where(function ($query) use ($request) {
                    return $query->where('employee_id',$request->employee_id);
                }),
            ],
            'service_charge_allocation_id' => 'nullable|exists:service_charge_allocations,id',
            'basic_salary' => 'required|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'service_charge_bonus' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'required|in:DRAFT,APPROVED,PAID',
        ], [
            'period.unique' => 'Slip gaji untuk karyawan dan periode ini sudah terbit.',
            'basic_salary.required' => 'Gaji pokok wajib diisi.',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $validated['branch_id'] =$employee->branch_id;

        $overtime =$validated['overtime_pay'] ?? 0;
        $scBonus =$validated['service_charge_bonus'] ?? 0;
        $deductions =$validated['deductions'] ?? 0;

        // Kalkulasi Net Salary (THP)
        $validated['net_salary'] = ($validated['basic_salary'] +$overtime + $scBonus) -$deductions;

        if ($validated['status'] === 'PAID') {$validated['paid_at'] = now();
        }

        $validated['created_by'] = auth()->id();

        Payroll::create($validated);

        return redirect()->back()->with('success', 'Slip gaji karyawan berhasil diproses.');
    }

    public function update(Request $request, Payroll$payroll)
    {
        $validated =$request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => [
                'required',
                'string',
                'max:7',
                Rule::unique('payrolls')
                    ->where(fn ($query) => $query->where('employee_id',$request->employee_id))
                    ->ignore($payroll->id),
            ],
            'service_charge_allocation_id' => 'nullable|exists:service_charge_allocations,id',
            'basic_salary' => 'required|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'service_charge_bonus' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'required|in:DRAFT,APPROVED,PAID',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $validated['branch_id'] =$employee->branch_id;

        $overtime =$validated['overtime_pay'] ?? 0;
        $scBonus =$validated['service_charge_bonus'] ?? 0;
        $deductions =$validated['deductions'] ?? 0;

        $validated['net_salary'] = ($validated['basic_salary'] +$overtime + $scBonus) -$deductions;

        if ($validated['status'] === 'PAID' && !$payroll->paid_at) {$validated['paid_at'] = now();
        }

        $payroll->update($validated);

        return redirect()->back()->with('success', 'Data penggajian berhasil diperbarui.');
    }

    public function destroy(Payroll $payroll)
    {
        $payroll->delete();

        return redirect()->back()->with('success', 'Data penggajian berhasil dihapus.');
    }
}