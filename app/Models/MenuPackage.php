<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'name',
        'package_price',
        'is_active',
    ];

    protected $casts = [
        'package_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function items()
    {
        return $this->hasMany(MenuPackageItem::class);
    }
}