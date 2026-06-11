<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int    $id
 * @property string $kode         Role key (super_admin, admin, etc.)
 * @property string $nama         Display name
 * @property string $deskripsi    Description
 * @property bool   $is_system    Cannot be deleted if true
 * @property bool   $is_active
 */
class Role extends Model
{
    protected $table = 'user_roles';

    protected $fillable = [
        'kode', 'nama', 'deskripsi', 'is_system', 'is_active',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function permissions()
    {
        return $this->hasMany(RolePermission::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isDeletable(): bool
    {
        return ! $this->is_system;
    }
}
