<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected $table = 'production_suppliers';

    protected $fillable = [
        'kode', 'nama', 'material', 'kontak', 'email',
        'alamat', 'kota', 'rating', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'rating' => 'integer',
    ];
}
