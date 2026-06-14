<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcInspection extends Model
{
    protected $table = 'public.production_qc_inspections';

    protected $fillable = [
        'no',
        'production_order_id',
        'product_id',
        'qty',
        'dimensi_ok',
        'dimensi_reject',
        'kuat_tekan',
        'status',
        'inspektur',
        'tanggal',
        'catatan',

        'production_batch_id',
        'inspection_date',
        'qty_inspected',
        'qty_passed',
        'qty_rejected',
        'notes',
        'photo_path',
        'inspector_id'
    ];

    protected $appends = ['qc_status'];

    protected $casts = [
        'inspection_date' => 'date:Y-m-d',
        'tanggal' => 'date:Y-m-d',
        'qty_inspected' => 'integer',
        'qty_passed' => 'integer',
        'qty_rejected' => 'integer',
        'qty' => 'integer',
        'dimensi_ok' => 'integer',
        'dimensi_reject' => 'integer',
        'kuat_tekan' => 'float',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if ($model->qty_inspected === null && $model->qty !== null) {
                $model->qty_inspected = $model->qty;
            }
            if ($model->qty === null && $model->qty_inspected !== null) {
                $model->qty = $model->qty_inspected;
            }

            if ($model->qty_passed === null && $model->dimensi_ok !== null) {
                $model->qty_passed = $model->dimensi_ok;
            }
            if ($model->dimensi_ok === null && $model->qty_passed !== null) {
                $model->dimensi_ok = $model->qty_passed;
            }

            if ($model->qty_rejected === null && $model->dimensi_reject !== null) {
                $model->qty_rejected = $model->dimensi_reject;
            }
            if ($model->dimensi_reject === null && $model->qty_rejected !== null) {
                $model->dimensi_reject = $model->qty_rejected;
            }

            if ($model->inspection_date === null && $model->tanggal !== null) {
                $model->inspection_date = $model->tanggal;
            }
            if ($model->tanggal === null && $model->inspection_date !== null) {
                $model->tanggal = $model->inspection_date;
            }

            if ($model->notes === null && $model->catatan !== null) {
                $model->notes = $model->catatan;
            }
            if ($model->catatan === null && $model->notes !== null) {
                $model->catatan = $model->notes;
            }

            if (empty($model->inspektur)) {
                $user = \Illuminate\Support\Facades\Auth::user();
                $model->inspektur = $user ? $user->name : 'System Inspector';
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('qty_inspected')) {
                $model->qty = $model->qty_inspected;
            }
            if ($model->isDirty('qty_passed')) {
                $model->dimensi_ok = $model->qty_passed;
            }
            if ($model->isDirty('qty_rejected')) {
                $model->dimensi_reject = $model->qty_rejected;
            }
            if ($model->isDirty('inspection_date')) {
                $model->tanggal = $model->inspection_date;
            }
            if ($model->isDirty('notes')) {
                $model->catatan = $model->notes;
            }
        });
    }

    public function getQcStatusAttribute(): string
    {
        $rejected = $this->qty_rejected;
        $passed = $this->qty_passed;

        if ($rejected == 0) {
            return 'PASS';
        }
        if ($passed > 0) {
            return 'PARTIAL_PASS';
        }
        return 'REJECT';
    }

    public function batch()
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function defects()
    {
        return $this->hasMany(QcDefect::class, 'inspection_id');
    }

    public function parameterValues()
    {
        return $this->hasMany(QcParameterValue::class, 'inspection_id');
    }
}
