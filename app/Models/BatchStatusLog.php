<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatchStatusLog extends Model
{
    protected $table = 'public.production_batch_status_logs';

    protected $fillable = [
        'production_batch_id', 'from_status_id', 'to_status_id', 'user_id', 'changed_at', 'notes',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    public function fromStatus(): BelongsTo
    {
        return $this->belongsTo(BatchStatus::class, 'from_status_id');
    }

    public function toStatus(): BelongsTo
    {
        return $this->belongsTo(BatchStatus::class, 'to_status_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
