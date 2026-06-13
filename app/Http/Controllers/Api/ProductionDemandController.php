<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionDemand;
use App\Services\ProductionPlanningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductionDemandController extends Controller
{
    protected ProductionPlanningService $planningService;

    public function __construct(ProductionPlanningService $planningService)
    {
        $this->planningService = $planningService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = ProductionDemand::with(['product.activeBom', 'product.allowedMolds', 'salesOrder.customer'])
            ->whereNull('deleted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('source_type')) {
            $query->where('source_type', $request->source_type);
        }

        return response()->json(
            $query->orderBy('priority')->orderBy('required_date')
                  ->paginate($request->get('per_page', 20))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'demand_number'       => 'required|string|max:30|unique:production_demands,demand_number',
            'source_type'         => ['required', Rule::in(['Sales Order', 'MTS'])],
            'sales_order_id'      => 'nullable|exists:production_sales_orders,id',
            'sales_order_item_id' => 'nullable|exists:production_sales_order_items,id',
            'product_id'          => 'required|exists:production_products,id',
            'demand_qty'          => 'required|numeric|min:0.01',
            'required_date'       => 'required|date',
            'priority'            => 'nullable|integer|min:1|max:10',
            'notes'               => 'nullable|string',
        ]);

        $demand = ProductionDemand::create($validated + ['status' => 'Open']);
        return response()->json($demand->load(['product', 'salesOrder']), 201);
    }

    public function show(ProductionDemand $productionDemand): JsonResponse
    {
        return response()->json($productionDemand->load(['product', 'salesOrder.customer', 'salesOrderItem']));
    }

    public function update(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'demand_qty'    => 'sometimes|numeric|min:0.01',
            'required_date' => 'sometimes|date',
            'priority'      => 'nullable|integer|min:1|max:10',
            'status'        => ['nullable', Rule::in(['Open', 'Approved', 'Planned', 'Cancelled', 'Closed'])],
            'notes'         => 'nullable|string',
        ]);

        $productionDemand->update($validated);
        return response()->json($productionDemand->fresh(['product', 'salesOrder']));
    }

    public function destroy(ProductionDemand $productionDemand): JsonResponse
    {
        if (in_array($productionDemand->status, ['Planned', 'Closed'])) {
            return response()->json(['message' => 'Cannot delete a planned or closed demand'], 422);
        }
        $productionDemand->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * SIMPLIFIED: Schedule Production Directly
     * Open/Approved -> Planned + auto-generates batches based on mold capacity
     */
    public function schedule(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'notes'      => 'nullable|string',
        ]);

        try {
            $plan = $this->planningService->scheduleProduction($productionDemand, $validated);
            return response()->json([
                'message' => 'Production scheduled successfully. Batches auto-generated based on mold capacity.',
                'plan'    => $plan->load(['product', 'mold', 'batches', 'salesOrder.customer']),
                'demand'  => $productionDemand->fresh(['product', 'salesOrder.customer'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }
    }

    /**
     * Get available molds for scheduling
     */
    public function availableMolds(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $molds = $this->planningService->getAvailableMolds(
            $productionDemand->product_id,
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json(['molds' => $molds]);
    }

    /**
     * Preview batch calculation
     */
    public function previewBatches(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
        ]);

        try {
            $preview = $this->planningService->previewSchedule($productionDemand, $validated['start_date']);
            return response()->json($preview);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }
    }

    /**
     * Approve Demand (PPIC Confirm Ready)
     */
    public function approve(ProductionDemand $productionDemand): JsonResponse
    {
        $productionDemand->update(['status' => 'Approved']);
        \App\Models\AuditLog::log('production_demand.approved', 'production_demand', $productionDemand->id, null, $productionDemand->toArray());
        return response()->json($productionDemand);
    }

    /**
     * Reject Demand
     */
    public function reject(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        $productionDemand->update([
            'status' => 'Cancelled',
            'notes'  => $validated['reason'] ?? 'Rejected by PPIC',
        ]);

        \App\Models\AuditLog::log('production_demand.rejected', 'production_demand', $productionDemand->id, null, $productionDemand->toArray());
        return response()->json($productionDemand);
    }
}
