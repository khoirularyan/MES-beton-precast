<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionCost extends Model
{
    protected $table = 'public.production_costs';

    protected $fillable = [
        'production_batch_id',
        'estimated_material_cost', 'estimated_labor_cost', 'estimated_overhead_cost',
        'actual_material_cost', 'actual_labor_cost', 'actual_overhead_cost',
        'variance_amount', 'variance_percent', 'notes',
        'material_cost', 'labor_cost', 'overhead_cost',
        'total_cost', 'cost_per_unit', 'cost_per_m3',
    ];

    protected $casts = [
        'estimated_material_cost'  => 'decimal:2',
        'estimated_labor_cost'     => 'decimal:2',
        'estimated_overhead_cost'  => 'decimal:2',
        'actual_material_cost'     => 'decimal:2',
        'actual_labor_cost'        => 'decimal:2',
        'actual_overhead_cost'     => 'decimal:2',
        'variance_amount'          => 'decimal:2',
        'variance_percent'         => 'decimal:2',
        'material_cost'            => 'decimal:2',
        'labor_cost'               => 'decimal:2',
        'overhead_cost'            => 'decimal:2',
        'total_cost'               => 'decimal:2',
        'cost_per_unit'            => 'decimal:2',
        'cost_per_m3'              => 'decimal:2',
    ];

    protected $appends = ['estimated_total', 'actual_total'];

    public function getEstimatedTotalAttribute(): float
    {
        return (float) $this->estimated_material_cost
            + (float) $this->estimated_labor_cost
            + (float) $this->estimated_overhead_cost;
    }

    public function getActualTotalAttribute(): float
    {
        return (float) $this->actual_material_cost
            + (float) $this->actual_labor_cost
            + (float) $this->actual_overhead_cost;
    }

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }
}
