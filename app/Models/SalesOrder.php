<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_sales_orders';

    protected $fillable = [
        'no', 'so_type', 'customer_id', 'product_id', 'qty',
        'nilai', 'tgl_order', 'tgl_kirim', 'status', 'prioritas', 'catatan',
    ];

    protected $casts = [
        'tgl_order' => 'date',
        'tgl_kirim' => 'date',
        'qty' => 'integer',
        'nilai' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class, 'sales_order_id');
    }

    public function demands(): HasMany
    {
        return $this->hasMany(ProductionDemand::class, 'sales_order_id');
    }

    public function stockReservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'sales_order_id');
    }
}
