<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class BomHeader extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_bom_headers';

    protected $fillable = [
        'product_id', 'version', 'notes', 'status',
        'output_qty', 'output_uom', 'total_material_cost', 'total_waste_cost',
        'bom_efficiency', 'overhead_pct', 'dibuat_oleh', 'berlaku_dari',
    ];

    protected $casts = [
        'output_qty' => 'decimal:4',
        'total_material_cost' => 'integer',
        'total_waste_cost' => 'integer',
        'bom_efficiency' => 'decimal:2',
        'overhead_pct' => 'decimal:2',
        'berlaku_dari' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BomItem::class, 'bom_header_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', 'archived');
    }

    public function recalculateTotals(): self
    {
        $totalMaterial = 0.0;
        $totalWaste = 0.0;

        foreach ($this->items as $item) {
            $qty = (float) $item->qty_per_unit;
            $price = (float) $item->harga_snapshot;
            $wastePct = (float) $item->waste_pct;

            $itemMaterialCost = $qty * $price;
            $itemWasteCost = $itemMaterialCost * ($wastePct / 100.0);

            $totalMaterial += $itemMaterialCost;
            $totalWaste += $itemWasteCost;
        }

        $this->total_material_cost = (int) round($totalMaterial);
        $this->total_waste_cost = (int) round($totalWaste);
        $this->save();

        return $this;
    }
}
