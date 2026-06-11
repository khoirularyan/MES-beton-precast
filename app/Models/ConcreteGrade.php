<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConcreteGrade extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_concrete_grades';

    protected $fillable = [
        'grade', 'fc', 'slump', 'semen', 'agregat', 'air', 'admixture', 'aktif',
    ];

    protected $casts = [
        'aktif'   => 'boolean',
        'fc'      => 'float',
        'semen'   => 'float',
        'agregat' => 'float',
        'air'     => 'float',
    ];
}
