<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'address',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'branch_users');
    }

    public function storageLocations()
    {
        return $this->hasMany(StorageLocation::class);
    }

    public function branchItems()
    {
        return $this->hasMany(BranchItem::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}