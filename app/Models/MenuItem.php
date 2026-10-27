<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'selling_price',
        'is_active',
    ];

    protected $casts = [
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function recipe()
    {
        return $this->hasOne(Recipe::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
