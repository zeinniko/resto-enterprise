<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_number',
        'branch_id',
        'recipe_id',
        'target_item_id',
        'storage_location_id',
        'target_qty',
        'actual_qty',
        'unit_id',
        'status',
        'production_date',
        'created_by',
    ];

    protected $casts = [
        'target_qty' => 'decimal:2',
        'actual_qty' => 'decimal:2',
        'production_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function targetItem()
    {
        return $this->belongsTo(Item::class, 'target_item_id');
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function items()
    {
        return $this->hasMany(ProductionOrderItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}