<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductCategory extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_product_categories';

    protected $fillable = [
        'kode', 'nama', 'deskripsi', 'jumlah_produk', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'jumlah_produk' => 'integer',
    ];
}
