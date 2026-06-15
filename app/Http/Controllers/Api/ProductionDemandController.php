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
        $with = ['product.activeBom', 'product.allowedMolds', 'salesOrder.customer'];

        // When fetching Planned demands, also eager load productionPlan so frontend
        // can detect orphan demands (Planned but no active plan).
        if ($request->input('status') === 'Planned') {
            $with[] = 'productionPlan';
        }

        $query = ProductionDemand::with($with)->whereNull('deleted_at');

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
     * Get all demands that should appear in the Production Planning queue:
     * - Status 'Open' or 'Approved'
     * - Status 'Planned' but whose production plan has been deleted (orphan)
     */
    public function queue(Request $request): JsonResponse
    {
        // Open / Approved demands
        $openOrApproved = ProductionDemand::with(['product.activeBom', 'product.allowedMolds', 'salesOrder.customer'])
            ->whereNull('deleted_at')
            ->whereIn('status', ['Open', 'Approved'])
            ->orderBy('priority')
            ->orderBy('required_date')
            ->get();

        // Planned demands that have no active (non-soft-deleted) production plan
        $plannedOrphans = ProductionDemand::with(['product.activeBom', 'product.allowedMolds', 'salesOrder.customer'])
            ->whereNull('deleted_at')
            ->where('status', 'Planned')
            ->whereNotExists(function ($sub) {
                $sub->select(\DB::raw(1))
                    ->from('public.production_plans')
                    ->whereColumn('public.production_plans.demand_id', 'public.production_demands.id')
                    ->whereNull('public.production_plans.deleted_at');
            })
            ->orderBy('priority')
            ->orderBy('required_date')
            ->get()
            ->each(fn ($d) => $d->setAttribute('is_orphan', true));

        $all = $openOrApproved->concat($plannedOrphans)->sortBy('priority')->values();

        return response()->json(['data' => $all]);
    }

    /**
     * SIMPLIFIED: Schedule Production Directly
     * Open/Approved -> Planned + auto-generates batches based on mold capacity
     */
    public function schedule(Request $request, ProductionDemand $productionDemand): JsonResponse
    {
        $validated = $request->validate([
            'start_date'              => 'required|date',
            'mold_id'                 => 'nullable|integer',
            'notes'                   => 'nullable|string',
            'planning_mode'           => ['nullable', Rule::in(['auto', 'manual'])],
            'manual_batches'          => 'required_if:planning_mode,manual|array|min:1',
            'manual_batches.*.date'     => 'required_with:manual_batches|date',
            'manual_batches.*.end_date' => 'nullable|date|after_or_equal:manual_batches.*.date',
            'manual_batches.*.qty'      => 'required_with:manual_batches|numeric|min:0.01',
            'manual_batches.*.sequence' => 'nullable|integer|min:1',
        ]);

        $validated['planning_mode'] = $validated['planning_mode'] ?? 'auto';

        try {
            $plan = $this->planningService->scheduleProduction($productionDemand, $validated);
            
            // Check material shortage
            $reqService = new \App\Services\MaterialRequirementService();
            $requirements = $reqService->calculateRequirements($productionDemand->product_id, (float) $productionDemand->demand_qty);
            $hasShortage = $requirements->contains(function ($r) {
                return $r['shortage_qty'] > 0;
            });
            $warning = $hasShortage ? "Material tidak mencukupi untuk memenuhi demand." : null;

            return response()->json([
                'message' => 'Production scheduled successfully. Batches auto-generated based on mold capacity.',
                'warning' => $warning,
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
            'mold_id'    => 'nullable|integer',
        ]);

        try {
            $preview = $this->planningService->previewSchedule(
                $productionDemand,
                $validated['start_date'],
                $validated['mold_id'] ?? null
            );
            
            // Check material shortage
            $reqService = new \App\Services\MaterialRequirementService();
            $requirements = $reqService->calculateRequirements($productionDemand->product_id, (float) $productionDemand->demand_qty);
            $hasShortage = $requirements->contains(function ($r) {
                return $r['shortage_qty'] > 0;
            });
            
            $preview['material_shortage'] = $hasShortage;
            $preview['material_requirements'] = $requirements->toArray();
            if ($hasShortage) {
                $preview['warning'] = "Material tidak mencukupi untuk memenuhi demand.";
            }

            return response()->json($preview);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }
    }

    /**
     * Re-open a Planned demand whose production plan has been deleted (orphan demand).
     * Planned -> Open so it can be re-scheduled.
     */
    public function reopen(ProductionDemand $productionDemand): JsonResponse
    {
        if ($productionDemand->status !== 'Planned') {
            return response()->json(['message' => 'Only Planned demands can be re-opened.'], 422);
        }

        // Check whether an active production plan still references this demand
        $hasPlan = \App\Models\ProductionPlan::where('demand_id', $productionDemand->id)
            ->whereNull('deleted_at')
            ->exists();

        if ($hasPlan) {
            return response()->json([
                'message' => 'Demand masih terhubung dengan production plan aktif. Hapus plan terlebih dahulu sebelum re-open demand.',
            ], 422);
        }

        $old = $productionDemand->status;
        $productionDemand->update(['status' => 'Open']);
        \App\Models\AuditLog::log('production_demand.reopened', 'production_demand', $productionDemand->id,
            ['status' => $old], ['status' => 'Open']);

        return response()->json([
            'message' => 'Demand berhasil di-reset ke Open dan dapat dijadwalkan kembali.',
            'demand'  => $productionDemand->fresh(['product', 'salesOrder.customer']),
        ]);
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
