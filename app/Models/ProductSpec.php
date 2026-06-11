<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSpec extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_product_specs';

    protected $fillable = [
        'product_id', 'kode', 'produk', 'dimensi', 'toleransi', 'berat', 'grade', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    /**
     * Get the product that owns this specification
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
