<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionMaterialInventory extends Model
{
    protected $table = 'public.production_material_inventory';

    protected $fillable = [
        'material_id',
        'qty_on_hand',
    ];

    protected $casts = [
        'material_id' => 'integer',
        'qty_on_hand' => 'decimal:3',
    ];

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'material_id');
    }
}
