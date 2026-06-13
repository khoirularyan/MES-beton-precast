<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DefectCategory extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_defect_categories';

    protected $fillable = [
        'kode', 'nama', 'warna', 'tingkat', 'penyebab_umum', 'disposisi', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
