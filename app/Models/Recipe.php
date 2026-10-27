<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'yield_qty',
        'instructions',
        'is_active',
    ];

    protected $casts = [
        'yield_qty' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function recipeItems()
    {
        return $this->hasMany(RecipeItem::class);
    }
}