<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'item_id',
        'min_stock',
        'reorder_point',
        'purchase_price',
        'is_active',
    ];

    protected $casts = [
        'min_stock' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
