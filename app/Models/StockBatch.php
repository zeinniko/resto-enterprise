<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'storage_location_id',
        'item_id',
        'goods_receipt_item_id',
        'production_order_id',
        'batch_number',
        'initial_qty',
        'current_qty',
        'unit_id',
        'unit_cost',
        'exp_date',
    ];

    protected $casts = [
        'initial_qty' => 'decimal:4',
        'current_qty' => 'decimal:4',
        'unit_cost' => 'decimal:2',
        'exp_date' => 'date',
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

    public function goodsReceiptItem()
    {
        return $this->belongsTo(GoodsReceiptItem::class);
    }

    public function productionOrder()
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class);
    }
}