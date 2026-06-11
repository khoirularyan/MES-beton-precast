<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionDemand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductionDemandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductionDemand::with(['product', 'salesOrder.customer'])
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
            'status'        => ['nullable', Rule::in(['Open', 'Planned', 'Cancelled', 'Closed'])],
            'notes'         => 'nullable|string',
        ]);

        $productionDemand->update($validated);
        return response()->json($productionDemand->fresh(['product', 'salesOrder']));
    }

    public function destroy(ProductionDemand $productionDemand): JsonResponse
    {
        if ($productionDemand->status === 'Planned') {
            return response()->json(['message' => 'Cannot delete a Planned demand'], 422);
        }
        $productionDemand->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
