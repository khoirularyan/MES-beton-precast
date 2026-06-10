<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionPlan extends Model
{
    use SoftDeletes;

    protected $table = 'production_plans';

    protected $fillable = [
        'plan_number', 'plan_level', 'period_start', 'period_end',
        'product_id', 'planned_qty', 'planned_volume_m3',
        'work_center_id', 'material_status', 'capacity_status', 'status', 'notes',
    ];

    protected $casts = [
        'period_start'      => 'date',
        'period_end'        => 'date',
        'planned_qty'       => 'decimal:2',
        'planned_volume_m3' => 'decimal:3',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class, 'work_center_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductionBatch::class, 'production_plan_id');
    }
}
