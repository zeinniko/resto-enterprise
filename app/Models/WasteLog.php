<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WasteLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'storage_location_id',
        'item_id',
        'stock_batch_id',
        'qty',
        'unit_id',
        'unit_cost',
        'total_cost',
        'reason',
        'logged_by',
    ];

    protected $casts = [
        'qty' => 'decimal:4',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function logger()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}