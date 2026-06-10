<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductionBatch extends Model
{
    use SoftDeletes;

    protected $table = 'production_batches';

    protected $fillable = [
        'batch_number', 'production_plan_id', 'demand_id', 'source_type',
        'product_id', 'routing_version', 'target_qty', 'actual_qty',
        'target_volume_m3', 'planned_start', 'planned_end',
        'actual_start', 'actual_end', 'work_center_id', 'status', 'notes',
    ];

    protected $casts = [
        'target_qty'       => 'decimal:2',
        'actual_qty'       => 'decimal:2',
        'target_volume_m3' => 'decimal:3',
        'planned_start'    => 'datetime',
        'planned_end'      => 'datetime',
        'actual_start'     => 'datetime',
        'actual_end'       => 'datetime',
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

    public function cost(): HasOne
    {
        return $this->hasOne(ProductionCost::class, 'production_batch_id');
    }
}
