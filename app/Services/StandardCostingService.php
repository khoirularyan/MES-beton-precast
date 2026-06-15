<?php

namespace App\Services;

use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use App\Models\BomHeader;
use App\Models\SalesOrderItem;
use Illuminate\Support\Facades\DB;

class StandardCostingService
{
    public function calculateAndStore(ProductionBatch $batch): void
    {
        // 1. Resolve BOM Version Lock
        $bomHeaderId = null;
        $bomVersionSnapshot = null;

        if ($batch->source_type === 'SO') {
            // Retrieve from Sales Order Item via Demand
            $demand = $batch->demand;
            if ($demand && $demand->sales_order_item_id) {
                $item = SalesOrderItem::find($demand->sales_order_item_id);
                if ($item) {
                    $bomHeaderId = $item->bom_header_id;
                    $bomVersionSnapshot = $item->bom_version_snapshot;
                }
            }

            // Fallback: search by sales_order_id and product_id on SalesOrderItem
            if (!$bomHeaderId && $batch->sales_order_id) {
                $item = SalesOrderItem::where('sales_order_id', $batch->sales_order_id)
                    ->where('product_id', $batch->product_id)
                    ->first();
                if ($item) {
                    $bomHeaderId = $item->bom_header_id;
                    $bomVersionSnapshot = $item->bom_version_snapshot;
                }
            }
        }

        // MTS / Fallback: Retrieve active BOM from product
        if (!$bomHeaderId) {
            $activeBom = BomHeader::where('product_id', $batch->product_id)
                ->active()
                ->first();
            if ($activeBom) {
                $bomHeaderId = $activeBom->id;
                $bomVersionSnapshot = $activeBom->version;
            }
        }

        // 2. Resolve Rates from Work Center
        $laborRate = 0;
        $overheadRate = 0;

        if ($batch->workCenter) {
            $laborRate = (float) $batch->workCenter->standard_labor_rate_per_m3;
            $overheadRate = (float) $batch->workCenter->standard_overhead_rate_per_m3;
        }

        // Snapshot details to ProductionBatch
        $batch->update([
            'bom_header_id'          => $bomHeaderId,
            'bom_version_snapshot'   => $bomVersionSnapshot,
            'labor_rate_snapshot'    => $laborRate,
            'overhead_rate_snapshot' => $overheadRate,
        ]);

        // 3. Calculate Material Cost
        $materialCostPerUnit = 0.0;
        if ($bomHeaderId) {
            $bom = BomHeader::with('items')->find($bomHeaderId);
            if ($bom) {
                foreach ($bom->items as $item) {
                    // Formula: Material Cost per unit = sum(qty_per_unit * harga_snapshot * (1 + waste_pct/100))
                    $itemCost = (float) $item->qty_per_unit * (float) $item->harga_snapshot;
                    $wasteCost = $itemCost * ((float) $item->waste_pct / 100.0);
                    $materialCostPerUnit += ($itemCost + $wasteCost);
                }
            }
        }

        $targetQty = (float) $batch->target_qty;
        $product = $batch->product;
        $volumeM3 = (float) $batch->target_volume_m3 ?: (($product->volume_m3 ?? 0.0) * $targetQty);

        // If target_volume_m3 was null, update it on the batch for consistency
        if (!$batch->target_volume_m3 && $volumeM3 > 0) {
            $batch->update(['target_volume_m3' => $volumeM3]);
        }

        $materialCostTotal = $materialCostPerUnit * $targetQty;
        $laborCostTotal = $volumeM3 * $laborRate;
        $overheadCostTotal = $volumeM3 * $overheadRate;
        $totalCost = $materialCostTotal + $laborCostTotal + $overheadCostTotal;

        $costPerUnit = $targetQty > 0 ? $totalCost / $targetQty : 0.0;
        $costPerM3 = $volumeM3 > 0 ? $totalCost / $volumeM3 : 0.0;

        // 4. Update or Create ProductionCost
        ProductionCost::updateOrCreate(
            ['production_batch_id' => $batch->id],
            [
                'material_cost'           => $materialCostTotal,
                'labor_cost'              => $laborCostTotal,
                'overhead_cost'           => $overheadCostTotal,
                'total_cost'              => $totalCost,
                'cost_per_unit'           => $costPerUnit,
                'cost_per_m3'             => $costPerM3,

                // Sync for backward compatibility
                'estimated_material_cost' => $materialCostTotal,
                'estimated_labor_cost'    => $laborCostTotal,
                'estimated_overhead_cost' => $overheadCostTotal,
            ]
        );
    }
}
