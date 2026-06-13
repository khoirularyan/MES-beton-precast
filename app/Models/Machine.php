<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Machine extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_machines';

    protected $fillable = [
        'kode', 'nama', 'tipe', 'line', 'status', 'last_maintenance', 'next_maintenance', 'aktif',
    ];

    protected $casts = [
        'aktif'            => 'boolean',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
    ];
}
