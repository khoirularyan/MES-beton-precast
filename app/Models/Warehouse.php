<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_warehouses';

    protected $fillable = [
        'kode', 'nama', 'tipe', 'lokasi', 'kapasitas', 'utilisasi', 'aktif',
    ];

    protected $casts = [
        'aktif'     => 'boolean',
        'utilisasi' => 'integer',
    ];
}
