<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'min_stok' => 'decimal:3',
        'harga' => 'integer',
        'lead_time_hari' => 'integer',
    ];

    private ?float $tempStok = null;

    protected static function booted()
    {
        static::saved(function ($material) {
            if ($material->wasRecentlyCreated || $material->tempStok !== null) {
                $stok = $material->tempStok !== null ? $material->tempStok : 0.0;
                $material->inventory()->updateOrCreate([], ['qty_on_hand' => $stok]);
                $material->tempStok = null;
            }
        });
    }

    public function getStokAttribute()
    {
        return $this->inventory ? (float) $this->inventory->qty_on_hand : 0.0;
    }

    public function setStokAttribute($value)
    {
        if ($this->exists) {
            $this->inventory()->updateOrCreate([], ['qty_on_hand' => $value]);
        } else {
            $this->tempStok = (float) $value;
        }
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(ProductionMaterialInventory::class, 'material_id');
    }

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'global.production_supplier_materials', 'material_id', 'supplier_id')->withTimestamps();
    }

    public function bomItems(): HasMany
    {
        return $this->hasMany(BomItem::class, 'material_id');
    }
}
