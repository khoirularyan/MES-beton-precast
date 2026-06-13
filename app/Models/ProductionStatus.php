<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStatus extends Model
{
    protected $table = 'global.production_statuses';

    protected $fillable = [
        'kode', 'status', 'urutan', 'warna', 'deskripsi', 'aktif',
    ];

    protected $casts = [
        'aktif'   => 'boolean',
        'urutan'  => 'integer',
    ];
}
