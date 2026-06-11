<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaterialCategory extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_material_categories';

    protected $fillable = [
        'kode', 'nama', 'deskripsi', 'contoh', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
