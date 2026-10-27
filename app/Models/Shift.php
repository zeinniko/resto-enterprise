<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'user_id',
        'opened_at',
        'closed_at',
        'starting_cash',
        'ending_cash_actual',
        'ending_cash_expected',
        'variance',
        'status',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'starting_cash' => 'decimal:2',
        'ending_cash_actual' => 'decimal:2',
        'ending_cash_expected' => 'decimal:2',
        'variance' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function pettyCashes()
    {
        return $this->hasMany(PettyCash::class);
    }
}