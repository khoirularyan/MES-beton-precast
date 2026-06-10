<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\InventoryBatch;
use App\Models\ProductionDemand;
use App\Models\StockReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SalesOrderController extends Controller
{
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
            'no'          => 'required|string|max:30|unique:production_sales_orders,no',
            'so_type'     => ['required', Rule::in(['MTO', 'MTS'])],
            'customer_id' => 'required|exists:production_customers,id',
            'product_id'  => 'required|exists:production_products,id',
            'qty'         => 'required|integer|min:1',
            'nilai'       => 'nullable|integer|min:0',
            'tgl_order'   => 'required|date',
            'tgl_kirim'   => 'required|date|after_or_equal:tgl_order',
            'prioritas'   => ['nullable', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'catatan'     => 'nullable|string',
            'items'       => 'nullable|array',
            'items.*.product_id'    => 'required|exists:production_products,id',
            'items.*.qty_ordered'   => 'required|numeric|min:0.01',
            'items.*.unit_price'    => 'nullable|numeric|min:0',
            'items.*.delivery_date' => 'nullable|date',
        ]);

        $so = DB::transaction(function () use ($validated) {
            $so = SalesOrder::create([
                'no'          => $validated['no'],
                'so_type'     => $validated['so_type'],
                'customer_id' => $validated['customer_id'],
                'product_id'  => $validated['product_id'],
                'qty'         => $validated['qty'],
                'nilai'       => $validated['nilai'] ?? 0,
                'tgl_order'   => $validated['tgl_order'],
                'tgl_kirim'   => $validated['tgl_kirim'],
                'prioritas'   => $validated['prioritas'] ?? 'Sedang',
                'catatan'     => $validated['catatan'] ?? null,
                'status'      => 'Draft',
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $so->items()->create([
                        'product_id'    => $item['product_id'],
                        'qty_ordered'   => $item['qty_ordered'],
                        'unit_price'    => $item['unit_price'] ?? 0,
                        'delivery_date' => $item['delivery_date'] ?? $validated['tgl_kirim'],
                    ]);
                }
            }

            return $so;
        });

        return response()->json($so->load(['customer', 'product', 'items.product']), 201);
    }

    public function show(SalesOrder $salesOrder): JsonResponse
    {
        return response()->json(
            $salesOrder->load(['customer', 'product', 'items.product', 'demands', 'stockReservations.inventoryBatch'])
        );
    }

    public function update(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        if (in_array($salesOrder->status, ['Produksi', 'Siap Kirim', 'Selesai'])) {
            return response()->json(['message' => 'Cannot edit SO with status: ' . $salesOrder->status], 422);
        }

        $validated = $request->validate([
            'tgl_kirim' => 'nullable|date',
            'nilai'     => 'nullable|integer|min:0',
            'prioritas' => ['nullable', Rule::in(['Rendah', 'Sedang', 'Tinggi'])],
            'catatan'   => 'nullable|string',
        ]);

        $salesOrder->update($validated);

        return response()->json($salesOrder->fresh(['customer', 'product']));
    }

    public function destroy(SalesOrder $salesOrder): JsonResponse
    {
        if (!in_array($salesOrder->status, ['Draft'])) {
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

    public function confirm(SalesOrder $salesOrder): JsonResponse
    {
        if ($salesOrder->status !== 'Draft') {
            return response()->json(['message' => 'Only Draft SO can be confirmed'], 422);
        }

        $salesOrder->update(['status' => 'Approved']);

        return response()->json(['message' => 'SO confirmed', 'status' => 'Approved']);
    }

    public function checkStock(SalesOrder $salesOrder): JsonResponse
    {
        $product = $salesOrder->product;
        $qtyNeeded = $salesOrder->qty;

        // Get available stock batches (FIFO - oldest first)
        $batches = InventoryBatch::where('product_id', $product->id)
            ->where('status', 'Available')
            ->whereNull('deleted_at')
            ->orderBy('production_date')
            ->get();

        $totalAvailable = $batches->sum(fn ($b) => max(0, $b->qty_on_hand - $b->qty_reserved));
        $qtyFromStock   = min($totalAvailable, $qtyNeeded);
        $qtyToProduce   = max(0, $qtyNeeded - $qtyFromStock);

        return response()->json([
            'product_id'       => $product->id,
            'product_name'     => $product->nama,
            'qty_ordered'      => $qtyNeeded,
            'qty_available'    => $totalAvailable,
            'qty_from_stock'   => $qtyFromStock,
            'qty_to_produce'   => $qtyToProduce,
            'available_batches' => $batches->map(fn ($b) => [
                'batch_number'   => $b->batch_number,
                'production_date' => $b->production_date?->toDateString(),
                'qty_available'  => max(0, $b->qty_on_hand - $b->qty_reserved),
                'aging_days'     => $b->aging_days,
            ]),
        ]);
    }
}
