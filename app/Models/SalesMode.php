<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesMode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'markup_percentage',
        'is_active',
    ];

    protected $casts = [
        'markup_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}