<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ChartOfAccount;
use App\Models\Employee;
use App\Models\Journal;
use App\Models\Payroll;
use App\Models\ServiceChargeAllocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $baseQuery = Payroll::query();

        if ($request->filled('branch_id')) {
            $baseQuery->where('branch_id', $request->branch_id);
        }

        if ($request->filled('period')) {
            $baseQuery->where('period', $request->period);
        }

        if ($request->filled('status')) {
            $baseQuery->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $baseQuery->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($eQ) use ($search) {
                    $eQ->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_code', 'like', "%{$search}%")
                       ->orWhere('nik', 'like', "%{$search}%");
                })->orWhere('period', 'like', "%{$search}%");
            });
        }

        // Ringkasan KPI Penggajian sesuai filter cabang & periode
        $summaryQuery = Payroll::query()
            ->when($request->filled('branch_id'), fn($q) => $q->where('branch_id', $request->branch_id))
            ->when($request->filled('period'), fn($q) => $q->where('period', $request->period));

        $totalNetSalary = (float) (clone $summaryQuery)->sum('net_salary');
        $totalPaid      = (float) (clone $summaryQuery)->where('status', 'PAID')->sum('net_salary');
        $totalPending   = (float) (clone $summaryQuery)->whereIn('status', ['DRAFT', 'APPROVED'])->sum('net_salary');

        $payrolls = (clone $baseQuery)
            ->with([
                'employee.branch:id,name,code',
                'branch:id,name,code',
                'creator:id,name',
                'serviceChargeAllocation:id,branch_id,period,total_amount_allocated,status',
                'journals:id,reference_type,reference_id,journal_number,transaction_date',
            ])
            ->orderByDesc('period')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::where('is_active', true)
            ->select('id', 'name', 'employee_code', 'nik', 'basic_salary', 'branch_id')
            ->with('branch:id,name,code')
            ->orderBy('name', 'asc')
            ->get();

        $serviceCharges = ServiceChargeAllocation::select('id', 'branch_id', 'period', 'total_amount_allocated', 'status')
            ->orderByDesc('period')
            ->get();

        $cashAccounts = ChartOfAccount::where('type', 'ASSET')
            ->where('is_active', true)
            ->select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        return Inertia::render('Payrolls/Index', [
            'payrolls'       => $payrolls,
            'employees'      => $employees,
            'serviceCharges' => $serviceCharges,
            'branches'       => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'cashAccounts'   => $cashAccounts,
            'summary'        => [
                'total_net'     => round($totalNetSalary, 2),
                'total_paid'    => round($totalPaid, 2),
                'total_pending' => round($totalPending, 2),
            ],
            'filters'        => $request->only(['search', 'period', 'branch_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'                  => 'required|exists:employees,id',
            'period'                       => [
                'required',
                'string',
                'max:7',
                Rule::unique('payrolls')->where(function ($query) use ($request) {
                    return $query->where('employee_id', $request->employee_id);
                }),
            ],
            'service_charge_allocation_id' => 'nullable|exists:service_charge_allocations,id',
            'basic_salary'                 => 'required|numeric|min:0',
            'overtime_pay'                 => 'nullable|numeric|min:0',
            'service_charge_bonus'         => 'nullable|numeric|min:0',
            'deductions'                   => 'nullable|numeric|min:0',
            'status'                       => 'required|in:DRAFT,APPROVED,PAID',
            'cash_account_id'              => 'nullable|exists:chart_of_accounts,id',
        ], [
            'period.unique'         => 'Slip gaji untuk karyawan dan periode ini sudah terbit.',
            'basic_salary.required' => 'Gaji pokok wajib diisi.',
        ]);

        $basic      = round((float) $validated['basic_salary'], 2);
        $overtime   = round((float) ($validated['overtime_pay'] ?? 0), 2);
        $scBonus    = round((float) ($validated['service_charge_bonus'] ?? 0), 2);
        $deductions = round((float) ($validated['deductions'] ?? 0), 2);
        $netSalary  = round(($basic + $overtime + $scBonus) - $deductions, 2);

        if ($netSalary < 0) {
            throw ValidationException::withMessages([
                'deductions' => 'Potongan tidak boleh melebihi total pendapatan gaji.',
            ]);
        }

        DB::transaction(function () use ($validated, $basic, $overtime, $scBonus, $deductions, $netSalary, $request) {
            $employee = Employee::findOrFail($validated['employee_id']);

            $payroll = Payroll::create([
                'employee_id'                  => $employee->id,
                'branch_id'                    => $employee->branch_id,
                'service_charge_allocation_id' => $validated['service_charge_allocation_id'] ?: null,
                'period'                       => $validated['period'],
                'basic_salary'                 => $basic,
                'overtime_pay'                 => $overtime,
                'service_charge_bonus'         => $scBonus,
                'deductions'                   => $deductions,
                'net_salary'                   => $netSalary,
                'status'                       => $validated['status'],
                'paid_at'                      => $validated['status'] === 'PAID' ? now() : null,
                'created_by'                   => $request->user()?->id,
            ]);

            if ($payroll->status === 'PAID') {
                $this->postPayrollJournal($payroll, $employee->name, $validated['cash_account_id'] ?? null, $request->user()?->id);
            }
        });

        return redirect()->back()->with('success', 'Slip gaji karyawan berhasil diproses.');
    }

    public function update(Request $request, Payroll $payroll)
    {
        $validated = $request->validate([
            'employee_id'                  => 'required|exists:employees,id',
            'period'                       => [
                'required',
                'string',
                'max:7',
                Rule::unique('payrolls')
                    ->where(fn($query) => $query->where('employee_id', $request->employee_id))
                    ->ignore($payroll->id),
            ],
            'service_charge_allocation_id' => 'nullable|exists:service_charge_allocations,id',
            'basic_salary'                 => 'required|numeric|min:0',
            'overtime_pay'                 => 'nullable|numeric|min:0',
            'service_charge_bonus'         => 'nullable|numeric|min:0',
            'deductions'                   => 'nullable|numeric|min:0',
            'status'                       => 'required|in:DRAFT,APPROVED,PAID',
            'cash_account_id'              => 'nullable|exists:chart_of_accounts,id',
        ], [
            'period.unique' => 'Slip gaji untuk karyawan dan periode ini sudah terbit.',
        ]);

        $basic      = round((float) $validated['basic_salary'], 2);
        $overtime   = round((float) ($validated['overtime_pay'] ?? 0), 2);
        $scBonus    = round((float) ($validated['service_charge_bonus'] ?? 0), 2);
        $deductions = round((float) ($validated['deductions'] ?? 0), 2);
        $netSalary  = round(($basic + $overtime + $scBonus) - $deductions, 2);

        if ($netSalary < 0) {
            throw ValidationException::withMessages([
                'deductions' => 'Potongan tidak boleh melebihi total pendapatan gaji.',
            ]);
        }

        DB::transaction(function () use ($payroll, $validated, $basic, $overtime, $scBonus, $deductions, $netSalary, $request) {
            $employee = Employee::findOrFail($validated['employee_id']);

            $paidAt = $payroll->paid_at;
            if ($validated['status'] === 'PAID' && !$paidAt) {
                $paidAt = now();
            } elseif ($validated['status'] !== 'PAID') {
                $paidAt = null;
            }

            $payroll->update([
                'employee_id'                  => $employee->id,
                'branch_id'                    => $employee->branch_id,
                'service_charge_allocation_id' => $validated['service_charge_allocation_id'] ?: null,
                'period'                       => $validated['period'],
                'basic_salary'                 => $basic,
                'overtime_pay'                 => $overtime,
                'service_charge_bonus'         => $scBonus,
                'deductions'                   => $deductions,
                'net_salary'                   => $netSalary,
                'status'                       => $validated['status'],
                'paid_at'                      => $paidAt,
            ]);

            if ($payroll->status === 'PAID') {
                $this->postPayrollJournal($payroll, $employee->name, $validated['cash_account_id'] ?? null, $request->user()?->id);
            }
        });

        return redirect()->back()->with('success', 'Data penggajian berhasil diperbarui.');
    }

    public function destroy(Payroll $payroll)
    {
        if ($payroll->status === 'PAID') {
            return redirect()->back()->withErrors([
                'message' => 'Slip gaji yang sudah berstatus PAID tidak dapat dihapus langsung.',
            ]);
        }

        $payroll->delete();

        return redirect()->back()->with('success', 'Data penggajian berhasil dihapus.');
    }

    /**
     * Posting jurnal otomatis saat slip gaji dibayarkan (PAID).
     * Debit: Beban Gaji & Upah | Credit: Kas / Bank
     */
    private function postPayrollJournal(Payroll $payroll, string $employeeName, $cashAccountId = null, $userId = null): void
    {
        if ((float) $payroll->net_salary <= 0) {
            return;
        }

        $alreadyPosted = Journal::where('reference_type', Payroll::class)
            ->where('reference_id', $payroll->id)
            ->exists();

        if ($alreadyPosted) {
            return;
        }

        $salaryExpenseAccount = ChartOfAccount::where('type', 'EXPENSE')
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN name LIKE '%Gaji%' OR name LIKE '%Upah%' OR name LIKE '%Payroll%' OR name LIKE '%Salary%' THEN 0 ELSE 1 END")
            ->orderBy('code')
            ->first();

        $cashAccount = $cashAccountId
            ? ChartOfAccount::find($cashAccountId)
            : ChartOfAccount::where('type', 'ASSET')
                ->where('is_active', true)
                ->orderByRaw("CASE WHEN name LIKE '%Bank%' OR name LIKE '%Kas%' OR name LIKE '%Cash%' THEN 0 ELSE 1 END")
                ->orderBy('code')
                ->first();

        if ($salaryExpenseAccount && $cashAccount) {
            $journal = Journal::create([
                'branch_id'        => $payroll->branch_id,
                'journal_number'   => 'PAY-SAL-' . now()->format('ymd') . '-' . strtoupper(substr(uniqid(), -5)),
                'transaction_date' => now()->toDateString(),
                'description'      => "Pembayaran Gaji {$employeeName} Periode {$payroll->period}",
                'reference_type'   => Payroll::class,
                'reference_id'     => $payroll->id,
                'created_by'       => $userId,
            ]);

            $journal->entries()->createMany([
                [
                    'chart_of_account_id' => $salaryExpenseAccount->id,
                    'debit'               => $payroll->net_salary,
                    'credit'              => 0,
                ],
                [
                    'chart_of_account_id' => $cashAccount->id,
                    'debit'               => 0,
                    'credit'              => $payroll->net_salary,
                ],
            ]);
        }
    }
}