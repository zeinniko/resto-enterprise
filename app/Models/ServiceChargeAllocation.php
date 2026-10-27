<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceChargeAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'period',
        'total_collected',
        'allocated_percentage',
        'total_amount_allocated',
        'status',
    ];

    protected $casts = [
        'total_collected' => 'decimal:2',
        'allocated_percentage' => 'decimal:2',
        'total_amount_allocated' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}