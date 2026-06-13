<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConcreteGrade extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_concrete_grades';

    protected $fillable = [
        'grade', 'nama', 'fc_mpa', 'slump_min_cm', 'slump_max_cm', 'keterangan', 'aktif',
    ];

    protected $casts = [
        'aktif'         => 'boolean',
        'fc_mpa'        => 'float',
        'slump_min_cm'  => 'float',
        'slump_max_cm'  => 'float',
    ];
}
