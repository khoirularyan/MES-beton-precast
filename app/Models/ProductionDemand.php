<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionDemand extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_demands';

    protected $fillable = [
        'demand_number', 'source_type', 'sales_order_id', 'sales_order_item_id',
        'product_id', 'demand_qty', 'required_date', 'priority', 'status', 'notes',
    ];

    protected $casts = [
        'demand_qty'    => 'decimal:2',
        'required_date' => 'date',
        'priority'      => 'integer',
    ];

    protected $appends = [
        'daily_capacity',
        'estimated_days',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class, 'sales_order_item_id');
    }

    public function getDailyCapacityAttribute(): int
    {
        try {
            $planningService = new \App\Services\ProductionPlanningService();
            $molds = $planningService->getCompatibleMolds($this->product_id);
            if ($molds->isEmpty()) {
                return 0;
            }
            $mold = $molds->firstWhere('pivot.is_primary', true) ?: $molds->first();
            $capacityService = new \App\Services\CapacityPlanningService();
            return $capacityService->getDailyCapacity($mold);
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getEstimatedDaysAttribute(): int
    {
        $capacity = $this->daily_capacity;
        if ($capacity <= 0) {
            return 0;
        }
        return (int) ceil((float) $this->demand_qty / $capacity);
    }
}
