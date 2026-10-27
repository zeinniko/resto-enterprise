<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'floor_id',
        'number',
        'capacity',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}