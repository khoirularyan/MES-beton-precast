<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryBatch extends Model
{
    use SoftDeletes;

    protected $table = 'public.production_inventory_batches';

    protected $fillable = [
        'batch_number', 'product_id', 'warehouse', 'location',
        'production_date', 'qty_on_hand', 'qty_reserved', 'status', 'notes',
    ];

    protected $casts = [
        'production_date' => 'date',
        'qty_on_hand'     => 'decimal:2',
        'qty_reserved'    => 'decimal:2',
    ];

    protected $appends = ['qty_available', 'aging_days'];

    public function getQtyAvailableAttribute(): float
    {
        return max(0, (float) $this->qty_on_hand - (float) $this->qty_reserved);
    }

    public function getAgingDaysAttribute(): int
    {
        if (! $this->production_date) return 0;
        return (int) $this->production_date->diffInDays(now());
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'inventory_batch_id');
    }
}
