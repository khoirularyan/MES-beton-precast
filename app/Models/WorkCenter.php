<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkCenter extends Model
{
    protected $table = 'global.production_work_centers';

    protected $fillable = [
        'code', 'name', 'description',
        'capacity_qty_per_shift', 'capacity_m3_per_shift',
        'shifts_per_day', 'is_active',
        'standard_labor_rate_per_m3', 'standard_overhead_rate_per_m3',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity_qty_per_shift' => 'decimal:2',
        'capacity_m3_per_shift' => 'decimal:3',
        'shifts_per_day' => 'integer',
        'standard_labor_rate_per_m3' => 'decimal:2',
        'standard_overhead_rate_per_m3' => 'decimal:2',
    ];

    public function productionPlans(): HasMany
    {
        return $this->hasMany(ProductionPlan::class, 'work_center_id');
    }

    public function productionBatches(): HasMany
    {
        return $this->hasMany(ProductionBatch::class, 'work_center_id');
    }
}
