<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BomItem extends Model
{
    protected $table = 'global.production_bom_items';

    protected $fillable = [
        'bom_header_id', 'material_id', 'qty_per_unit',
        'waste_pct', 'urutan', 'catatan', 'material_type', 'harga_snapshot',
    ];

    protected $casts = [
        'qty_per_unit' => 'decimal:4',
        'waste_pct' => 'decimal:2',
        'urutan' => 'integer',
        'harga_snapshot' => 'integer',
    ];

    protected $appends = [
        'material_cost',
        'waste_cost',
        'total_cost',
    ];

    public function bomHeader(): BelongsTo
    {
        return $this->belongsTo(BomHeader::class, 'bom_header_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function getMaterialCostAttribute()
    {
        return (float) $this->qty_per_unit * (float) $this->harga_snapshot;
    }

    public function getWasteCostAttribute()
    {
        return $this->material_cost * ((float) $this->waste_pct / 100.0);
    }

    public function getTotalCostAttribute()
    {
        return $this->material_cost + $this->waste_cost;
    }
}
