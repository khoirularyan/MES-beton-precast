<?php

namespace App\Services;

use App\Models\ProductionDemand;
use App\Models\BomHeader;
use App\Models\Material;
use Illuminate\Support\Collection;

class MaterialRequirementService
{
    /**
     * Calculate material requirements for a single demand.
     */
    public function calculateRequirementsForDemand(ProductionDemand $demand): Collection
    {
        return $this->calculateRequirements($demand->product_id, $demand->demand_qty);
    }

    /**
     * Calculate material requirements for a product and quantity.
     * Returns a collection of arrays with keys:
     * - material_id
     * - material_kode
     * - material_nama
     * - kategori
     * - satuan
     * - required_qty
     * - available_qty
     * - shortage_qty
     */
    public function calculateRequirements(int $productId, float $quantity): Collection
    {
        $requirements = collect();

        // 1. Get active BOM for the product
        $activeBom = BomHeader::where('product_id', $productId)
            ->where('status', 'active')
            ->first();

        if (!$activeBom) {
            return $requirements;
        }

        // 2. Iterate through BOM items
        foreach ($activeBom->items as $item) {
            $material = $item->material;
            if (!$material) {
                continue;
            }

            // Calculation formula: Qty Per Unit * Demand Qty * (1 + waste_pct/100)
            $qtyPerUnit = (float) $item->qty_per_unit;
            $wastePct = (float) ($item->waste_pct ?? 0.0);
            
            $outputQty = (float) ($activeBom->output_qty ?? 1.0);
            if ($outputQty <= 0) {
                $outputQty = 1.0;
            }

            $requiredQty = ($qtyPerUnit / $outputQty) * $quantity * (1.0 + ($wastePct / 100.0));

            // 3. Get available quantity from inventory (using the dynamic accessor)
            $availableQty = (float) $material->stok;

            // 4. Calculate shortage
            $shortageQty = max(0.0, $requiredQty - $availableQty);

            // Group by material if multiple BOM items use the same material
            $key = $material->id;
            if ($requirements->has($key)) {
                $existing = $requirements->get($key);
                $newRequired = $existing['required_qty'] + $requiredQty;
                $newShortage = max(0.0, $newRequired - $availableQty);
                $requirements->put($key, array_merge($existing, [
                    'required_qty' => $newRequired,
                    'shortage_qty' => $newShortage,
                ]));
            } else {
                $requirements->put($key, [
                    'material_id'   => $material->id,
                    'material_kode' => $material->kode,
                    'material_nama' => $material->nama,
                    'kategori'      => $material->kategori,
                    'satuan'        => $material->satuan,
                    'required_qty'  => $requiredQty,
                    'available_qty' => $availableQty,
                    'shortage_qty'  => $shortageQty,
                ]);
            }
        }

        return $requirements->values();
    }
}
