<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BomHeader extends Model
{
    protected $table = 'global.production_bom_headers';

    protected $fillable = [
        'product_id', 'versi', 'is_active', 'catatan',
        'bom_efficiency', 'overhead_pct', 'dibuat_oleh', 'berlaku_dari',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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
}
