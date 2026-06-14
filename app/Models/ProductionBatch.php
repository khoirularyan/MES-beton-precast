<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionBatch extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_batches';

    protected $fillable = [
        'batch_number', 'production_plan_id', 'demand_id', 'source_type',
        'product_id', 'routing_version', 'target_qty', 'actual_qty',
        'target_volume_m3', 'planned_start', 'planned_end',
        'actual_start', 'actual_end', 'work_center_id', 'notes',
        'mold_id', 'batch_sequence', 'sales_order_id', 'planned_date',
        'batch_status_id', 'status',
    ];

    protected static function booted()
    {
        static::creating(function ($batch) {
            if (empty($batch->batch_status_id)) {
                $planningStatus = \Illuminate\Support\Facades\DB::table('global.production_batch_statuses')
                    ->where(function ($q) {
                        $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                          ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
                    })
                    ->first() ?: \Illuminate\Support\Facades\DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
                if ($planningStatus) {
                    $batch->batch_status_id = $planningStatus->id;
                }
            }
        });
    }

    public function getStatusAttribute()
    {
        return $this->statusModel?->status;
    }

    public function setStatusAttribute($value)
    {
        if (empty($value)) {
            return;
        }

        $normalized = strtolower(trim($value));
        // Fallbacks for older names
        if ($normalized === 'planned') {
            $normalized = 'planning';
        } elseif ($normalized === 'in progress') {
            $normalized = 'casting';
        } elseif ($normalized === 'qc pending') {
            $normalized = 'qc';
        }

        $status = \Illuminate\Support\Facades\DB::table('global.production_batch_statuses')
            ->whereRaw('LOWER(status) = ?', [$normalized])
            ->orWhereRaw('LOWER(kode) = ?', [$normalized])
            ->first();

        if ($status) {
            $this->attributes['batch_status_id'] = $status->id;
        }
    }

    protected $casts = [
        'target_qty'       => 'decimal:2',
        'actual_qty'       => 'decimal:2',
        'target_volume_m3' => 'decimal:3',
        'planned_start'    => 'datetime',
        'planned_end'      => 'datetime',
        'actual_start'     => 'datetime',
        'actual_end'       => 'datetime',
        'batch_sequence'   => 'integer',
        'planned_date'     => 'date',
        'batch_status_id'  => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(ProductionPlan::class, 'production_plan_id');
    }

    public function demand(): BelongsTo
    {
        return $this->belongsTo(ProductionDemand::class, 'demand_id');
    }

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class, 'work_center_id');
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class, 'mold_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function cost(): HasOne
    {
        return $this->hasOne(ProductionCost::class, 'production_batch_id');
    }

    public function statusModel(): BelongsTo
    {
        return $this->belongsTo(BatchStatus::class, 'batch_status_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(BatchStatusLog::class, 'production_batch_id')->orderBy('changed_at', 'asc');
    }

    public function qcInspections(): HasMany
    {
        return $this->hasMany(QcInspection::class, 'production_batch_id');
    }
}
