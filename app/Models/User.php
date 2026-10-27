<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'pin',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'pin',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'pin' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Eloquent Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Cabang yang diakses/dikelola oleh user ini
     */
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_users');
    }

    /**
     * Profil data pegawai terkait (jika user merupakan karyawan)
     */
    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * History shift kasir yang dibuka oleh user ini
     */
    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Transaksi POS yang diproses oleh user ini (Kasir/Waiter)
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Transaksi Kas Kecil yang dicatat oleh user
     */
    public function pettyCashes()
    {
        return $this->hasMany(PettyCash::class, 'created_by');
    }
}