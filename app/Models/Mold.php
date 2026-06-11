<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mold extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_molds';

    protected $fillable = [
        'kode', 'nama', 'produk', 'jumlah', 'aktif', 'kondisi', 'utilisasi',
        'kapasitas_per_siklus', 'siklus_per_hari',
    ];

    protected $casts = [
        'jumlah'               => 'integer',
        'aktif'                => 'integer',
        'utilisasi'            => 'integer',
        'kapasitas_per_siklus' => 'integer',
        'siklus_per_hari'      => 'integer',
    ];
}
