<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BatchStatus extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_batch_statuses';

    protected $fillable = [
        'kode', 'status', 'urutan', 'warna', 'deskripsi', 'aktif',
    ];

    protected $casts = [
        'aktif'  => 'boolean',
        'urutan' => 'integer',
    ];
}
