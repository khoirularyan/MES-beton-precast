<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcDefect extends Model
{
    protected $table = 'public.production_qc_defects';

    protected $fillable = [
        'inspection_id',
        'defect_category_id',
        'qty',
        'notes'
    ];

    protected $casts = [
        'qty' => 'integer'
    ];

    public function inspection()
    {
        return $this->belongsTo(QcInspection::class, 'inspection_id');
    }

    public function category()
    {
        return $this->belongsTo(DefectCategory::class, 'defect_category_id');
    }
}
