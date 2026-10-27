<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_order_id',
        'item_id',
        'qty_required',
        'qty_used',
        'unit_id',
    ];

    protected $casts = [
        'qty_required' => 'decimal:4',
        'qty_used' => 'decimal:4',
    ];

    public function productionOrder()
    {
        return $this->belongsTo(ProductionOrder::class);
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