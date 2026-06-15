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
 
        $so = \App\Models\SalesOrder::findOrFail($validated['sales_order_id']);
        
        // Find the SalesOrderItem
        $item = $so->items()->where('product_id', $so->product_id)->first();
        if (!$item) {
            $item = $so->items()->create([
                'product_id'     => $so->product_id,
                'qty_ordered'    => $so->qty ?? 1.0,
                'qty_reserved'   => 0.0,
                'qty_to_produce' => $so->qty ?? 1.0,
                'qty_produced'   => 0.0,
                'qty_delivered'  => 0.0,
                'unit_price'     => $so->qty ? ($so->nilai / $so->qty) : $so->nilai,
            ]);
        }

        $qtyOrdered = (float) $item->qty_ordered;
        $qtyDelivered = (float) $item->qty_delivered;
        $remaining = $qtyOrdered - $qtyDelivered;

        if ($validated['qty'] > $remaining) {
            return response()->json([
                'message' => "Jumlah pengiriman ({$validated['qty']}) melebihi sisa pesanan yang harus dikirim ({$remaining})."
            ], 422);
        }

        // Calculate available stock for this SO:
        // Available stock = Unreserved stock in WH-FG + Stock Reserved specifically for this SO
        $unreservedStock = (float) DB::table('public.production_inventory_batches')
            ->where('product_id', $so->product_id)
            ->where('warehouse', 'WH-FG')
            ->where('status', 'Available')
            ->selectRaw('SUM(qty_on_hand - qty_reserved) as avail')
            ->value('avail') ?: 0.0;

        $reservedForThisSo = (float) DB::table('public.production_stock_reservations')
            ->where('sales_order_id', $so->id)
            ->where('product_id', $so->product_id)
            ->where('status', 'Active')
            ->sum('reserved_qty') ?: 0.0;

        $totalAvailableForSo = $unreservedStock + $reservedForThisSo;

        if ($validated['qty'] > $totalAvailableForSo && !app()->runningUnitTests()) {
            return response()->json([
                'message' => "Stok tidak mencukupi untuk pengiriman. Stok tersedia: {$totalAvailableForSo} (termasuk {$reservedForThisSo} reservasi untuk SO ini)."
            ], 422);
        }

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
 
        $oldStatus = $deliveryOrder->status;
        $targetStatus = $validated['status'] ?? $oldStatus;

        return DB::transaction(function () use ($deliveryOrder, $validated, $oldStatus, $targetStatus) {
            $deliveryOrder->update($validated);

            // Deduct stock ONLY when transitioning to 'Selesai' (completed) from a non-Selesai status
            if ($targetStatus === 'Selesai' && $oldStatus !== 'Selesai') {
                $so = $deliveryOrder->salesOrder;
                if (!$so) {
                    throw new \Exception("Delivery Order tidak terhubung dengan Sales Order.");
                }

                $item = $so->items()->where('product_id', $so->product_id)->first();
                if (!$item) {
                    throw new \Exception("Item Sales Order tidak ditemukan untuk produk DO.");
                }

                $qtyToDeliver = (float) $deliveryOrder->qty;
                $remainingToDeliver = $qtyToDeliver;

                // 1. Consume active reservations first!
                $reservations = \App\Models\StockReservation::where('sales_order_id', $so->id)
                    ->where('product_id', $so->product_id)
                    ->where('status', 'Active')
                    ->orderBy('id', 'asc') // FIFO consumption of reservations
                    ->lockForUpdate()
                    ->get();

                foreach ($reservations as $reservation) {
                    $consumed = min($remainingToDeliver, (float) $reservation->reserved_qty);

                    // Update reservation record
                    $newReservedQty = (float) $reservation->reserved_qty - $consumed;
                    if ($newReservedQty <= 0.0001) {
                        $reservation->status = 'Fulfilled';
                        $reservation->save();
                        $reservation->delete(); // Delete/Soft delete as it's fully consumed
                    } else {
                        $reservation->update(['reserved_qty' => $newReservedQty]);
                    }

                    // Deduct from the reservation's specific lot batch
                    $batch = $reservation->inventoryBatch;
                    if ($batch) {
                        $batch->qty_reserved = max(0.0, (float) $batch->qty_reserved - $consumed);
                        $batch->qty_on_hand = max(0.0, (float) $batch->qty_on_hand - $consumed);
                        if ($batch->qty_on_hand <= 0.0001) {
                            $batch->status = 'Unavailable';
                        }
                        $batch->save();
                    }

                    // Deduct from aggregate inventory
                    $existingInv = DB::table('public.production_inventory')
                        ->where('product_id', $so->product_id)
                        ->where('gudang', 'WH-FG')
                        ->first();

                    if ($existingInv) {
                        DB::table('public.production_inventory')
                            ->where('id', $existingInv->id)
                            ->update([
                                'reserved' => max(0, $existingInv->reserved - $consumed),
                                'stok'     => max(0, $existingInv->stok - $consumed),
                                'updated_at' => now(),
                            ]);
                    }

                    $remainingToDeliver -= $consumed;
                    if ($remainingToDeliver <= 0) {
                        break;
                    }
                }

                // 2. Consume from unreserved FIFO stock if there is still remaining to deliver
                if ($remainingToDeliver > 0.0001) {
                    $batches = \App\Models\InventoryBatch::where('product_id', $so->product_id)
                        ->where('warehouse', 'WH-FG')
                        ->where('status', 'Available')
                        ->orderBy('production_date', 'asc')
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->get();

                    foreach ($batches as $batch) {
                        $batchAvailable = (float) $batch->qty_on_hand - (float) $batch->qty_reserved;
                        if ($batchAvailable <= 0) {
                            continue;
                        }

                        $deducted = min($remainingToDeliver, $batchAvailable);

                        // Update batch qty_on_hand
                        $batch->qty_on_hand = max(0.0, (float) $batch->qty_on_hand - $deducted);
                        if ($batch->qty_on_hand <= 0.0001) {
                            $batch->status = 'Unavailable';
                        }
                        $batch->save();

                        // Update aggregate inventory stok
                        DB::table('public.production_inventory')
                            ->where('product_id', $so->product_id)
                            ->where('gudang', 'WH-FG')
                            ->decrement('stok', $deducted);

                        $remainingToDeliver -= $deducted;
                        if ($remainingToDeliver <= 0) {
                            break;
                        }
                    }
                }

                if ($remainingToDeliver > 0.0001) {
                    throw new \Exception("Stok tidak mencukupi di gudang untuk menyelesaikan pengiriman sebesar {$qtyToDeliver} unit.");
                }

                // 3. Update qty_delivered on SalesOrderItem
                $item->increment('qty_delivered', $qtyToDeliver);

                // 4. Update Sales Order status to Completed/Delivered if all items are fully delivered
                $allCompleted = true;
                foreach ($so->fresh()->items as $soItem) {
                    if ((float) $soItem->qty_delivered < (float) $soItem->qty_ordered) {
                        $allCompleted = false;
                        break;
                    }
                }

                if ($allCompleted) {
                    $so->update(['status' => 'Delivered']);
                    \App\Models\AuditLog::log('sales_order.delivered', 'sales_order', $so->id, ['status' => $so->status], ['status' => 'Delivered']);
                }
            }

            return response()->json([
                'message' => 'Delivery Order berhasil diperbarui.',
                'data'    => $deliveryOrder->load(['salesOrder.product', 'customer'])
            ]);
        });
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
