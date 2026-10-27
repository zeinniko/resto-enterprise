<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'service_charge_allocation_id',
        'period',
        'basic_salary',
        'overtime_pay',
        'service_charge_bonus',
        'deductions',
        'net_salary',
        'status',
        'paid_at',
        'created_by',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'service_charge_bonus' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function serviceChargeAllocation()
    {
        return $this->belongsTo(ServiceChargeAllocation::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}