<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QcParameter extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_qc_parameters';

    protected $fillable = [
        'kode', 'parameter', 'satuan', 'min', 'target', 'metode', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];
}
