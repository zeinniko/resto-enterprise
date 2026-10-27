<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoodsReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'goods_receipt_id',
        'item_id',
        'storage_location_id',
        'qty_received',
        'unit_id',
        'unit_cost',
        'exp_date',
        'batch_number',
    ];

    protected $casts = [
        'qty_received' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'exp_date' => 'date',
    ];

    public function goodsReceipt()
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}