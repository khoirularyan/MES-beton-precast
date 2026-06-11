<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int  $id
 * @property int  $role_id
 * @property int  $module_id
 * @property bool $can_view
 * @property bool $can_create
 * @property bool $can_update
 * @property bool $can_delete
 * @property bool $can_approve
 */
class RolePermission extends Model
{
    protected $table = 'user_role_permissions';

    protected $fillable = [
        'role_id', 'module_id',
        'can_view', 'can_create', 'can_update', 'can_delete', 'can_approve',
    ];

    protected $casts = [
        'can_view'    => 'boolean',
        'can_create'  => 'boolean',
        'can_update'  => 'boolean',
        'can_delete'  => 'boolean',
        'can_approve' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function module()
    {
        return $this->belongsTo(SystemModule::class, 'module_id');
    }
}
