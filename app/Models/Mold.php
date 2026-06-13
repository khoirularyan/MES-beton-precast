<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mold extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_molds';

    protected $fillable = [
        'kode', 'nama', 'produk', 'jumlah_total', 'jumlah_aktif', 'kondisi', 'utilisasi',
        'kapasitas_per_siklus', 'siklus_per_hari', 'product_id', 'jumlah', 'aktif',
    ];

    protected $casts = [
        'jumlah_total'         => 'integer',
        'jumlah_aktif'         => 'integer',
        'utilisasi'            => 'integer',
        'kapasitas_per_siklus' => 'integer',
        'siklus_per_hari'      => 'integer',
        'product_id'           => 'integer',
    ];

    /**
     * Backward compatibility for jumlah
     */
    public function getJumlahAttribute()
    {
        return $this->jumlah_total;
    }

    public function setJumlahAttribute($value)
    {
        $this->attributes['jumlah_total'] = $value;
    }

    /**
     * Backward compatibility for aktif
     */
    public function getAktifAttribute()
    {
        return $this->jumlah_aktif;
    }

    public function setAktifAttribute($value)
    {
        $this->attributes['jumlah_aktif'] = $value;
    }

    /**
     * Get the product this mold is for
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Check if mold is available on a specific date
     */
    public function isAvailableOnDate(string $date): bool
    {
        $finishedOrDeliveredIds = \Illuminate\Support\Facades\DB::table('global.production_batch_statuses')
            ->whereIn('status', ['Finished', 'Delivered'])
            ->pluck('id');

        return !ProductionBatch::where('mold_id', $this->id)
            ->where('planned_date', $date)
            ->whereNotIn('batch_status_id', $finishedOrDeliveredIds)
            ->exists();
    }

    /**
     * Get batches scheduled for this mold
     */
    public function batches()
    {
        return $this->hasMany(ProductionBatch::class, 'mold_id');
    }

    /**
     * Get production plans using this mold
     */
    public function productionPlans()
    {
        return $this->hasMany(ProductionPlan::class, 'mold_id');
    }

    /**
     * Allowed products many-to-many relationship
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'global.product_allowed_molds', 'mold_id', 'product_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }
}
