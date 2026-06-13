<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryStatus extends Model
{
    protected $table = 'global.production_delivery_statuses';

    protected $fillable = [
        'kode', 'status', 'urutan', 'warna', 'deskripsi', 'aktif',
    ];

    protected $casts = [
        'aktif'   => 'boolean',
        'urutan'  => 'integer',
    ];
}
