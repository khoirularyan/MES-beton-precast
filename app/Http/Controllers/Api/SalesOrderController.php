<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\AuditLog;
use App\Services\SalesOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalesOrderController extends Controller
{
    protected SalesOrderService $salesOrderService;

    public function __construct(SalesOrderService $salesOrderService)
    {
        $this->salesOrderService = $salesOrderService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = SalesOrder::with(['customer', 'product', 'items.product'])
            ->whereNull('deleted_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('so_type')) {
            $query->where('so_type', $request->so_type);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('no', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', fn ($c) => $c->where('nama', 'ilike', "%{$request->search}%"));
            });
        }

        $data = $query->orderByDesc('tgl_order')->paginate($request->get('per_page', 15));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'no'                    => 'nullable|string|max:30|unique:production_sales_orders,no',
            'so_type'               => ['required', Rule::in(['MTO', 'MTS'])],
            'customer_id'           => 'required|exists:production_customers,id',
            'product_id'            => 'nullable|exists:production_products,id',
            'qty'                   => 'nullable|integer|min:1',
            'nilai'                 => 'required|integer|min:0',
            'tgl_order'             => 'required|date',
            'tgl_kirim'             => 'required|date|after_or_equal:tgl_order',
            'prioritas'             => ['nullable', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'catatan'               => 'nullable|string',
            'items'                 => 'nullable|array',
            'items.*.product_id'    => 'required|exists:production_products,id',
            'items.*.qty_ordered'   => 'required|numeric|min:0.01',
            'items.*.unit_price'    => 'nullable|numeric|min:0',
            'items.*.delivery_date' => 'nullable|date',
            'items.*.notes'         => 'nullable|string',
        ]);

        $so = $this->salesOrderService->createSalesOrder($validated);

        return response()->json($so, 201);
    }

    public function show(SalesOrder $salesOrder): JsonResponse
    {
        return response()->json(
            $salesOrder->load(['customer', 'product', 'items.product', 'demands', 'stockReservations.inventoryBatch'])
        );
    }

    public function update(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        $validated = $request->validate([
            'nilai'                 => 'sometimes|required|integer|min:0',
            'tgl_kirim'             => 'sometimes|required|date',
            'prioritas'             => ['sometimes', 'nullable', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'catatan'               => 'nullable|string',
            'items'                 => 'sometimes|required|array',
            'items.*.product_id'    => 'required|exists:production_products,id',
            'items.*.qty_ordered'   => 'required|numeric|min:0.01',
            'items.*.unit_price'    => 'nullable|numeric|min:0',
            'items.*.delivery_date' => 'nullable|date',
            'items.*.notes'         => 'nullable|string',
        ]);

        $so = $this->salesOrderService->updateSalesOrder($salesOrder, $validated);

        return response()->json($so);
    }

    public function destroy(SalesOrder $salesOrder): JsonResponse
    {
        if ($salesOrder->status !== 'Draft') {
            return response()->json(['message' => 'Only Draft SO can be deleted'], 422);
        }

        $salesOrder->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function items(SalesOrder $salesOrder): JsonResponse
    {
        return response()->json(
            $salesOrder->items()->with('product')->get()
        );
    }

    public function submit(SalesOrder $salesOrder): JsonResponse
    {
        $so = $this->salesOrderService->submit($salesOrder);
        return response()->json(['message' => 'Sales Order submitted', 'so' => $so]);
    }

    public function confirm(SalesOrder $salesOrder): JsonResponse
    {
        $so = $this->salesOrderService->approve($salesOrder);
        return response()->json(['message' => 'SO approved', 'so' => $so]);
    }

    public function reject(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $so = $this->salesOrderService->reject($salesOrder, $validated['reason']);
        return response()->json(['message' => 'SO rejected', 'so' => $so]);
    }

    public function cancel(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        if (!\App\Support\Rbac::userCan($request->user(), 'sales.manage') && !\App\Support\Rbac::userCan($request->user(), 'sales.approve')) {
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'required' => 'sales.manage or sales.approve'
            ], 403);
        }

        $so = $this->salesOrderService->cancel($salesOrder);
        return response()->json(['message' => 'SO cancelled', 'so' => $so]);
    }

    public function generateDemands(SalesOrder $salesOrder): JsonResponse
    {
        $so = $this->salesOrderService->generateDemands($salesOrder);
        return response()->json(['message' => 'Demands generated successfully', 'so' => $so]);
    }

    public function lockBom(SalesOrder $salesOrder): JsonResponse
    {
        $result = $this->salesOrderService->lockBom($salesOrder);

        $so = $salesOrder->fresh()->load(['customer', 'product', 'items.product', 'demands']);

        $message = count($result['missing']) === 0
            ? 'BOM berhasil dikunci untuk semua item.'
            : 'BOM dikunci sebagian. Item berikut tidak memiliki BOM aktif: ' . implode(', ', $result['missing']);

        return response()->json([
            'message' => $message,
            'locked'  => $result['locked'],
            'missing' => $result['missing'],
            'so'      => $so,
        ]);
    }

    public function auditLogs(SalesOrder $salesOrder): JsonResponse
    {
        $logs = AuditLog::where('entity_type', 'sales_order')
            ->where('entity_id', $salesOrder->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($logs);
    }
}
