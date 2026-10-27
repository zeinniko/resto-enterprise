<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransferOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'from_branch_id',
        'to_branch_id',
        'status',
        'requested_by',
        'shipped_by',
        'received_by',
        'shipped_at',
        'received_at',
    ];

    protected $casts = [
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function items()
    {
        return $this->hasMany(TransferOrderItem::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function shipper()
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}