<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransferOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_order_id',
        'item_id',
        'qty_requested',
        'qty_shipped',
        'qty_received',
        'unit_id',
    ];

    protected $casts = [
        'qty_requested' => 'decimal:2',
        'qty_shipped' => 'decimal:2',
        'qty_received' => 'decimal:2',
    ];

    public function transferOrder()
    {
        return $this->belongsTo(TransferOrder::class);
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