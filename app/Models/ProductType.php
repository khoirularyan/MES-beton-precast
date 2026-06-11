<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductType extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_product_types';

    protected $fillable = [
        'kode', 'kategori', 'nama', 'kode_prefix', 'standar', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
