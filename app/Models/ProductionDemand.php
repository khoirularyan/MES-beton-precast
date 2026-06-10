<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionDemand extends Model
{
    use SoftDeletes;

    protected $table = 'production_demands';

    protected $fillable = [
        'demand_number', 'source_type', 'sales_order_id', 'sales_order_item_id',
        'product_id', 'demand_qty', 'required_date', 'priority', 'status', 'notes',
    ];

    protected $casts = [
        'demand_qty'    => 'decimal:2',
        'required_date' => 'date',
        'priority'      => 'integer',
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
}
