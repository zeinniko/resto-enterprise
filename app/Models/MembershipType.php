<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'min_points',
        'discount_percentage',
        'is_active',
    ];

    protected $casts = [
        'min_points' => 'integer',
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}