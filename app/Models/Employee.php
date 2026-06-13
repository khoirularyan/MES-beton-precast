<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_employees';

    protected $fillable = [
        'nik', 'nama', 'jabatan', 'departemen', 'shift', 'status', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
