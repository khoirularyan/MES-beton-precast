<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Supplier extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_suppliers';

    protected $fillable = [
        'nama', 'kontak', 'email',
        'alamat', 'kota', 'rating', 'lead_time_hari', 'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'rating' => 'integer',
        'lead_time_hari' => 'integer',
    ];

    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(Material::class, 'global.production_supplier_materials', 'supplier_id', 'material_id')->withTimestamps();
    }
}
