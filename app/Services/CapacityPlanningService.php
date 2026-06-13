<?php

namespace App\Services;

use App\Models\Mold;
use App\Models\ProductionBatch;
use Carbon\Carbon;

class CapacityPlanningService
{
    /**
     * Get daily capacity of a mold
     * Daily Capacity = kapasitas_per_siklus * siklus_per_hari * jumlah_aktif
     */
    public function getDailyCapacity(Mold $mold): int
    {
        $kapasitas = $mold->kapasitas_per_siklus ?: 1;
        $siklus = $mold->siklus_per_hari ?: 1;
        $aktif = $mold->jumlah_aktif ?: 0;

        return $kapasitas * $siklus * $aktif;
    }

    /**
     * Get reserved capacity of a mold on a specific date
     */
    public function getReservedCapacity(int $moldId, string $date): float
    {
        return (float) ProductionBatch::where('mold_id', $moldId)
            ->whereDate('planned_date', $date)
            ->sum('target_qty');
    }

    /**
     * Get remaining capacity of a mold on a specific date
     */
    public function getRemainingCapacity(int $moldId, string $date): float
    {
        $mold = Mold::findOrFail($moldId);
        $totalCapacity = $this->getDailyCapacity($mold);
        $reservedCapacity = $this->getReservedCapacity($moldId, $date);

        return max(0.0, (float) $totalCapacity - $reservedCapacity);
    }

    /**
     * Get capacity details for a date range
     */
    public function getCapacityRangeDetails(int $moldId, string $startDate, string $endDate): array
    {
        $mold = Mold::findOrFail($moldId);
        $dailyCapacity = $this->getDailyCapacity($mold);

        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $totalDays = $start->diffInDays($end) + 1;

        $details = [];

        // Fetch all batch sums in the date range grouped by date to optimize DB queries
        $batchSums = ProductionBatch::where('mold_id', $moldId)
            ->whereBetween('planned_date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('planned_date, SUM(target_qty) as total_reserved')
            ->groupBy('planned_date')
            ->pluck('total_reserved', 'planned_date')
            ->toArray();

        for ($i = 0; $i < $totalDays; $i++) {
            $currentDate = $start->copy()->addDays($i)->toDateString();
            
            // Normalize key lookup format
            $lookupKey = null;
            foreach (array_keys($batchSums) as $k) {
                if (Carbon::parse($k)->toDateString() === $currentDate) {
                    $lookupKey = $k;
                    break;
                }
            }

            $reserved = $lookupKey ? (float) $batchSums[$lookupKey] : 0.0;
            $remaining = max(0.0, (float) $dailyCapacity - $reserved);

            $details[$currentDate] = [
                'total'     => $dailyCapacity,
                'reserved'  => $reserved,
                'remaining' => $remaining,
            ];
        }

        return $details;
    }
}
