<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_customers';

    protected $fillable = [
        'kode', 'nama', 'kontak', 'telepon', 'email',
        'npwp', 'pic_proyek',
        'alamat', 'kota', 'segmen', 'limit_kredit', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'limit_kredit' => 'integer',
    ];

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'customer_id');
    }
}
