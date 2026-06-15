<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use App\Models\AuditLog;
use App\Services\BatchTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProductionBatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $relations = ['product', 'mold', 'statusModel', 'salesOrder', 'qcInspections'];
        if (!$request->boolean('upcoming')) {
            $relations = array_merge($relations, ['workCenter', 'plan', 'cost']);
        }

        $query = ProductionBatch::with($relations)
            ->whereNull('deleted_at');

        if ($request->boolean('upcoming')) {
            $finishedStatusIds = DB::table('global.production_batch_statuses')
                ->whereIn('status', ['Finished', 'Delivered'])
                ->pluck('id');
            $query->whereNotIn('batch_status_id', $finishedStatusIds);
        }

        if ($request->boolean('qc_eligible')) {
            $ineligibleStatusIds = DB::table('global.production_batch_statuses')
                ->whereIn('status', ['Planning', 'Ready Material', 'Delivered'])
                ->pluck('id');
            $query->whereNotIn('batch_status_id', $ineligibleStatusIds);
        }

        if ($request->filled('status_id')) {
            $query->where('batch_status_id', $request->status_id);
        } elseif ($request->filled('status')) {
            // Fallback for older frontend components using string query
            $statusId = DB::table('global.production_batch_statuses')
                ->where('status', 'like', "%{$request->status}%")
                ->value('id');
            if ($statusId) {
                $query->where('batch_status_id', $statusId);
            } else {
                $query->where('batch_status_id', 0); // Force empty result
            }
        }
        
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('work_center_id')) {
            $query->where('work_center_id', $request->work_center_id);
        }
        if ($request->filled('date_from')) {
            $query->where('planned_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('planned_date', '<=', $request->date_to);
        }

        // Support fetching all records for Kanban board
        if ($request->boolean('raw')) {
            return response()->json($query->orderBy('planned_start')->get());
        }

        return response()->json(
            $query->orderBy('planned_start')->paginate($request->get('per_page', 100))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batch_number'       => 'required|string|max:50|unique:production_batches,batch_number',
            'production_plan_id' => 'nullable|exists:production_plans,id',
            'demand_id'          => 'nullable|exists:production_demands,id',
            'source_type'        => ['required', Rule::in(['SO', 'MTS'])],
            'product_id'         => 'required|exists:production_products,id',
            'routing_version'    => 'nullable|string|max:30',
            'target_qty'         => 'required|numeric|min:0.01',
            'target_volume_m3'   => 'nullable|numeric|min:0',
            'planned_start'      => 'nullable|date',
            'planned_end'        => 'nullable|date|after_or_equal:planned_start',
            'work_center_id'     => 'nullable|exists:production_work_centers,id',
            'notes'              => 'nullable|string',
            'mold_id'            => 'nullable|exists:production_molds,id',
            'batch_sequence'     => 'nullable|integer',
            'sales_order_id'     => 'nullable|exists:production_sales_orders,id',
            'planned_date'       => 'nullable|date',
            // Cost estimates
            'estimated_material_cost'  => 'nullable|numeric|min:0',
            'estimated_labor_cost'     => 'nullable|numeric|min:0',
            'estimated_overhead_cost'  => 'nullable|numeric|min:0',
        ]);

        $batch = DB::transaction(function () use ($validated) {
            $planningStatus = DB::table('global.production_batch_statuses')
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
                })
                ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
            $batchStatusId = $planningStatus ? $planningStatus->id : 1;

            $batch = ProductionBatch::create([
                'batch_number'       => $validated['batch_number'],
                'production_plan_id' => $validated['production_plan_id'] ?? null,
                'demand_id'          => $validated['demand_id'] ?? null,
                'source_type'        => $validated['source_type'],
                'product_id'         => $validated['product_id'],
                'routing_version'    => $validated['routing_version'] ?? null,
                'target_qty'         => $validated['target_qty'],
                'target_volume_m3'   => $validated['target_volume_m3'] ?? null,
                'planned_start'      => $validated['planned_start'] ?? null,
                'planned_end'        => $validated['planned_end'] ?? null,
                'work_center_id'     => $validated['work_center_id'] ?? null,
                'mold_id'            => $validated['mold_id'] ?? null,
                'batch_sequence'     => $validated['batch_sequence'] ?? null,
                'sales_order_id'     => $validated['sales_order_id'] ?? null,
                'planned_date'       => $validated['planned_date'] ?? ($validated['planned_start'] ? date('Y-m-d', strtotime($validated['planned_start'])) : null),
                'notes'              => $validated['notes'] ?? null,
                'batch_status_id'    => $batchStatusId,
            ]);

            ProductionCost::create([
                'production_batch_id'       => $batch->id,
                'estimated_material_cost'   => $validated['estimated_material_cost'] ?? 0,
                'estimated_labor_cost'      => $validated['estimated_labor_cost'] ?? 0,
                'estimated_overhead_cost'   => $validated['estimated_overhead_cost'] ?? 0,
            ]);

            return $batch;
        });

        return response()->json($batch->load(['product', 'workCenter', 'cost', 'mold', 'statusModel']), 201);
    }

    public function show(ProductionBatch $batch): JsonResponse
    {
        return response()->json(
            $batch->load([
                'product', 'workCenter', 'plan', 'demand.salesOrder', 'cost', 'mold', 'statusModel',
                'statusLogs.fromStatus', 'statusLogs.toStatus', 'statusLogs.user', 'qcInspections'
            ])
        );
    }

    public function update(Request $request, ProductionBatch $batch): JsonResponse
    {
        $finishedOrDeliveredIds = DB::table('global.production_batch_statuses')
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%finished%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%selesai%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%delivered%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%kirim%']);
            })
            ->pluck('id')
            ->toArray();

        if (in_array($batch->batch_status_id, $finishedOrDeliveredIds)) {
            return response()->json(['message' => 'Cannot edit finished or delivered batch'], 422);
        }

        $validated = $request->validate([
            'target_qty'       => 'sometimes|numeric|min:0.01',
            'actual_qty'       => 'nullable|numeric|min:0',
            'target_volume_m3' => 'nullable|numeric|min:0',
            'planned_start'    => 'nullable|date',
            'planned_end'      => 'nullable|date',
            'planned_date'     => 'nullable|date',
            'work_center_id'   => 'nullable|exists:production_work_centers,id',
            'notes'            => 'nullable|string',
            'mold_id'          => 'nullable|exists:production_molds,id',
            'batch_sequence'   => 'nullable|integer',
            // Cost updates
            'actual_material_cost'  => 'nullable|numeric|min:0',
            'actual_labor_cost'     => 'nullable|numeric|min:0',
            'actual_overhead_cost'  => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($batch, $validated) {
            $batchData = array_filter($validated, fn ($k) => !str_starts_with($k, 'actual_'), ARRAY_FILTER_USE_KEY);
            $batch->update($batchData);

            $costData = array_filter($validated, fn ($k) => str_starts_with($k, 'actual_'), ARRAY_FILTER_USE_KEY);
            if (!empty($costData) && $batch->cost) {
                $estimatedTotal = $batch->cost->estimated_material_cost
                    + $batch->cost->estimated_labor_cost
                    + $batch->cost->estimated_overhead_cost;

                $actualTotal = ($costData['actual_material_cost'] ?? $batch->cost->actual_material_cost)
                    + ($costData['actual_labor_cost'] ?? $batch->cost->actual_labor_cost)
                    + ($costData['actual_overhead_cost'] ?? $batch->cost->actual_overhead_cost);

                $variance = $actualTotal - $estimatedTotal;
                $variancePct = $estimatedTotal > 0 ? ($variance / $estimatedTotal) * 100 : 0;

                $batch->cost->update(array_merge($costData, [
                    'variance_amount'  => $variance,
                    'variance_percent' => $variancePct,
                ]));
            }
        });

        return response()->json($batch->fresh(['product', 'workCenter', 'cost', 'mold', 'statusModel']));
    }

    public function destroy(ProductionBatch $batch): JsonResponse
    {
        $planningStatus = DB::table('global.production_batch_statuses')
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%planning%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%rencana%']);
            })
            ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan')->first();
        $planningStatusId = $planningStatus ? $planningStatus->id : null;

        if ($batch->batch_status_id !== $planningStatusId) {
            return response()->json(['message' => 'Only Planning batches can be deleted'], 422);
        }
        $batch->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    // New Transition Endpoint
    public function transition(Request $request, ProductionBatch $batch, BatchTransitionService $transitionService): JsonResponse
    {
        $validated = $request->validate([
            'to_status_id' => 'required|exists:production_batch_statuses,id',
            'notes'        => 'nullable|string',
        ]);

        try {
            $transitioned = $transitionService->transition($batch, $validated['to_status_id'], $validated['notes'] ?? null);
            return response()->json([
                'message' => 'Batch transitioned successfully',
                'batch'   => $transitioned->load(['product', 'workCenter', 'plan', 'demand.salesOrder', 'cost', 'mold', 'statusModel']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Transition failed',
                'errors'  => $e->errors()
            ], 422);
        }
    }

    // Backwards Compatibility method (start)
    public function start(ProductionBatch $batch, BatchTransitionService $transitionService): JsonResponse
    {
        // Find the target casting status dynamically
        $castingStatus = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%casting%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%cetak%']);
            })
            ->first();

        if (!$castingStatus) {
            return response()->json(['message' => 'Casting status not configured or inactive'], 422);
        }

        try {
            // Move the batch to Casting.
            // If there are intermediate active statuses, we transition through them in sequence.
            while ($batch->batch_status_id !== $castingStatus->id) {
                $activeStatuses = DB::table('global.production_batch_statuses')
                    ->where('aktif', true)
                    ->orderBy('urutan', 'asc')
                    ->get();

                $currentStatus = $batch->statusModel;
                
                $nextStatus = null;
                foreach ($activeStatuses as $s) {
                    if ($s->urutan > $currentStatus->urutan) {
                        $nextStatus = $s;
                        break;
                    }
                }

                if (!$nextStatus || $nextStatus->urutan > $castingStatus->urutan) {
                    break;
                }

                $transitionService->transition($batch, $nextStatus->id, 'Auto-transitioned via start action');
                $batch->refresh();
            }

            // Write audit log if started successfully
            $statusNameLower = strtolower(trim($batch->statusModel?->status ?? ''));
            if (strpos($statusNameLower, 'casting') !== false || strpos($statusNameLower, 'cetak') !== false) {
                AuditLog::log(
                    'production_batch.started',
                    'production_batch',
                    $batch->id,
                    [],
                    ['status' => $batch->status]
                );
            }

            return response()->json(['message' => 'Batch started', 'status' => $batch->status]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    // Backwards Compatibility method (complete)
    public function complete(Request $request, ProductionBatch $batch, BatchTransitionService $transitionService): JsonResponse
    {
        $validated = $request->validate([
            'actual_qty' => 'required|numeric|min:0',
        ]);

        $batch->update(['actual_qty' => $validated['actual_qty']]);

        // Find the next active status after the current status
        $activeStatuses = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->orderBy('urutan', 'asc')
            ->get();

        $currentStatus = $batch->statusModel;
        $nextStatus = null;
        foreach ($activeStatuses as $s) {
            if ($s->urutan > $currentStatus->urutan) {
                $nextStatus = $s;
                break;
            }
        }

        if ($nextStatus) {
            try {
                $transitionService->transition($batch, $nextStatus->id, 'Casting completed, moved to ' . $nextStatus->status);
                return response()->json([
                    'message' => 'Batch casting completed, moved to ' . $nextStatus->status,
                    'status' => $nextStatus->status
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        return response()->json(['message' => 'No active next status configured after ' . $currentStatus->status], 422);
    }

    public function cost($id): JsonResponse
    {
        $batch = ProductionBatch::findOrFail($id);
        $cost = $batch->cost;
        
        if (!$cost) {
            return response()->json([
                'batch_number'  => $batch->batch_number,
                'material_cost' => 0.00,
                'labor_cost'    => 0.00,
                'overhead_cost' => 0.00,
                'total_cost'    => 0.00,
                'cost_per_unit' => 0.00,
                'cost_per_m3'   => 0.00,
            ]);
        }

        return response()->json([
            'batch_number'  => $batch->batch_number,
            'material_cost' => (float) $cost->material_cost,
            'labor_cost'    => (float) $cost->labor_cost,
            'overhead_cost' => (float) $cost->overhead_cost,
            'total_cost'    => (float) $cost->total_cost,
            'cost_per_unit' => (float) $cost->cost_per_unit,
            'cost_per_m3'   => (float) $cost->cost_per_m3,
        ]);
    }

    public function costDashboard(): JsonResponse
    {
        $today = date('Y-m-d');
        $startOfMonth = date('Y-m-01');
        $endOfMonth = date('Y-m-t');

        $todayCost = DB::table('public.production_costs as pc')
            ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
            ->whereDate('pb.planned_date', $today)
            ->whereNull('pb.deleted_at')
            ->sum('pc.total_cost');

        $monthlyCost = DB::table('public.production_costs as pc')
            ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
            ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
            ->whereNull('pb.deleted_at')
            ->sum('pc.total_cost');

        $avgCostPerM3 = DB::table('public.production_costs as pc')
            ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
            ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
            ->whereNull('pb.deleted_at')
            ->selectRaw('SUM(pc.total_cost) / NULLIF(SUM(pb.target_volume_m3), 0) as avg_cost')
            ->value('avg_cost') ?: 0.0;

        $topProducts = DB::table('public.production_costs as pc')
            ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
            ->join('global.production_products as p', 'pb.product_id', '=', 'p.id')
            ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
            ->whereNull('pb.deleted_at')
            ->select('p.nama as product_name', DB::raw('SUM(pc.total_cost) as total_cost'))
            ->groupBy('p.id', 'p.nama')
            ->orderByDesc('total_cost')
            ->limit(5)
            ->get();

        return response()->json([
            'today_production_cost'   => (float) $todayCost,
            'monthly_production_cost' => (float) $monthlyCost,
            'average_cost_per_m3'     => (float) $avgCostPerM3,
            'top_cost_products'       => $topProducts,
        ]);
    }
}
