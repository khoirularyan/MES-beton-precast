<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_products';

    protected $fillable = [
        'kode', 'nama', 'kategori', 'varian', 'spek',
        'grade', 'berat', 'volume_m3',
        'harga', 'satuan', 'standar', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'berat' => 'decimal:2',
        'volume_m3' => 'decimal:3',
        'harga' => 'integer',
    ];

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'product_id');
    }

    public function salesOrderItems(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class, 'product_id');
    }

    public function bomHeaders(): HasMany
    {
        return $this->hasMany(BomHeader::class, 'product_id');
    }

    public function inventoryBatches(): HasMany
    {
        return $this->hasMany(InventoryBatch::class, 'product_id');
    }

    public function productionBatches(): HasMany
    {
        return $this->hasMany(ProductionBatch::class, 'product_id');
    }

    public function productionPlans(): HasMany
    {
        return $this->hasMany(ProductionPlan::class, 'product_id');
    }

    public function productionDemands(): HasMany
    {
        return $this->hasMany(ProductionDemand::class, 'product_id');
    }

    public function productSpecs(): HasMany
    {
        return $this->hasMany(ProductSpec::class, 'product_id');
    }
}
