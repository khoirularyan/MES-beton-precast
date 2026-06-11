<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductSpec extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_product_specs';

    protected $fillable = [
        'kode', 'produk', 'dimensi', 'toleransi', 'berat', 'grade', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
