<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ProductionPlan;
use App\Services\ProductionPlanningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProductionPlanController extends Controller
{
    protected ProductionPlanningService $planningService;

    public function __construct(ProductionPlanningService $planningService)
    {
        $this->planningService = $planningService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = ProductionPlan::with(['product', 'workCenter', 'mold', 'demand'])
            ->whereNull('deleted_at');

        if ($request->filled('plan_level')) {
            $query->where('plan_level', $request->plan_level);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('period_start')) {
            $query->where('period_start', '>=', $request->period_start);
        }
        if ($request->filled('period_end')) {
            $query->where('period_end', '<=', $request->period_end);
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        return response()->json(
            $query->orderBy('period_start')->orderBy('plan_level')
                  ->paginate($request->get('per_page', 20))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_number'       => 'required|string|max:30|unique:production_plans,plan_number',
            'plan_level'        => ['required', Rule::in(['MPS', 'Weekly', 'Daily'])],
            'period_start'      => 'required|date',
            'period_end'        => 'required|date|after_or_equal:period_start',
            'product_id'        => 'required|exists:production_products,id',
            'planned_qty'       => 'required|numeric|min:0.01',
            'planned_volume_m3' => 'nullable|numeric|min:0',
            'work_center_id'    => 'nullable|exists:production_work_centers,id',
            'material_status'   => ['nullable', Rule::in(['Ready', 'Partial', 'Not Ready'])],
            'capacity_status'   => ['nullable', Rule::in(['Available', 'Overload'])],
            'notes'             => 'nullable|string',
        ]);

        $plan = ProductionPlan::create($validated + ['status' => 'Draft']);
        return response()->json($plan->load(['product', 'workCenter']), 201);
    }

    public function show(ProductionPlan $productionPlan): JsonResponse
    {
        return response()->json(
            $productionPlan->load(['product', 'workCenter', 'mold', 'demand', 'batches.product'])
        );
    }

    public function update(Request $request, ProductionPlan $productionPlan): JsonResponse
    {
        $validated = $request->validate([
            'planned_qty'       => 'sometimes|numeric|min:0.01',
            'planned_volume_m3' => 'nullable|numeric|min:0',
            'work_center_id'    => 'nullable|exists:production_work_centers,id',
            'material_status'   => ['nullable', Rule::in(['Ready', 'Partial', 'Not Ready'])],
            'capacity_status'   => ['nullable', Rule::in(['Available', 'Overload'])],
            'status'            => ['nullable', Rule::in(['Draft', 'Scheduled', 'Closed'])],
            'notes'             => 'nullable|string',
        ]);

        $productionPlan->update($validated);
        return response()->json($productionPlan->fresh(['product', 'workCenter', 'mold', 'demand']));
    }

    public function destroy(ProductionPlan $productionPlan): JsonResponse
    {
        if (!in_array($productionPlan->status, ['Draft', 'Scheduled'])) {
            return response()->json(['message' => 'Only Draft or Scheduled plans can be deleted'], 422);
        }

        DB::transaction(function () use ($productionPlan) {
            // Restore demand to Approved status so it can be re-scheduled
            if ($productionPlan->demand) {
                $productionPlan->demand->update(['status' => 'Approved']);
                AuditLog::log('production_demand.reopened', 'production_demand', $productionPlan->demand->id,
                    ['status' => 'Planned'], ['status' => 'Approved']);
            }
            // Delete associated batches that haven't started yet
            $planningStatus = DB::table('global.production_batch_statuses')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
                })
                ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
            $planningStatusId = $planningStatus ? $planningStatus->id : null;

            $productionPlan->batches()->where('batch_status_id', $planningStatusId)->delete();
            $productionPlan->delete();
        });

        return response()->json(['message' => 'Plan deleted successfully and demand returned to queue.']);
    }

    /**
     * Get Gantt calendar data
     */
    public function calendarData(Request $request): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');
        
        $data = $this->planningService->getCalendarData($from, $to);
        
        return response()->json($data);
    }

    /**
     * Get Planning Dashboard stats
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $stats = $this->planningService->getPlanningDashboardStats();
        return response()->json($stats);
    }

    /**
     * Get material readiness preview for a specific product and quantity.
     */
    public function materialReadiness(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:production_products,id',
            'qty'        => 'required|numeric|min:0.01',
        ]);

        $reqService = new \App\Services\MaterialRequirementService();
        $requirements = $reqService->calculateRequirements($validated['product_id'], (float) $validated['qty']);

        $hasShortage = $requirements->contains(function ($r) {
            return $r['shortage_qty'] > 0;
        });

        $formattedMaterials = $requirements->map(function ($r) {
            return [
                'material'      => $r['material_nama'],
                'required_qty'  => (float) $r['required_qty'],
                'available_qty' => (float) $r['available_qty'],
                'shortage_qty'  => (float) $r['shortage_qty'],
                'satuan'        => $r['satuan'],
                'status'        => $r['shortage_qty'] > 0 ? 'SHORTAGE' : 'READY',
            ];
        })->toArray();

        return response()->json([
            'materials'    => $formattedMaterials,
            'has_shortage' => $hasShortage,
        ]);
    }

    /**
     * Get aggregated MPS Summary dashboard and grouping details.
     */
    public function mpsSummary(Request $request): JsonResponse
    {
        $planLevel = $request->query('plan_level');
        if ($planLevel === 'All' || empty($planLevel)) {
            $planLevel = null;
        }

        // 1. Get finished/delivered status IDs
        $finishedStatusIds = DB::table('global.production_batch_statuses')
            ->whereIn('status', ['Finished', 'Delivered'])
            ->pluck('id');

        // 2. Query Monthly Planned Volume
        $plannedQuery = DB::table('public.production_plans')
            ->whereNull('deleted_at');
        if ($planLevel) {
            $plannedQuery->where('plan_level', $planLevel);
        }
        $plannedByMonth = $plannedQuery
            ->selectRaw("DATE_TRUNC('month', period_start) as month_date, SUM(planned_volume_m3) as planned_volume")
            ->groupBy(DB::raw("DATE_TRUNC('month', period_start)"))
            ->get()
            ->pluck('planned_volume', 'month_date')
            ->toArray();

        // 3. Query Monthly Produced Volume
        $producedQuery = DB::table('public.production_batches as pb')
            ->join('global.production_products as pp', 'pb.product_id', '=', 'pp.id')
            ->whereIn('pb.batch_status_id', $finishedStatusIds)
            ->whereNull('pb.deleted_at');
        if ($planLevel) {
            $producedQuery->join('public.production_plans as pl', 'pb.production_plan_id', '=', 'pl.id')
                ->where('pl.plan_level', $planLevel);
        }
        $producedByMonth = $producedQuery
            ->selectRaw("DATE_TRUNC('month', pb.actual_end) as month_date, SUM(COALESCE(pp.volume_m3, 0) * COALESCE(pb.actual_qty, 0)) as produced_volume")
            ->groupBy(DB::raw("DATE_TRUNC('month', pb.actual_end)"))
            ->get()
            ->pluck('produced_volume', 'month_date')
            ->toArray();

        // 4. Combine month keys and format (normalized to Y-m-d)
        $plannedByMonthNormalized = [];
        foreach ($plannedByMonth as $key => $val) {
            if (!$key) continue;
            $normKey = (new \DateTime($key))->format('Y-m-d');
            $plannedByMonthNormalized[$normKey] = (float) $val;
        }

        $producedByMonthNormalized = [];
        foreach ($producedByMonth as $key => $val) {
            if (!$key) continue;
            $normKey = (new \DateTime($key))->format('Y-m-d');
            $producedByMonthNormalized[$normKey] = (float) $val;
        }

        $months = array_unique(array_merge(array_keys($plannedByMonthNormalized), array_keys($producedByMonthNormalized)));
        usort($months, function ($a, $b) {
            return strcmp($a, $b);
        });

        $summaryTable = [];
        foreach ($months as $monthKey) {
            $date = new \DateTime($monthKey);
            $monthYear = $date->format('F Y');
            $planned = $plannedByMonthNormalized[$monthKey] ?? 0.0;
            $produced = $producedByMonthNormalized[$monthKey] ?? 0.0;
            $achievement = $planned > 0 ? round(($produced / $planned) * 100, 1) : 0.0;

            $summaryTable[] = [
                'month_year'      => $monthYear,
                'planned_volume'  => $planned,
                'produced_volume' => $produced,
                'achievement_pct' => $achievement,
            ];
        }

        // 5. Calculate monthly planned/produced volume for the current month
        $monthlyPlannedVolume = 0.0;
        $monthlyProducedVolume = 0.0;
        foreach ($months as $monthKey) {
            $date = new \DateTime($monthKey);
            if ($date->format('Y-m') === now()->format('Y-m')) {
                $monthlyPlannedVolume = $plannedByMonthNormalized[$monthKey] ?? 0.0;
                $monthlyProducedVolume = $producedByMonthNormalized[$monthKey] ?? 0.0;
            }
        }

        $achievementPct = $monthlyPlannedVolume > 0 ? round(($monthlyProducedVolume / $monthlyPlannedVolume) * 100, 1) : 0.0;

        // 6. Get Open Demand count
        $openDemandCount = DB::table('public.production_demands')
            ->whereIn('status', ['Open', 'Approved'])
            ->whereNull('deleted_at')
            ->count();

        return response()->json([
            'kpis' => [
                'monthly_planned_volume'  => $monthlyPlannedVolume,
                'monthly_produced_volume' => $monthlyProducedVolume,
                'achievement_pct'         => $achievementPct,
                'open_demand_count'       => $openDemandCount,
            ],
            'summary_table' => $summaryTable,
        ]);
    }
}
