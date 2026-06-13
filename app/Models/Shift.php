<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;

    protected $table = 'global.production_shifts';

    protected $fillable = [
        'kode', 'nama', 'jam', 'supervisor_id', 'jumlah_pekerja', 'aktif',
    ];

    protected $casts = [
        'aktif'         => 'boolean',
        'jumlah_pekerja' => 'integer',
        'supervisor_id'  => 'integer',
    ];

    /**
     * Relasi ke User sebagai Supervisor
     */
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
