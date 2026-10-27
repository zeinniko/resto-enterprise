<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountsReceivable extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'partner_name',
        'total_amount',
        'received_amount',
        'due_date',
        'status',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'received_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
