<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    use SoftDeletes;

    protected $table = 'production_materials';

    protected $fillable = [
        'kode', 'nama', 'satuan', 'kategori', 'stok',
        'min_stok', 'supplier_id', 'harga', 'lead_time_hari', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'stok' => 'decimal:3',
        'min_stok' => 'decimal:3',
        'harga' => 'integer',
        'lead_time_hari' => 'integer',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function bomItems(): HasMany
    {
        return $this->hasMany(BomItem::class, 'material_id');
    }
}
