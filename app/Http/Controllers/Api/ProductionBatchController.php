<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class ProductionBatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductionBatch::with(['product', 'workCenter', 'plan', 'cost'])
            ->whereNull('deleted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('work_center_id')) {
            $query->where('work_center_id', $request->work_center_id);
        }
        if ($request->filled('date_from')) {
            $query->where('planned_start', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('planned_end', '<=', $request->date_to);
        }

        return response()->json(
            $query->orderBy('planned_start')->paginate($request->get('per_page', 20))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batch_number'       => 'required|string|max:50|unique:public.production_batches,batch_number',
            'production_plan_id' => 'nullable|exists:public.production_plans,id',
            'demand_id'          => 'nullable|exists:public.production_demands,id',
            'source_type'        => ['required', Rule::in(['SO', 'MTS'])],
            'product_id'         => 'required|exists:global.production_products,id',
            'routing_version'    => 'nullable|string|max:30',
            'target_qty'         => 'required|numeric|min:0.01',
            'target_volume_m3'   => 'nullable|numeric|min:0',
            'planned_start'      => 'nullable|date',
            'planned_end'        => 'nullable|date|after_or_equal:planned_start',
            'work_center_id'     => 'nullable|exists:global.production_work_centers,id',
            'notes'              => 'nullable|string',
            // Optional cost estimates on creation
            'estimated_material_cost'  => 'nullable|numeric|min:0',
            'estimated_labor_cost'     => 'nullable|numeric|min:0',
            'estimated_overhead_cost'  => 'nullable|numeric|min:0',
        ]);

        $batch = DB::transaction(function () use ($validated) {
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
                'notes'              => $validated['notes'] ?? null,
                'status'             => 'Planned',
            ]);

            // Create cost record
            ProductionCost::create([
                'production_batch_id'       => $batch->id,
                'estimated_material_cost'   => $validated['estimated_material_cost'] ?? 0,
                'estimated_labor_cost'      => $validated['estimated_labor_cost'] ?? 0,
                'estimated_overhead_cost'   => $validated['estimated_overhead_cost'] ?? 0,
            ]);

            return $batch;
        });

        return response()->json($batch->load(['product', 'workCenter', 'cost']), 201);
    }

    public function show(ProductionBatch $batch): JsonResponse
    {
        return response()->json(
            $batch->load(['product', 'workCenter', 'plan', 'demand.salesOrder', 'cost'])
        );
    }

    public function update(Request $request, ProductionBatch $batch): JsonResponse
    {
        if (in_array($batch->status, ['Completed', 'Closed'])) {
            return response()->json(['message' => 'Cannot edit completed batch'], 422);
        }

        $validated = $request->validate([
            'target_qty'       => 'sometimes|numeric|min:0.01',
            'target_volume_m3' => 'nullable|numeric|min:0',
            'planned_start'    => 'nullable|date',
            'planned_end'      => 'nullable|date',
            'work_center_id'   => 'nullable|exists:global.production_work_centers,id',
            'notes'            => 'nullable|string',
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

        return response()->json($batch->fresh(['product', 'workCenter', 'cost']));
    }

    public function destroy(ProductionBatch $batch): JsonResponse
    {
        if (!in_array($batch->status, ['Planned'])) {
            return response()->json(['message' => 'Only Planned batches can be deleted'], 422);
        }
        $batch->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function release(ProductionBatch $batch): JsonResponse
    {
        if ($batch->status !== 'Planned') {
            return response()->json(['message' => 'Only Planned batches can be released'], 422);
        }
        $batch->update(['status' => 'Released']);
        return response()->json(['message' => 'Batch released', 'status' => 'Released']);
    }

    public function start(ProductionBatch $batch): JsonResponse
    {
        if ($batch->status !== 'Released') {
            return response()->json(['message' => 'Only Released batches can be started'], 422);
        }
        $batch->update(['status' => 'In Progress', 'actual_start' => now()]);
        return response()->json(['message' => 'Batch started', 'status' => 'In Progress']);
    }

    public function complete(Request $request, ProductionBatch $batch): JsonResponse
    {
        if ($batch->status !== 'In Progress') {
            return response()->json(['message' => 'Only In Progress batches can be completed'], 422);
        }

        $validated = $request->validate([
            'actual_qty' => 'required|numeric|min:0',
        ]);

        $batch->update([
            'status'     => 'QC Pending',
            'actual_qty' => $validated['actual_qty'],
            'actual_end' => now(),
        ]);

        return response()->json(['message' => 'Batch completed, awaiting QC', 'status' => 'QC Pending']);
    }
}
