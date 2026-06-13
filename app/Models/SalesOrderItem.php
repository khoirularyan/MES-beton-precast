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
        'bom_header_id', 'bom_version_snapshot',
        'product_code_snapshot', 'product_name_snapshot', 'unit_snapshot',
        'estimated_volume', 'estimated_weight',
    ];

    protected $appends = ['bom_health'];

    public function getBomHealthAttribute(): array
    {
        // Query active BOM
        $activeBom = BomHeader::where('product_id', $this->product_id)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->first();

        if ($activeBom) {
            return [
                'status' => 'active',
                'label' => 'BOM ' . $activeBom->version,
                'version' => $activeBom->version
            ];
        }

        // Query draft BOM
        $draftBom = BomHeader::where('product_id', $this->product_id)
            ->where('status', 'draft')
            ->whereNull('deleted_at')
            ->first();

        if ($draftBom) {
            return [
                'status' => 'draft',
                'label' => 'BOM Draft',
                'version' => $draftBom->version
            ];
        }

        return [
            'status' => 'none',
            'label' => 'No Active BOM'
        ];
    }

    protected $casts = [
        'qty_ordered'   => 'decimal:2',
        'qty_reserved'  => 'decimal:2',
        'qty_to_produce' => 'decimal:2',
        'qty_produced'  => 'decimal:2',
        'qty_delivered' => 'decimal:2',
        'unit_price'    => 'decimal:2',
        'delivery_date' => 'date',
        'estimated_volume' => 'decimal:3',
        'estimated_weight' => 'decimal:2',
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function bomHeader(): BelongsTo
    {
        return $this->belongsTo(BomHeader::class, 'bom_header_id');
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
