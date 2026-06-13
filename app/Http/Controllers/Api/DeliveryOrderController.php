<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\DeliveryOrder;
use App\Models\SalesOrder;
use App\Models\InventoryBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class DeliveryOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryOrder::with(['salesOrder.product', 'customer'])
            ->whereNull('deleted_at');
 
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('no', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', fn ($c) => $c->where('nama', 'ilike', "%{$request->search}%"));
            });
        }
 
        $data = $query->orderByDesc('tgl_kirim')->get();
 
        return response()->json($data);
    }
 
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:App\Models\SalesOrder,id',
            'customer_id'    => 'required|exists:App\Models\Customer,id',
            'qty'            => 'required|integer|min:1',
            'truk'           => 'nullable|string|max:100',
            'driver'         => 'nullable|string|max:100',
            'tgl_kirim'      => 'required|date',
            'status'         => 'nullable|string|max:30',
            'catatan'        => 'nullable|string',
        ]);
 
        // Auto-generate DO number
        $validated['no'] = 'DO-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $validated['status'] = $validated['status'] ?? 'Disiapkan';
 
        $deliveryOrder = DeliveryOrder::create($validated);
 
        return response()->json([
            'message' => 'Delivery Order berhasil dibuat.',
            'data'    => $deliveryOrder->load(['salesOrder.product', 'customer'])
        ], 201);
    }
 
    /**
     * Check if there is a FIFO aging warning (> 30 days) for the selected Sales Order's product.
     */
    public function fifoCheck(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:App\Models\SalesOrder,id',
        ]);
 
        $so = SalesOrder::findOrFail($validated['sales_order_id']);
        if (!$so->product_id) {
            return response()->json([
                'has_warning' => false
            ]);
        }
 
        // Get oldest active batch (MTS) for this product
        $oldestBatch = InventoryBatch::where('product_id', $so->product_id)
            ->where('qty_on_hand', '>', 0)
            ->orderBy('production_date', 'asc')
            ->first();
 
        if ($oldestBatch && $oldestBatch->aging_days > 30) {
            return response()->json([
                'has_warning'     => true,
                'aging_days'      => $oldestBatch->aging_days,
                'batch_number'    => $oldestBatch->batch_number,
                'qty_on_hand'     => (float) $oldestBatch->qty_on_hand,
                'production_date' => $oldestBatch->production_date ? $oldestBatch->production_date->toDateString() : null,
                'message'         => "Peringatan FIFO (MTS): Terdapat stok produk dengan umur simpan > 30 hari! Silakan keluarkan Batch/Lot tertua terlebih dahulu: {$oldestBatch->batch_number} (Umur: {$oldestBatch->aging_days} hari)."
            ]);
        }
 
        return response()->json([
            'has_warning' => false
        ]);
    }
 
    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::with(['salesOrder.product', 'customer'])
            ->whereNull('deleted_at')
            ->findOrFail($id);
 
        return response()->json($deliveryOrder);
    }
 
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::findOrFail($id);
        $validated = $request->validate([
            'truk'      => 'nullable|string|max:100',
            'driver'    => 'nullable|string|max:100',
            'tgl_kirim' => 'nullable|date',
            'status'    => 'nullable|string|max:30',
            'catatan'   => 'nullable|string',
        ]);
 
        $deliveryOrder->update($validated);
 
        return response()->json([
            'message' => 'Delivery Order berhasil diperbarui.',
            'data'    => $deliveryOrder->load(['salesOrder.product', 'customer'])
        ]);
    }
 
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::findOrFail($id);
        $deliveryOrder->delete();
 
        return response()->json([
            'message' => 'Delivery Order berhasil dihapus.'
        ]);
    }
}
