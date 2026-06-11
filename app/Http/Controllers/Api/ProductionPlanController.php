<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductionPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductionPlan::with(['product', 'workCenter'])
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
            $productionPlan->load(['product', 'workCenter', 'batches.product'])
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
            'status'            => ['nullable', Rule::in(['Draft', 'Approved', 'Released', 'Closed'])],
            'notes'             => 'nullable|string',
        ]);

        $productionPlan->update($validated);
        return response()->json($productionPlan->fresh(['product', 'workCenter']));
    }

    public function destroy(ProductionPlan $productionPlan): JsonResponse
    {
        if (!in_array($productionPlan->status, ['Draft'])) {
            return response()->json(['message' => 'Only Draft plans can be deleted'], 422);
        }
        $productionPlan->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
