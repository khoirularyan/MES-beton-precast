<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionPlan extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_plans';

    protected $fillable = [
        'plan_number', 'plan_level', 'period_start', 'period_end',
        'product_id', 'planned_qty', 'planned_volume_m3',
        'work_center_id', 'material_status', 'capacity_status', 'status', 'notes',
        'mold_id', 'demand_id', 'mold_capacity_per_cycle', 'required_batches', 'shift',
        'sales_order_id', 'mold_capacity_snapshot', 'demand_qty', 'start_date', 'end_date',
        'daily_capacity', 'required_days',
    ];

    protected $casts = [
        'period_start'            => 'date',
        'period_end'              => 'date',
        'start_date'              => 'date',
        'end_date'                => 'date',
        'planned_qty'             => 'decimal:2',
        'demand_qty'              => 'decimal:2',
        'planned_volume_m3'       => 'decimal:3',
        'mold_capacity_per_cycle' => 'integer',
        'mold_capacity_snapshot'  => 'integer',
        'required_batches'        => 'integer',
        'daily_capacity'          => 'integer',
        'required_days'           => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class, 'work_center_id');
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class, 'mold_id');
    }

    public function demand(): BelongsTo
    {
        return $this->belongsTo(ProductionDemand::class, 'demand_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductionBatch::class, 'production_plan_id');
    }
}
