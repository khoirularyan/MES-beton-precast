<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_shifts';

    protected $fillable = [
        'kode', 'nama', 'jam', 'supervisor', 'jumlah_pekerja', 'aktif',
    ];

    protected $casts = [
        'aktif'         => 'boolean',
        'jumlah_pekerja' => 'integer',
    ];
}
