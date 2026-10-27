<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuPackageItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_package_id',
        'menu_item_id',
        'qty',
    ];

    protected $casts = [
        'qty' => 'integer',
    ];

    public function package()
    {
        return $this->belongsTo(MenuPackage::class);
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}