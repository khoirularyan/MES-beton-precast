<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class MasterDataObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        $entityType = strtolower(class_basename($model));
        AuditLog::log(
            "{$entityType}.created",
            $entityType,
            $model->id,
            null,
            $model->toArray()
        );
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        $entityType = strtolower(class_basename($model));
        // Only log actual dirty changes
        $dirty = $model->getDirty();
        if (empty($dirty)) {
            return;
        }

        $oldValues = array_intersect_key($model->getRawOriginal(), $dirty);
        AuditLog::log(
            "{$entityType}.updated",
            $entityType,
            $model->id,
            $oldValues,
            $model->only(array_keys($dirty))
        );
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $entityType = strtolower(class_basename($model));
        AuditLog::log(
            "{$entityType}.deleted",
            $entityType,
            $model->id,
            $model->toArray(),
            null
        );
    }
}
