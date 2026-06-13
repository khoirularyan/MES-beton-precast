<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int    $id
 * @property string $code         Module identifier (dashboard, master_data, etc.)
 * @property string $name         Display name
 * @property string $description
 * @property bool   $is_active
 */
class SystemModule extends Model
{
    protected $table = 'system_modules';

    protected $fillable = [
        'code', 'name', 'description', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function rolePermissions()
    {
        return $this->hasMany(RolePermission::class, 'module_id');
    }
}
