<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcParameterValue extends Model
{
    protected $table = 'public.production_qc_parameter_values';

    protected $fillable = [
        'inspection_id',
        'qc_parameter_id',
        'value',
        'is_passed',
        'notes'
    ];

    protected $casts = [
        'is_passed' => 'boolean'
    ];

    public function inspection()
    {
        return $this->belongsTo(QcInspection::class, 'inspection_id');
    }

    public function parameter()
    {
        return $this->belongsTo(QcParameter::class, 'qc_parameter_id');
    }
}
