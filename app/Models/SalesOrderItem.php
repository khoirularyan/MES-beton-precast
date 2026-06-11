<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrderItem extends Model
{
    protected $table = 'public.production_sales_order_items';

    protected $fillable = [
        'sales_order_id', 'product_id', 'qty_ordered', 'qty_reserved',
        'qty_to_produce', 'qty_produced', 'qty_delivered',
        'unit_price', 'delivery_date', 'notes',
    ];

    protected $casts = [
        'qty_ordered'   => 'decimal:2',
        'qty_reserved'  => 'decimal:2',
        'qty_to_produce' => 'decimal:2',
        'qty_produced'  => 'decimal:2',
        'qty_delivered' => 'decimal:2',
        'unit_price'    => 'decimal:2',
        'delivery_date' => 'date',
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function stockReservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'sales_order_item_id');
    }

    public function demands(): HasMany
    {
        return $this->hasMany(ProductionDemand::class, 'sales_order_item_id');
    }
}
