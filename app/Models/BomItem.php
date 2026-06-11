<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BomItem extends Model
{
    protected $table = 'global.production_bom_items';

    protected $fillable = [
        'bom_header_id', 'material_id', 'qty_per_unit',
        'waste_pct', 'urutan', 'catatan',
    ];

    protected $casts = [
        'qty_per_unit' => 'decimal:3',
        'waste_pct' => 'decimal:2',
        'urutan' => 'integer',
    ];

    public function bomHeader(): BelongsTo
    {
        return $this->belongsTo(BomHeader::class, 'bom_header_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'material_id');
    }
}
