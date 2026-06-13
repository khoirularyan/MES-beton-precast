<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryOrder extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_delivery_orders';

    protected $fillable = [
        'no', 'sales_order_id', 'customer_id', 'qty', 'truk', 'driver', 'tgl_kirim', 'status', 'catatan',
    ];

    protected $casts = [
        'tgl_kirim' => 'date',
        'qty'       => 'integer',
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
