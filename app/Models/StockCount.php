<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'storage_location_id',
        'count_number',
        'count_date',
        'status',
        'conducted_by',
        'approved_by',
    ];

    protected $casts = [
        'count_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function details()
    {
        return $this->hasMany(StockCountDetail::class);
    }

    public function conductor()
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
