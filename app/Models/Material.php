<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Material extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_materials';

    protected $fillable = [
        'kode', 'nama', 'satuan', 'kategori', 'stok',
        'min_stok', 'harga', 'lead_time_hari', 'supplier_id', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'stok' => 'decimal:3',
        'min_stok' => 'decimal:3',
        'harga' => 'integer',
        'lead_time_hari' => 'integer',
    ];

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'global.production_supplier_materials', 'material_id', 'supplier_id')->withTimestamps();
    }

    public function bomItems(): HasMany
    {
        return $this->hasMany(BomItem::class, 'material_id');
    }
}
