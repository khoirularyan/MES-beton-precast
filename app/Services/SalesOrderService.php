<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Product;
use App\Models\ProductionDemand;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesOrderService
{
    /**
     * Create a new Sales Order with resolved items and snapshots.
     */
    public function createSalesOrder(array $data): SalesOrder
    {
        return DB::transaction(function () use ($data) {
            // MTS Customer Auto-Resolution
            if (($data['so_type'] ?? '') === 'MTS') {
                $internalCustomer = \App\Models\Customer::firstOrCreate(
                    ['kode' => 'CUS-INTERNAL'],
                    [
                        'nama' => 'PT Default Perusahaan (MTS)',
                        'kontak' => 'Internal Supervisor',
                        'telepon' => '021-99998888',
                        'email' => 'mts@perusahaan.com',
                        'kota' => 'Bekasi',
                        'segmen' => 'Internal',
                        'limit_kredit' => 0,
                        'aktif' => true,
                    ]
                );
                $data['customer_id'] = $internalCustomer->id;
            }

            // Auto-generate Sales Order number with Plant prefix: SO-PLANT-YYYYMMDD-XXXX
            $plantCode = 'BKS'; // Fallback
            $user = auth()->user();
            if ($user && $user->plant) {
                $plant = strtolower($user->plant);
                if (str_contains($plant, 'bekasi')) $plantCode = 'BKS';
                elseif (str_contains($plant, 'surabaya')) $plantCode = 'SBY';
                elseif (str_contains($plant, 'cikarang')) $plantCode = 'CKR';
                elseif (str_contains($plant, 'karawang')) $plantCode = 'KRW';
                else {
                    $words = explode(' ', $user->plant);
                    if (count($words) > 1) {
                        $plantCode = strtoupper(substr($words[1], 0, 3));
                    } else {
                        $plantCode = strtoupper(substr($user->plant, 0, 3));
                    }
                }
            }
            $datePrefix = now()->format('Ymd');
            $prefix = "SO-{$plantCode}-{$datePrefix}-";

            // Use lockForUpdate to ensure concurrency protection
            $latest = SalesOrder::where('no', 'like', "{$prefix}%")
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            
            $seq = 1;
            if ($latest) {
                $lastSeq = (int) substr($latest->no, -4);
                $seq = $lastSeq + 1;
            }
            
            do {
                $no = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
                $seq++;
            } while (SalesOrder::where('no', $no)->lockForUpdate()->exists());
            $data['no'] = $no;

            // Handle legacy/fallback when items are not provided
            if (empty($data['items'])) {
                $data['items'] = [
                    [
                        'product_id' => $data['product_id'],
                        'qty_ordered' => $data['qty'],
                        'qty_reserved' => 0,
                        'qty_to_produce' => $data['qty'],
                        'unit_price' => $data['nilai'] / max(1, $data['qty']),
                        'delivery_date' => $data['tgl_kirim'] ?? null,
                    ]
                ];
            } else {
                // If items are provided, set header level product_id and qty from the first item
                if (empty($data['product_id'])) {
                    $data['product_id'] = $data['items'][0]['product_id'];
                }
                if (empty($data['qty'])) {
                    $data['qty'] = array_sum(array_column($data['items'], 'qty_ordered'));
                }
            }

            // Validate items: qty_reserved + qty_to_produce = qty_ordered
            // and qty_reserved <= available_stock
            foreach ($data['items'] as $itemData) {
                $qtyOrdered = (float) $itemData['qty_ordered'];
                $qtyReserved = (float) ($itemData['qty_reserved'] ?? 0);
                $qtyToProduce = (float) ($itemData['qty_to_produce'] ?? $qtyOrdered);

                if (abs(($qtyReserved + $qtyToProduce) - $qtyOrdered) > 0.0001) {
                    throw ValidationException::withMessages([
                        'items' => ["Total Qty Alokasi ({$qtyReserved}) dan Produksi ({$qtyToProduce}) harus sama dengan Qty Order ({$qtyOrdered})."]
                    ]);
                }

                // Check available stock
                $productId = $itemData['product_id'];
                $availableStock = (float) DB::table('public.production_inventory_batches')
                    ->where('product_id', $productId)
                    ->where('warehouse', 'WH-FG')
                    ->where('status', 'Available')
                    ->selectRaw('SUM(qty_on_hand - qty_reserved) as avail')
                    ->value('avail') ?: 0.0;

                if ($qtyReserved > $availableStock) {
                    throw ValidationException::withMessages([
                        'items' => ["Jumlah alokasi stok ({$qtyReserved}) melebihi stok tersedia ({$availableStock}) untuk produk ID {$productId}."]
                    ]);
                }
            }

            $so = SalesOrder::create([
                'no'          => $data['no'],
                'so_type'     => $data['so_type'],
                'customer_id' => $data['customer_id'],
                'product_id'  => $data['product_id'],
                'qty'         => $data['qty'],
                'nilai'       => $data['nilai'] ?? 0,
                'tgl_order'   => $data['tgl_order'],
                'tgl_kirim'   => $data['tgl_kirim'],
                'prioritas'   => $data['prioritas'] ?? 'Sedang',
                'catatan'     => $data['catatan'] ?? null,
                'status'      => 'Draft',
            ]);

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $resolved = $this->prepareItemData($product, $itemData['qty_ordered'], $itemData['unit_price'] ?? null);
                
                $so->items()->create(array_merge($resolved, [
                    'qty_ordered'    => $itemData['qty_ordered'],
                    'qty_reserved'   => $itemData['qty_reserved'] ?? 0,
                    'qty_to_produce' => $itemData['qty_to_produce'] ?? $itemData['qty_ordered'],
                    'delivery_date'  => $itemData['delivery_date'] ?? $so->tgl_kirim,
                    'notes'          => $itemData['notes'] ?? null,
                ]));
            }

            AuditLog::log('sales_order.created', 'sales_order', $so->id, null, $so->toArray());

            return $so->load(['customer', 'product', 'items.product']);
        });
    }

    /**
     * Update an existing Draft or Rejected Sales Order.
     */
    public function updateSalesOrder(SalesOrder $so, array $data): SalesOrder
    {
        if (!in_array($so->status, ['Draft', 'Rejected'])) {
            throw ValidationException::withMessages([
                'status' => ['Cannot edit Sales Order with status: ' . $so->status]
            ]);
        }

        return DB::transaction(function () use ($so, $data) {
            $oldValues = $so->toArray();

            // Perform updates to header properties if present
            $so->update(array_intersect_key($data, array_flip([
                'nilai', 'tgl_kirim', 'prioritas', 'catatan'
            ])));

            if (isset($data['items'])) {
                // Validate items: qty_reserved + qty_to_produce = qty_ordered
                // and qty_reserved <= available_stock
                foreach ($data['items'] as $itemData) {
                    $qtyOrdered = (float) $itemData['qty_ordered'];
                    $qtyReserved = (float) ($itemData['qty_reserved'] ?? 0);
                    $qtyToProduce = (float) ($itemData['qty_to_produce'] ?? $qtyOrdered);

                    if (abs(($qtyReserved + $qtyToProduce) - $qtyOrdered) > 0.0001) {
                        throw ValidationException::withMessages([
                            'items' => ["Total Qty Alokasi ({$qtyReserved}) dan Produksi ({$qtyToProduce}) harus sama dengan Qty Order ({$qtyOrdered})."]
                        ]);
                    }

                    // Check available stock
                    $productId = $itemData['product_id'];
                    $availableStock = (float) DB::table('public.production_inventory_batches')
                        ->where('product_id', $productId)
                        ->where('warehouse', 'WH-FG')
                        ->where('status', 'Available')
                        ->selectRaw('SUM(qty_on_hand - qty_reserved) as avail')
                        ->value('avail') ?: 0.0;

                    if ($qtyReserved > $availableStock) {
                        throw ValidationException::withMessages([
                            'items' => ["Jumlah alokasi stok ({$qtyReserved}) melebihi stok tersedia ({$availableStock}) untuk produk ID {$productId}."]
                        ]);
                    }
                }

                // Remove existing items and rebuild
                $so->items()->delete();

                foreach ($data['items'] as $itemData) {
                    $product = Product::findOrFail($itemData['product_id']);
                    $resolved = $this->prepareItemData($product, $itemData['qty_ordered'], $itemData['unit_price'] ?? null);

                    $so->items()->create(array_merge($resolved, [
                        'qty_ordered'    => $itemData['qty_ordered'],
                        'qty_reserved'   => $itemData['qty_reserved'] ?? 0,
                        'qty_to_produce' => $itemData['qty_to_produce'] ?? $itemData['qty_ordered'],
                        'delivery_date'  => $itemData['delivery_date'] ?? $so->tgl_kirim,
                        'notes'          => $itemData['notes'] ?? null,
                    ]));
                }

                // Sync header levels to match updated items
                $so->product_id = $data['items'][0]['product_id'];
                $so->qty = array_sum(array_column($data['items'], 'qty_ordered'));
                $so->save();
            }

            AuditLog::log('sales_order.updated', 'sales_order', $so->id, $oldValues, $so->fresh()->toArray());

            return $so->load(['customer', 'product', 'items.product']);
        });
    }

    /**
     * Transition: Draft -> Submitted
     */
    public function submit(SalesOrder $so): SalesOrder
    {
        if ($so->status !== 'Draft' && $so->status !== 'Rejected') {
            throw ValidationException::withMessages([
                'status' => ['Only Draft or Rejected Sales Orders can be submitted.']
            ]);
        }

        $oldValues = ['status' => $so->status];
        $so->status = 'Submitted';
        $so->save();

        AuditLog::log('sales_order.submitted', 'sales_order', $so->id, $oldValues, ['status' => 'Submitted']);

        return $so;
    }

    /**
     * Transition: Submitted -> Approved
     */
    public function approve(SalesOrder $so): SalesOrder
    {
        if ($so->status !== 'Submitted') {
            throw ValidationException::withMessages([
                'status' => ['Only Submitted Sales Orders can be approved.']
            ]);
        }

        return DB::transaction(function () use ($so) {
            $oldValues = ['status' => 'Submitted'];
            $so->status = 'Approved';
            $so->save();

            // Perform FIFO lot allocation for items with qty_reserved > 0
            foreach ($so->items as $item) {
                $qtyReserved = (float) $item->qty_reserved;
                if ($qtyReserved <= 0) {
                    continue;
                }

                $remaining = $qtyReserved;
                
                // Get available batches ordered by production_date (FIFO)
                $batches = \App\Models\InventoryBatch::where('product_id', $item->product_id)
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

                    $allocated = min($remaining, $batchAvailable);

                    // Update batch qty_reserved
                    $batch->qty_reserved = (float) $batch->qty_reserved + $allocated;
                    $batch->save();

                    // Create stock reservation record
                    \App\Models\StockReservation::create([
                        'sales_order_id'      => $so->id,
                        'sales_order_item_id' => $item->id,
                        'inventory_batch_id' => $batch->id,
                        'product_id'          => $item->product_id,
                        'reserved_qty'        => $allocated,
                        'reservation_date'    => now(),
                        'status'              => 'Active',
                        'notes'               => "Reserved during SO Approval: {$so->no}",
                    ]);

                    // Update aggregate inventory
                    $existingInv = DB::table('public.production_inventory')
                        ->where('product_id', $item->product_id)
                        ->where('gudang', 'WH-FG')
                        ->first();

                    if ($existingInv) {
                        DB::table('public.production_inventory')
                            ->where('id', $existingInv->id)
                            ->update([
                                'reserved'   => $existingInv->reserved + $allocated,
                                'updated_at' => now(),
                            ]);
                    } else {
                        DB::table('public.production_inventory')->insert([
                            'product_id'   => $item->product_id,
                            'gudang'       => 'WH-FG',
                            'stok'         => 0,
                            'reserved'     => $allocated,
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ]);
                    }

                    $remaining -= $allocated;
                    if ($remaining <= 0) {
                        break;
                    }
                }

                if ($remaining > 0.0001) {
                    throw ValidationException::withMessages([
                        'items' => ["Gagal melakukan alokasi stok otomatis. Stok produk ID {$item->product_id} tidak mencukupi untuk melakukan reservasi sebesar {$qtyReserved} unit."]
                    ]);
                }
            }

            AuditLog::log('sales_order.approved', 'sales_order', $so->id, $oldValues, ['status' => 'Approved']);

            return $so;
        });
    }

    /**
     * Transition: Submitted -> Rejected
     */
    public function reject(SalesOrder $so, string $reason): SalesOrder
    {
        if ($so->status !== 'Submitted') {
            throw ValidationException::withMessages([
                'status' => ['Only Submitted Sales Orders can be rejected.']
            ]);
        }

        $oldValues = ['status' => 'Submitted'];
        $so->status = 'Rejected';
        $so->save();

        AuditLog::log('sales_order.rejected', 'sales_order', $so->id, $oldValues, [
            'status' => 'Rejected',
            'reason' => $reason
        ]);

        return $so;
    }

    /**
     * Transition: Non-final -> Cancelled
     */
    public function cancel(SalesOrder $so): SalesOrder
    {
        if (in_array($so->status, ['Completed', 'Delivered', 'Cancelled'])) {
            throw ValidationException::withMessages([
                'status' => ['Cannot cancel a final or already cancelled Sales Order.']
            ]);
        }

        return DB::transaction(function () use ($so) {
            $oldValues = ['status' => $so->status];
            $so->status = 'Cancelled';
            $so->save();

            // Release any active stock reservations
            $reservations = \App\Models\StockReservation::where('sales_order_id', $so->id)
                ->where('status', 'Active')
                ->lockForUpdate()
                ->get();

            foreach ($reservations as $reservation) {
                // Decrement batch qty_reserved
                $batch = $reservation->inventoryBatch;
                if ($batch) {
                    $batch->qty_reserved = max(0.0, (float) $batch->qty_reserved - (float) $reservation->reserved_qty);
                    $batch->save();
                }

                // Decrement aggregate inventory reserved
                $existingInv = DB::table('public.production_inventory')
                    ->where('product_id', $reservation->product_id)
                    ->where('gudang', 'WH-FG')
                    ->first();

                if ($existingInv) {
                    DB::table('public.production_inventory')
                        ->where('id', $existingInv->id)
                        ->update([
                            'reserved'   => max(0, $existingInv->reserved - (float) $reservation->reserved_qty),
                            'updated_at' => now(),
                        ]);
                }

                // Delete reservation record
                $reservation->status = 'Cancelled';
                $reservation->save();
                $reservation->delete();
            }

            AuditLog::log('sales_order.cancelled', 'sales_order', $so->id, $oldValues, ['status' => 'Cancelled']);

            return $so;
        });
    }

    /**
     * Transition: Approved -> Planning (PPIC Generate Demand)
     */
    public function generateDemands(SalesOrder $so): SalesOrder
    {
        // Auto-initialize items if empty (e.g. from legacy tests)
        if ($so->items()->count() === 0) {
            $bomHeaderId = \App\Models\BomHeader::where('product_id', $so->product_id)
                ->where('status', 'active')
                ->value('id') 
                ?: \App\Models\BomHeader::where('product_id', $so->product_id)->value('id');

            $so->items()->create([
                'product_id'     => $so->product_id,
                'qty_ordered'    => $so->qty ?? 1.0,
                'qty_reserved'   => 0.0,
                'qty_to_produce' => $so->qty ?? 1.0,
                'qty_produced'   => 0.0,
                'qty_delivered'  => 0.0,
                'unit_price'     => $so->qty ? ($so->nilai / $so->qty) : $so->nilai,
                'bom_header_id'  => $bomHeaderId,
            ]);
            $so->load('items');
        }

        // Validation 5: Check Sales Order status is Approved
        if ($so->status !== 'Approved') {
            $msg = "Generate Demand gagal. Status Sales Order harus Approved.";
            AuditLog::log('sales_order.demand_generation_failed', 'sales_order', $so->id, null, ['reason' => $msg]);
            throw ValidationException::withMessages(['status' => [$msg]]);
        }

        // Validation 4: Duplicate protection check
        $exists = ProductionDemand::where('sales_order_id', $so->id)->lockForUpdate()->exists();
        if ($exists) {
            $msg = "Generate Demand gagal. Production demands have already been generated for this Sales Order.";
            AuditLog::log('sales_order.demand_generation_failed', 'sales_order', $so->id, null, ['reason' => $msg]);
            throw ValidationException::withMessages(['sales_order_id' => [$msg]]);
        }

        // Verify each item before starting transaction (only if it requires production)
        foreach ($so->items as $item) {
            $qtyReserved = (float) $item->qty_reserved;
            $qtyToProduce = (float) $item->qty_to_produce;
            if (abs(($qtyReserved + $qtyToProduce) - (float) $item->qty_ordered) > 0.0001) {
                $qtyToProduce = (float) $item->qty_ordered - $qtyReserved;
            }

            if ($qtyToProduce <= 0) {
                continue;
            }

            $product = $item->product;
            $productName = $item->product_name_snapshot ?? ($product ? $product->nama : 'Unknown Product');

            // Validation 1: Must have active_bom_id (bom_header_id)
            if (is_null($item->bom_header_id)) {
                $msg = "Generate Demand gagal. Produk: {$productName} Belum memiliki BOM aktif.";
                AuditLog::log('sales_order.demand_generation_failed', 'sales_order', $so->id, null, ['reason' => $msg]);
                throw ValidationException::withMessages(['bom' => [$msg]]);
            }

            // Validation 2: BOM status must be active (not draft or archived)
            $bomHeader = \App\Models\BomHeader::find($item->bom_header_id);
            if (!$bomHeader || $bomHeader->status !== 'active') {
                $statusLabel = $bomHeader ? $bomHeader->status : 'NULL';
                $msg = "Generate Demand gagal. Produk: {$productName} BOM aktif tidak valid atau berstatus {$statusLabel}.";
                AuditLog::log('sales_order.demand_generation_failed', 'sales_order', $so->id, null, ['reason' => $msg]);
                throw ValidationException::withMessages(['bom' => [$msg]]);
            }

            // Validation 3: BOM must have at least 1 material in items
            $itemCount = \App\Models\BomItem::where('bom_header_id', $item->bom_header_id)->count();
            if ($itemCount === 0) {
                $msg = "Generate Demand gagal. Produk: {$productName} BOM aktif tidak memiliki material.";
                AuditLog::log('sales_order.demand_generation_failed', 'sales_order', $so->id, null, ['reason' => $msg]);
                throw ValidationException::withMessages(['bom' => [$msg]]);
            }
        }

        return DB::transaction(function () use ($so) {
            $oldValues = ['status' => 'Approved'];

            foreach ($so->items as $item) {
                $qtyReserved = (float) $item->qty_reserved;
                $qtyToProduce = (float) $item->qty_to_produce;
                if (abs(($qtyReserved + $qtyToProduce) - (float) $item->qty_ordered) > 0.0001) {
                    $qtyToProduce = (float) $item->qty_ordered - $qtyReserved;
                }

                if ($qtyToProduce <= 0) {
                    continue;
                }

                // Format: DEMAND-SO-{so_no}-{item_id}
                $demandNumber = 'DEMAND-SO-' . $so->no . '-' . $item->id;

                ProductionDemand::create([
                    'demand_number'       => $demandNumber,
                    'source_type'         => 'Sales Order',
                    'sales_order_id'      => $so->id,
                    'sales_order_item_id' => $item->id,
                    'product_id'          => $item->product_id,
                    'demand_qty'          => $qtyToProduce,
                    'required_date'       => $item->delivery_date ?? $so->tgl_kirim,
                    'priority'            => $so->prioritas === 'Tinggi' ? 3 : ($so->prioritas === 'Rendah' ? 7 : 5),
                    'status'              => 'Open',
                    'notes'               => $item->notes ?? 'Generated from SO ' . $so->no,
                ]);
            }

            $so->status = 'Planning';
            $so->save();

            AuditLog::log('sales_order.planning_generated', 'sales_order', $so->id, $oldValues, ['status' => 'Planning']);

            return $so->load(['customer', 'product', 'items.product', 'demands']);
        });
    }

    /**
     * Lock the active BOM onto every item of a Sales Order.
     * Can be called on Draft or Rejected orders.
     * Returns an array: ['locked' => [...], 'missing' => [...]]
     */
    public function lockBom(SalesOrder $so): array
    {
        if (!in_array($so->status, ['Draft', 'Rejected', 'Submitted', 'Approved'])) {
            throw ValidationException::withMessages([
                'status' => ['BOM hanya bisa dikunci pada Sales Order berstatus Draft, Submitted, atau Approved.']
            ]);
        }

        $locked  = [];
        $missing = [];

        DB::transaction(function () use ($so, &$locked, &$missing) {
            $so->loadMissing('items.product');

            foreach ($so->items as $item) {
                $activeBom = \App\Models\BomHeader::where('product_id', $item->product_id)
                    ->where('status', 'active')
                    ->whereNull('deleted_at')
                    ->first();

                if ($activeBom) {
                    $item->update([
                        'bom_header_id'        => $activeBom->id,
                        'bom_version_snapshot' => $activeBom->version,
                    ]);
                    $locked[] = $item->product_name_snapshot ?? $item->product?->nama ?? "Item #{$item->id}";
                } else {
                    $missing[] = $item->product_name_snapshot ?? $item->product?->nama ?? "Item #{$item->id}";
                }
            }
        });

        AuditLog::log('sales_order.bom_locked', 'sales_order', $so->id, null, [
            'locked'  => $locked,
            'missing' => $missing,
        ]);

        return ['locked' => $locked, 'missing' => $missing];
    }

    /**
     * Helper to prepare snapshots, lock active BOM, set default unit price, and compute estimates.
     */
    public function prepareItemData(Product $product, float $qty, ?float $unitPrice = null): array
    {
        $activeBom = $product->activeBom;
        
        return [
            'product_id'            => $product->id,
            'product_code_snapshot' => $product->kode,
            'product_name_snapshot' => $product->nama,
            'unit_snapshot'         => $product->satuan,
            'bom_header_id'         => $activeBom?->id,
            'bom_version_snapshot'  => $activeBom?->version,
            'unit_price'            => $unitPrice ?? (float) $product->harga,
            'estimated_volume'      => ($product->volume_m3 ?? 0.0) * $qty,
            'estimated_weight'      => ($product->berat ?? 0.0) * $qty,
        ];
    }
}
