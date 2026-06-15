<?php

namespace App\Services;

use App\Models\ProductionDemand;
use App\Models\ProductionPlan;
use App\Models\ProductionBatch;
use App\Models\Mold;
use App\Models\WorkCenter;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class ProductionPlanningService
{
    /**
     * Get compatible molds for a product
     */
    public function getCompatibleMolds(int $productId)
    {
        $product = \App\Models\Product::findOrFail($productId);
        
        // Try global.product_allowed_molds join table first
        $molds = $product->allowedMolds()->where('jumlah_aktif', '>', 0)->get();
        
        if ($molds->isEmpty()) {
            // Fallback 1: match product_id direct relationship
            $molds = Mold::where('product_id', $productId)
                ->where('jumlah_aktif', '>', 0)
                ->get();
        }

        if ($molds->isEmpty()) {
            // Fallback 2: generic molds
            $molds = Mold::whereNull('product_id')
                ->where('jumlah_aktif', '>', 0)
                ->get();
        }

        return $molds;
    }

    /**
     * Preview schedule before saving.
     * Accepts optional mold_id to override auto-selection.
     */
    public function previewSchedule(ProductionDemand $demand, string $startDate, ?int $moldId = null): array
    {
        $productId = $demand->product_id;
        $demandQty = (float) $demand->demand_qty;

        $molds = $this->getCompatibleMolds($productId);
        if ($molds->isEmpty()) {
            throw ValidationException::withMessages([
                'product_id' => ['No active compatible mold found for this product.']
            ]);
        }

        // Use caller-specified mold or auto-select primary / first compatible
        if ($moldId) {
            $mold = $molds->firstWhere('id', $moldId);
            if (!$mold) {
                // Allow any active mold when overriding
                $mold = Mold::where('id', $moldId)->where('jumlah_aktif', '>', 0)->first();
            }
            if (!$mold) {
                throw ValidationException::withMessages([
                    'mold_id' => ['Selected mold is not active or not compatible with this product.']
                ]);
            }
        } else {
            $mold = $molds->firstWhere('pivot.is_primary', true) ?: $molds->first();
        }
        
        $capacityService = new CapacityPlanningService();
        $dailyCapacity = $capacityService->getDailyCapacity($mold);

        if ($dailyCapacity <= 0) {
            throw ValidationException::withMessages([
                'mold_id' => ['Mold ' . $mold->nama . ' has 0 active capacity. Please ensure active mold count and cycles/day are set.']
            ]);
        }

        $remainingQty = $demandQty;
        $currentDate = Carbon::parse($startDate);
        $batches = [];
        $dayCount = 0;
        $sequence = 1;

        while ($remainingQty > 0) {
            if ($dayCount > 365) {
                throw ValidationException::withMessages([
                    'capacity' => ['Required production period exceeds 365 days. Capacity is too low or demand is too high.']
                ]);
            }

            $dateStr = $currentDate->toDateString();
            $remainingCapacity = $capacityService->getRemainingCapacity($mold->id, $dateStr);

            if ($remainingCapacity > 0) {
                $allocQty = min($remainingCapacity, $remainingQty);
                $batches[] = [
                    'sequence' => $sequence++,
                    'date'     => $dateStr,
                    'qty'      => $allocQty,
                ];
                $remainingQty -= $allocQty;
            }

            $currentDate->addDay();
            $dayCount++;
        }

        $uniqueDates = array_unique(array_column($batches, 'date'));

        // Count molds in use: active batches (not finished/delivered) from start date onward
        $finishedStatusIds = DB::table('global.production_batch_statuses')
            ->whereRaw("LOWER(status) IN ('finished','selesai','delivered','kirim')")
            ->pluck('id');

        $jumlahTerpakai = (int) ProductionBatch::where('mold_id', $mold->id)
            ->where('planned_date', '>=', $startDate)
            ->whereNotIn('batch_status_id', $finishedStatusIds)
            ->whereNull('deleted_at')
            ->distinct('production_plan_id')
            ->count('production_plan_id');

        $jumlahTersedia = max(0, ($mold->jumlah_aktif ?? 0) - $jumlahTerpakai);

        $compatibleMolds = $molds->map(function ($m) use ($startDate, $finishedStatusIds) {
            $terpakai = (int) ProductionBatch::where('mold_id', $m->id)
                ->where('planned_date', '>=', $startDate)
                ->whereNotIn('batch_status_id', $finishedStatusIds)
                ->whereNull('deleted_at')
                ->distinct('production_plan_id')
                ->count('production_plan_id');
            $tersedia = max(0, ($m->jumlah_aktif ?? 0) - $terpakai);
            return [
                'id'              => $m->id,
                'kode'            => $m->kode,
                'nama'            => $m->nama,
                'jumlah_total'    => $m->jumlah_total,
                'jumlah_aktif'    => $m->jumlah_aktif,
                'jumlah_terpakai' => $terpakai,
                'jumlah_tersedia' => $tersedia,
                'is_primary'      => (bool) ($m->pivot->is_primary ?? false),
            ];
        })->values()->toArray();

        return [
            'mold_id'          => $mold->id,
            'mold_name'        => $mold->nama,
            'mold_kode'        => $mold->kode,
            'jumlah_total'     => $mold->jumlah_total,
            'jumlah_aktif'     => $mold->jumlah_aktif,
            'jumlah_terpakai'  => $jumlahTerpakai,
            'jumlah_tersedia'  => $jumlahTersedia,
            'required_days'    => count($uniqueDates),
            'required_batches' => count($batches),
            'batches'          => $batches,
            'compatible_molds' => $compatibleMolds,
            'daily_capacity'   => $dailyCapacity,
        ];
    }

    /**
     * Manual Batch Scheduling — user provides explicit batches list.
     *
     * @param ProductionDemand $demand
     * @param array $params ['start_date', 'mold_id', 'notes', 'manual_batches' => [['date','qty','sequence'],...]]
     * @return ProductionPlan
     */
    private function scheduleProductionManual(ProductionDemand $demand, array $params): ProductionPlan
    {
        if (empty($params['mold_id'])) {
            throw ValidationException::withMessages([
                'mold_id' => ['Mold harus dipilih untuk mode manual.'],
            ]);
        }

        $mold = Mold::find($params['mold_id']);
        if (!$mold || ($mold->jumlah_aktif ?? 0) <= 0) {
            throw ValidationException::withMessages([
                'mold_id' => ['Mold yang dipilih tidak aktif atau tidak ditemukan.'],
            ]);
        }

        $manualBatches = $params['manual_batches'];
        $plannedQty = array_sum(array_column($manualBatches, 'qty'));

        return DB::transaction(function () use ($demand, $params, $mold, $manualBatches, $plannedQty) {
            $product = $demand->product;
            $planVolume = ($product->volume_m3 ?? 0) * $plannedQty;
            $planNumber = 'PLAN-' . now()->format('YmdHis') . '-' . $demand->id;

            $batchDates = array_column($manualBatches, 'date');
            sort($batchDates);
            $startDate = $batchDates[0] ?? $params['start_date'];
            $endDate   = end($batchDates) ?: $params['start_date'];

            $plan = ProductionPlan::create([
                'plan_number'             => $planNumber,
                'plan_level'              => 'Daily',
                'period_start'            => $startDate,
                'period_end'              => $endDate,
                'start_date'              => $startDate,
                'end_date'                => $endDate,
                'product_id'              => $demand->product_id,
                'planned_qty'             => $plannedQty,
                'demand_qty'              => (float) $demand->demand_qty,
                'planned_volume_m3'       => $planVolume,
                'sales_order_id'          => $demand->sales_order_id,
                'demand_id'               => $demand->id,
                'mold_id'                 => $mold->id,
                'mold_capacity_per_cycle' => $mold->kapasitas_per_siklus,
                'mold_capacity_snapshot'  => $mold->kapasitas_per_siklus,
                'required_days'           => count(array_unique($batchDates)),
                'required_batches'        => count($manualBatches),
                'status'                  => 'Scheduled',
                'notes'                   => ($params['notes'] ?? '') . ' [Manual Plan]',
            ]);

            $oldStatus = $demand->status;
            $demand->update(['status' => 'Planned']);

            AuditLog::log('production_demand.planned', 'production_demand', $demand->id,
                ['status' => $oldStatus], ['status' => 'Planned']);
            AuditLog::log('production_plan.scheduled', 'production_plan', $plan->id,
                null, $plan->toArray());

            $planningStatus = DB::table('global.production_batch_statuses')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
                })
                ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
            $batchStatusId = $planningStatus ? $planningStatus->id : 1;
            $totalBatches  = count($manualBatches);

            foreach ($manualBatches as $index => $b) {
                $seq        = $b['sequence'] ?? ($index + 1);
                $batchQty   = (float) $b['qty'];
                $batchVol   = ($product->volume_m3 ?? 0) * $batchQty;
                $batchNumber = 'BATCH-' . str_pad($plan->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($seq, 3, '0', STR_PAD_LEFT);

                $batch = ProductionBatch::create([
                    'batch_number'       => $batchNumber,
                    'production_plan_id' => $plan->id,
                    'demand_id'          => $plan->demand_id,
                    'sales_order_id'     => $plan->sales_order_id,
                    'source_type'        => 'SO',
                    'product_id'         => $plan->product_id,
                    'target_qty'         => $batchQty,
                    'target_volume_m3'   => $batchVol,
                    'planned_date'       => $b['date'],
                    'planned_start'      => $b['date'] . ' 08:00:00',
                    'planned_end'        => (!empty($b['end_date']) ? $b['end_date'] : $b['date']) . ' 17:00:00',
                    'mold_id'            => $mold->id,
                    'batch_sequence'     => $seq,
                    'batch_status_id'    => $batchStatusId,
                    'notes'              => "Batch {$seq} of {$totalBatches} - Manual entry",
                ]);

                AuditLog::log('production_batch.generated', 'production_batch', $batch->id,
                    null, $batch->toArray());
            }

            return $plan;
        });
    }

    /**
     * CAPACITY-DRIVEN WORKFLOW: Schedule Production from Demand
     * System automatically selects compatible mold, calculates capacity, 
     * reserves capacity over required days, creates production plan, and generates batches.
     * 
     * @param ProductionDemand $demand
     * @param array $params ['start_date', 'notes', 'planning_mode?', 'manual_batches?']
     * @return ProductionPlan
     */
    public function scheduleProduction(ProductionDemand $demand, array $params): ProductionPlan
    {
        $planningMode = $params['planning_mode'] ?? 'auto';

        if ($planningMode === 'manual') {
            return $this->scheduleProductionManual($demand, $params);
        }
        // Validate demand status
        if (!in_array($demand->status, ['Open', 'Approved'])) {
            throw ValidationException::withMessages([
                'status' => ['Only Open or Approved demands can be scheduled.']
            ]);
        }

        if (empty($params['start_date'])) {
            throw ValidationException::withMessages([
                'start_date' => ['Start date is required.']
            ]);
        }

        $preview = $this->previewSchedule($demand, $params['start_date'], $params['mold_id'] ?? null);
        $mold = Mold::findOrFail($preview['mold_id']);
        
        return DB::transaction(function () use ($demand, $params, $preview, $mold) {
            $product = $demand->product;
            $demandQty = (float) $demand->demand_qty;
            $planVolume = ($product->volume_m3 ?? 0) * $demandQty;
            $planNumber = 'PLAN-' . now()->format('YmdHis') . '-' . $demand->id;

            // Find start and end date from batches
            $batchDates = array_column($preview['batches'], 'date');
            $endDate = !empty($batchDates) ? end($batchDates) : $params['start_date'];

            // Create production plan
            $plan = ProductionPlan::create([
                'plan_number'             => $planNumber,
                'plan_level'              => 'Daily',
                'period_start'            => $params['start_date'],
                'period_end'              => $endDate,
                'start_date'              => $params['start_date'],
                'end_date'                => $endDate,
                'product_id'              => $demand->product_id,
                'planned_qty'             => $demandQty,
                'demand_qty'              => $demandQty,
                'planned_volume_m3'       => $planVolume,
                'sales_order_id'          => $demand->sales_order_id,
                'demand_id'               => $demand->id,
                'mold_id'                 => $mold->id,
                'mold_capacity_per_cycle' => $mold->kapasitas_per_siklus,
                'mold_capacity_snapshot'  => $mold->kapasitas_per_siklus,
                'daily_capacity'          => $preview['daily_capacity'],
                'required_days'           => $preview['required_days'],
                'required_batches'        => $preview['required_batches'],
                'status'                  => 'Scheduled',
                'notes'                   => $params['notes'] ?? 'Auto-scheduled from Demand ' . $demand->demand_number,
            ]);

            // Update demand status
            $oldDemandStatus = $demand->status;
            $demand->update(['status' => 'Planned']);

            // Audit log
            AuditLog::log('production_demand.planned', 'production_demand', $demand->id, 
                ['status' => $oldDemandStatus], ['status' => 'Planned']);
            AuditLog::log('production_plan.scheduled', 'production_plan', $plan->id, 
                null, $plan->toArray());

            // Generate batches
            $planningStatus = DB::table('global.production_batch_statuses')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
                })
                ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
            $batchStatusId = $planningStatus ? $planningStatus->id : 1;

            foreach ($preview['batches'] as $b) {
                $batchQty = $b['qty'];
                $batchVolume = ($product->volume_m3 ?? 0) * $batchQty;
                $batchNumber = 'BATCH-' . str_pad($plan->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($b['sequence'], 3, '0', STR_PAD_LEFT);
                
                $batch = ProductionBatch::create([
                    'batch_number'       => $batchNumber,
                    'production_plan_id' => $plan->id,
                    'demand_id'          => $plan->demand_id,
                    'sales_order_id'     => $plan->sales_order_id,
                    'source_type'        => 'SO',
                    'product_id'         => $plan->product_id,
                    'target_qty'         => $batchQty,
                    'target_volume_m3'   => $batchVolume,
                    'planned_date'       => $b['date'],
                    'planned_start'      => $b['date'] . ' 08:00:00',
                    'planned_end'        => $b['date'] . ' 17:00:00',
                    'mold_id'            => $mold->id,
                    'batch_sequence'     => $b['sequence'],
                    'batch_status_id'    => $batchStatusId,
                    'notes'              => "Batch {$b['sequence']} of {$preview['required_batches']} - Auto-generated",
                ]);

                AuditLog::log('production_batch.generated', 'production_batch', $batch->id, 
                    null, $batch->toArray());
            }

            return $plan;
        });
    }

    /**
     * Get Gantt Calendar Data - Per batch, so each batch renders as its own bar.
     */
    public function getCalendarData(?string $from = null, ?string $to = null): array
    {
        $query = ProductionBatch::with(['product', 'mold', 'plan.salesOrder.customer', 'statusModel'])
            ->whereNotNull('mold_id')
            ->whereNull('deleted_at');

        if ($from && $to) {
            $query->where(function ($q) use ($from, $to) {
                $q->whereBetween('planned_date', [$from, $to])
                  ->orWhere(function ($q2) use ($from, $to) {
                      $q2->whereRaw("DATE(planned_start) BETWEEN ? AND ?", [$from, $to]);
                  });
            });
        }

        $batches = $query->get();

        return $batches->map(function ($batch) {
            $date  = $batch->planned_date
                ? (is_string($batch->planned_date) ? $batch->planned_date : $batch->planned_date->toDateString())
                : ($batch->planned_start ? substr($batch->planned_start, 0, 10) : null);

            // end_date: use planned_end if available, otherwise same day as start
            $endDate = $batch->planned_end
                ? substr(is_string($batch->planned_end) ? $batch->planned_end : $batch->planned_end->toDateString(), 0, 10)
                : $date;

            $plan = $batch->plan;

            return [
                'resource'      => $batch->mold?->nama ?? 'Unknown Mold',
                'start'         => $date,
                'end'           => $endDate,
                'qty'           => (float) $batch->target_qty,
                'customer'      => $plan?->salesOrder?->customer?->nama ?? 'MTS / Stock',
                'sales_order'   => $plan?->salesOrder?->no ?? $plan?->salesOrder?->so_number ?? 'N/A',
                'plan_id'       => $batch->production_plan_id,
                'batch_id'      => $batch->id,
                'batch_number'  => $batch->batch_number,
                'batch_seq'     => $batch->batch_sequence,
                'mold_id'       => $batch->mold_id,
                'product_name'  => $batch->product?->nama,
                'status'        => $batch->statusModel?->status ?? null,
            ];
        })->toArray();
    }

    /**
     * Get Dashboard Statistics - Capacity Driven
     */
    public function getPlanningDashboardStats(): array
    {
        $capacityService = new CapacityPlanningService();
        
        $totalActiveMolds = Mold::where('jumlah_aktif', '>', 0)->count() ?: 1;
        $activeStatusIds = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%finished%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%selesai%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%delivered%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%kirim%'])
            ->pluck('id');

        $scheduledMolds = ProductionBatch::whereIn('batch_status_id', $activeStatusIds)
            ->distinct('mold_id')
            ->count('mold_id');

        // Total Daily Capacity of all active molds
        $activeMoldsList = Mold::where('jumlah_aktif', '>', 0)->get();
        $totalCapacity = 0;
        foreach ($activeMoldsList as $m) {
            $totalCapacity += $capacityService->getDailyCapacity($m);
        }

        // Used capacity today
        $todayStr = Carbon::today()->toDateString();
        $usedCapacity = (float) ProductionBatch::whereDate('planned_date', $todayStr)
            ->sum('target_qty');

        $remainingCapacity = max(0.0, (float) $totalCapacity - $usedCapacity);
        $moldUtilization = $totalCapacity > 0 ? min(100.0, round(($usedCapacity / $totalCapacity) * 100, 1)) : 0.0;

        $demandOpen = ProductionDemand::where('status', 'Open')->count();
        $demandApproved = ProductionDemand::where('status', 'Approved')->count();
        $demandScheduled = ProductionDemand::where('status', 'Planned')->count();

        $batchStatuses = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->get();

        $statusCounts = ProductionBatch::select('batch_status_id', DB::raw('COUNT(*) as count'))
            ->groupBy('batch_status_id')
            ->pluck('count', 'batch_status_id')
            ->toArray();

        $batchPlanned = 0;
        $batchActive = 0;
        $batchQc = 0;
        $batchCompleted = 0;
        $batchDelivered = 0;

        foreach ($batchStatuses as $status) {
            $nameLower = strtolower(trim($status->status));
            $count = $statusCounts[$status->id] ?? 0;

            if (strpos($nameLower, 'planning') !== false || strpos($nameLower, 'rencana') !== false) {
                $batchPlanned += $count;
            } elseif (strpos($nameLower, 'casting') !== false || strpos($nameLower, 'cetak') !== false) {
                $batchActive += $count;
            } elseif (strpos($nameLower, 'qc') !== false || strpos($nameLower, 'quality') !== false) {
                $batchQc += $count;
            } elseif (strpos($nameLower, 'finished') !== false || strpos($nameLower, 'selesai') !== false) {
                $batchCompleted += $count;
            } elseif (strpos($nameLower, 'delivered') !== false || strpos($nameLower, 'kirim') !== false) {
                $batchDelivered += $count;
            }
        }

        $totalScheduledQty = (float) ProductionPlan::where('status', 'Scheduled')->sum('planned_qty');

        $lateDemandCount = ProductionDemand::whereIn('status', ['Open', 'Approved'])
            ->where('required_date', '<', Carbon::today()->toDateString())
            ->count();

        return [
            // Demand stats
            'demand_open'      => $demandOpen,
            'demand_approved'  => $demandApproved,
            'demand_scheduled' => $demandScheduled,
            'demand_planned'   => $demandScheduled, // Alias

            // Batch stats
            'batch_planned'    => $batchPlanned,
            'batch_planning'   => $batchPlanned, // Alias
            'batch_active'     => $batchActive,
            'batch_qc'         => $batchQc,
            'batch_completed'  => $batchCompleted,
            'batch_finished'   => $batchCompleted, // Alias
            'batch_delivered'  => $batchDelivered,

            // Capacity stats
            'total_scheduled_qty'   => $totalScheduledQty,
            'mold_utilization_pct'  => $moldUtilization,
            'line_utilization_pct'  => 0.0,
            'total_active_molds'    => $totalActiveMolds,
            'scheduled_molds_count' => $scheduledMolds,
            'late_demand_count'     => $lateDemandCount,

            // Refactored Capacity parameters
            'total_capacity'        => $totalCapacity,
            'used_capacity'         => $usedCapacity,
            'remaining_capacity'    => $remainingCapacity,
            'utilization_pct'       => $moldUtilization,
        ];
    }

    /**
     * Get available molds for scheduling
     */
    public function getAvailableMolds(int $productId, string $startDate, string $endDate)
    {
        $allMolds = $this->getCompatibleMolds($productId);
        $capacityService = new CapacityPlanningService();

        return $allMolds->map(function ($mold) use ($startDate, $endDate, $capacityService) {
            $rangeDetails = $capacityService->getCapacityRangeDetails($mold->id, $startDate, $endDate);
            
            $hasConflicts = false;
            $conflictDates = [];
            foreach ($rangeDetails as $date => $det) {
                if ($det['remaining'] <= 0.0) {
                    $hasConflicts = true;
                    $conflictDates[] = $date;
                }
            }
            
            return [
                'id'                    => $mold->id,
                'kode'                  => $mold->kode,
                'nama'                  => $mold->nama,
                'produk'                => $mold->produk,
                'product_id'            => $mold->product_id,
                'kapasitas_per_siklus'  => $mold->kapasitas_per_siklus ?: 1,
                'jumlah'                => $mold->jumlah_total,
                'kondisi'               => $mold->kondisi,
                'has_conflicts'         => $hasConflicts,
                'conflict_dates'        => $conflictDates,
            ];
        });
    }

    /**
     * Calculate required batches for preview (backward compatibility)
     */
    public function calculateBatchPreview(float $demandQty, int $moldCapacity): array
    {
        $requiredBatches = (int) ceil($demandQty / $moldCapacity);
        $batches = [];
        $remainingQty = $demandQty;

        for ($i = 1; $i <= $requiredBatches; $i++) {
            $batchQty = min($remainingQty, $moldCapacity);
            $remainingQty -= $batchQty;
            
            $batches[] = [
                'sequence' => $i,
                'qty'      => $batchQty,
            ];
        }

        return [
            'required_batches' => $requiredBatches,
            'batches'          => $batches,
        ];
    }
}
