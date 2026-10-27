<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'item_id',
        'stock_batch_id',
        'from_location_id',
        'to_location_id',
        'movement_type',
        'qty',
        'unit_id',
        'reference_type',
        'reference_id',
        'created_by',
    ];

    protected $casts = [
        'qty' => 'decimal:4',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function fromLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'to_location_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}