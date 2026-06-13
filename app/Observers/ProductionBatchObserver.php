<?php

namespace App\Observers;

use App\Models\ProductionBatch;
use App\Models\SalesOrder;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class ProductionBatchObserver
{
    /**
     * Handle the ProductionBatch "saved" event.
     */
    public function saved(ProductionBatch $batch): void
    {
        $this->syncSalesOrderStatus($batch);
    }

    /**
     * Handle the ProductionBatch "deleted" event.
     */
    public function deleted(ProductionBatch $batch): void
    {
        $this->syncSalesOrderStatus($batch);
    }

    /**
     * Sync Sales Order status based on batch progress.
     */
    protected function syncSalesOrderStatus(ProductionBatch $batch): void
    {
        // Avoid recursive saving loop
        static $syncing = false;
        if ($syncing) {
            return;
        }

        $demand = $batch->demand;
        if (!$demand || !$demand->sales_order_id) {
            return;
        }

        $salesOrder = SalesOrder::find($demand->sales_order_id);
        if (!$salesOrder) {
            return;
        }

        // Only sync if Sales Order is in production progress lifecycle: Planning, Production, Completed, Delivered
        if (!in_array($salesOrder->status, ['Planning', 'Production', 'Completed', 'Delivered'])) {
            return;
        }

        $syncing = true;
        try {
            DB::transaction(function () use ($salesOrder, $batch) {
                // Find all production demands for this Sales Order
                $demandIds = $salesOrder->demands()->pluck('id');
                if ($demandIds->isEmpty()) {
                    return;
                }

                // Find all batches related to these demands
                $batches = ProductionBatch::whereIn('demand_id', $demandIds)
                    ->whereNull('deleted_at')
                    ->get();

                if ($batches->isEmpty()) {
                    // If no batches exist but we are in this lifecycle, keep it in Planning
                    $newStatus = 'Planning';
                } else {
                    $mappedStatuses = $batches->map(function ($b) {
                        $nameLower = strtolower(trim($b->statusModel?->status ?? ''));
                        if (strpos($nameLower, 'planning') !== false || strpos($nameLower, 'rencana') !== false || strpos($nameLower, 'ready') !== false || strpos($nameLower, 'material') !== false) {
                            return 'Planning';
                        }
                        if (strpos($nameLower, 'finished') !== false || strpos($nameLower, 'selesai') !== false || strpos($nameLower, 'komplet') !== false) {
                            return 'Completed';
                        }
                        if (strpos($nameLower, 'delivered') !== false || strpos($nameLower, 'kirim') !== false) {
                            return 'Delivered';
                        }
                        return 'Production'; // Intermediate running statuses (casting, demolding, qc, etc.)
                    });

                    $uniqueStatuses = $mappedStatuses->unique();

                    if ($uniqueStatuses->count() === 1 && $uniqueStatuses->first() === 'Delivered') {
                        $newStatus = 'Delivered';
                    } elseif ($uniqueStatuses->every(fn($s) => in_array($s, ['Completed', 'Delivered']))) {
                        $newStatus = 'Completed';
                    } elseif ($uniqueStatuses->contains('Production') || ($uniqueStatuses->contains('Planning') && ($uniqueStatuses->contains('Completed') || $uniqueStatuses->contains('Delivered')))) {
                        $newStatus = 'Production';
                    } else {
                        $newStatus = 'Planning';
                    }
                }

                if ($salesOrder->status !== $newStatus) {
                    $oldValues = ['status' => $salesOrder->status];
                    $salesOrder->status = $newStatus;
                    $salesOrder->save();

                    AuditLog::log(
                        'sales_order.status_synced',
                        'sales_order',
                        $salesOrder->id,
                        $oldValues,
                        ['status' => $newStatus, 'trigger_batch_id' => $batch->id]
                    );
                }
            });
        } finally {
            $syncing = false;
        }
    }
}
