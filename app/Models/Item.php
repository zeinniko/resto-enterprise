<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'primary_unit_id',
        'purchase_unit_id',
        'shelf_life_days',
        'is_active',
    ];

    protected $casts = [
        'shelf_life_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function primaryUnit()
    {
        return $this->belongsTo(Unit::class, 'primary_unit_id');
    }

    public function purchaseUnit()
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function branchItems()
    {
        return $this->hasMany(BranchItem::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }
}