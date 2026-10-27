<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCountDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_count_id',
        'item_id',
        'system_qty',
        'physical_qty',
        'variance_qty',
        'unit_id',
        'unit_cost',
        'variance_cost',
        'notes',
    ];

    protected $casts = [
        'system_qty' => 'decimal:4',
        'physical_qty' => 'decimal:4',
        'variance_qty' => 'decimal:4',
        'unit_cost' => 'decimal:2',
        'variance_cost' => 'decimal:2',
    ];

    public function stockCount()
    {
        return $this->belongsTo(StockCount::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}