<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Material;
use App\Models\BomHeader;
use App\Models\BomItem;
use App\Models\WorkCenter;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\ProductionDemand;
use App\Models\ProductionPlan;
use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use App\Models\InventoryBatch;
use App\Models\BatchStatus;
use App\Services\BatchTransitionService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;

class StandardCostingFoundationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Product $product;
    protected Material $material;
    protected BomHeader $bom;
    protected WorkCenter $workCenter;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a super_admin user
        $this->user = User::factory()->create([
            'username' => 'cost_admin_' . uniqid(),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // 2. Create Product
        $this->product = Product::create([
            'kode' => 'PRD-CST-' . rand(10000, 99999),
            'nama' => 'Costing Test Product',
            'volume_m3' => 0.5,
            'aktif' => true
        ]);

        // 3. Create Material
        $this->material = Material::create([
            'kode' => 'MAT-CST-' . rand(10000, 99999),
            'nama' => 'Costing Test Cement',
            'satuan' => 'Kg',
            'kategori' => 'Semen',
            'stok' => 10000,
            'min_stok' => 500,
            'harga' => 2000,
            'aktif' => true,
        ]);

        // 4. Create BOM
        $this->bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
            'output_qty' => 1.0,
            'output_uom' => 'pcs',
        ]);

        // Create BOM Item (10 kg of cement per unit product with 5% waste)
        BomItem::create([
            'bom_header_id'  => $this->bom->id,
            'material_id'    => $this->material->id,
            'qty_per_unit'   => 10.0,
            'waste_pct'      => 5.0, // 5% waste
            'urutan'         => 1,
            'harga_snapshot' => 2000, // semen rate
        ]);

        // Recalculate BOM totals
        $this->bom->recalculateTotals();

        // 5. Create Work Center
        $this->workCenter = WorkCenter::create([
            'code' => 'WC-CST-' . rand(1000, 9999),
            'name' => 'Costing Work Center',
            'standard_labor_rate_per_m3' => 50000.00,
            'standard_overhead_rate_per_m3' => 100000.00,
            'capacity_qty_per_shift' => 10.0,
            'capacity_m3_per_shift' => 5.0,
            'shifts_per_day' => 1,
            'is_active' => true,
        ]);
    }

    public function test_mto_costing_takes_snapshot_from_so_item_on_release()
    {
        // Create Sales Order
        $so = SalesOrder::create([
            'no' => 'SO-CST-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => 1,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 500000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
            'order_date' => now(),
        ]);

        $soItem = SalesOrderItem::create([
            'sales_order_id' => $so->id,
            'product_id' => $this->product->id,
            'qty_ordered' => 5,
            'qty_to_produce' => 5,
            'bom_header_id' => $this->bom->id,
            'bom_version_snapshot' => $this->bom->version,
            'product_code_snapshot' => $this->product->kode,
            'product_name_snapshot' => $this->product->nama,
            'unit_snapshot' => 'pcs',
        ]);

        $demand = ProductionDemand::create([
            'demand_number' => 'DEM-CST-' . uniqid(),
            'source_type' => 'Sales Order',
            'sales_order_id' => $so->id,
            'sales_order_item_id' => $soItem->id,
            'product_id' => $this->product->id,
            'demand_qty' => 5,
            'required_date' => now()->addDays(5),
            'priority' => 1,
            'status' => 'Open',
        ]);

        $plan = ProductionPlan::create([
            'plan_number' => 'PLAN-CST-' . uniqid(),
            'plan_level' => 'Daily',
            'period_start' => now(),
            'period_end' => now(),
            'product_id' => $this->product->id,
            'planned_qty' => 5,
            'planned_volume_m3' => 2.5,
            'demand_id' => $demand->id,
            'status' => 'Scheduled',
            'daily_capacity' => 10,
            'required_days' => 1,
        ]);

        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-CST-' . uniqid(),
            'production_plan_id' => $plan->id,
            'demand_id' => $demand->id,
            'sales_order_id' => $so->id,
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 5,
            'target_volume_m3' => 2.5,
            'work_center_id' => $this->workCenter->id,
            'planned_date' => now(),
        ]);

        // Retrieve status IDs
        $planningStatus = DB::table('global.production_batch_statuses')->where('status', 'Planning')->first();
        $castingStatus = DB::table('global.production_batch_statuses')->where('status', 'Casting')->first();

        $batch->update(['batch_status_id' => $planningStatus->id]);

        // Transition from Planning to Casting (Release)
        $transitionService = app(BatchTransitionService::class);
        $transitionService->transition($batch, $castingStatus->id, 'Releasing batch to production');

        $batch = $batch->fresh(['cost']);

        // Verify snapshot values
        $this->assertEquals($this->bom->id, $batch->bom_header_id);
        $this->assertEquals('V1.0', $batch->bom_version_snapshot);
        $this->assertEquals(50000.00, $batch->labor_rate_snapshot);
        $this->assertEquals(100000.00, $batch->overhead_rate_snapshot);

        // Verify cost calculation:
        // sem_price = 2000, qty_per_unit = 10, waste = 5% => per unit semen cost = 2000 * 10 * 1.05 = 21000
        // Target Qty = 5 => Material Cost = 21000 * 5 = 105000
        // Target Volume = 2.5 => Labor Cost = 2.5 * 50000 = 125000
        // Target Volume = 2.5 => Overhead Cost = 2.5 * 100000 = 250000
        // Total Cost = 105000 + 125000 + 250000 = 480000
        // Cost per unit = 480000 / 5 = 96000
        // Cost per m3 = 480000 / 2.5 = 192000

        $this->assertNotNull($batch->cost);
        $this->assertEquals(105000, (float) $batch->cost->material_cost);
        $this->assertEquals(125000, (float) $batch->cost->labor_cost);
        $this->assertEquals(250000, (float) $batch->cost->overhead_cost);
        $this->assertEquals(480000, (float) $batch->cost->total_cost);
        $this->assertEquals(96000, (float) $batch->cost->cost_per_unit);
        $this->assertEquals(192000, (float) $batch->cost->cost_per_m3);
    }

    public function test_mts_costing_takes_snapshot_from_active_bom_on_release()
    {
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-CST-MTS-' . uniqid(),
            'source_type' => 'MTS',
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'target_volume_m3' => 5.0,
            'work_center_id' => $this->workCenter->id,
            'planned_date' => now(),
        ]);

        $planningStatus = DB::table('global.production_batch_statuses')->where('status', 'Planning')->first();
        $castingStatus = DB::table('global.production_batch_statuses')->where('status', 'Casting')->first();

        $batch->update(['batch_status_id' => $planningStatus->id]);

        // Transition from Planning to Casting (Release)
        $transitionService = app(BatchTransitionService::class);
        $transitionService->transition($batch, $castingStatus->id, 'Releasing MTS batch');

        $batch = $batch->fresh(['cost']);

        // Verify snapshot values
        $this->assertEquals($this->bom->id, $batch->bom_header_id);
        $this->assertEquals('V1.0', $batch->bom_version_snapshot);

        // Verify calculation for 10 units and 5.0 m3
        // Material Cost = 21000 * 10 = 210000
        // Labor Cost = 5.0 * 50000 = 250000
        // Overhead Cost = 5.0 * 100000 = 500000
        // Total Cost = 210000 + 250000 + 500000 = 960000
        // Cost per unit = 960000 / 10 = 96000
        // Cost per m3 = 960000 / 5.0 = 192000

        $this->assertNotNull($batch->cost);
        $this->assertEquals(210000, (float) $batch->cost->material_cost);
        $this->assertEquals(250000, (float) $batch->cost->labor_cost);
        $this->assertEquals(500000, (float) $batch->cost->overhead_cost);
        $this->assertEquals(960000, (float) $batch->cost->total_cost);
    }

    public function test_historical_cost_integrity_after_bom_update()
    {
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-CST-HIST-' . uniqid(),
            'source_type' => 'MTS',
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'target_volume_m3' => 5.0,
            'work_center_id' => $this->workCenter->id,
            'planned_date' => now(),
        ]);

        $planningStatus = DB::table('global.production_batch_statuses')->where('status', 'Planning')->first();
        $castingStatus = DB::table('global.production_batch_statuses')->where('status', 'Casting')->first();

        $batch->update(['batch_status_id' => $planningStatus->id]);

        // Transition from Planning to Casting (Release)
        $transitionService = app(BatchTransitionService::class);
        $transitionService->transition($batch, $castingStatus->id, 'Releasing historical check batch');

        $batch = $batch->fresh(['cost']);
        $originalTotalCost = (float) $batch->cost->total_cost;

        // Verify original total is 960000
        $this->assertEquals(960000, $originalTotalCost);

        // Now, update active BOM Item to a higher price (semen rate goes up to 5000)
        $bomItem = $this->bom->items->first();
        $bomItem->update([
            'harga_snapshot' => 5000,
        ]);
        $this->bom->recalculateTotals();

        // Calculate cost for a new batch (should use the new price)
        $newBatch = ProductionBatch::create([
            'batch_number' => 'BATCH-CST-NEW-' . uniqid(),
            'source_type' => 'MTS',
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'target_volume_m3' => 5.0,
            'work_center_id' => $this->workCenter->id,
            'planned_date' => now(),
        ]);
        $newBatch->update(['batch_status_id' => $planningStatus->id]);
        $transitionService->transition($newBatch, $castingStatus->id, 'Releasing new batch with updated pricing');

        $newBatch = $newBatch->fresh(['cost']);
        $newTotalCost = (float) $newBatch->cost->total_cost;

        // Verify new cost is higher:
        // New material cost per unit = 5000 * 10 * 1.05 = 52500
        // Material Cost for 10 units = 525000
        // Labor = 250000, Overhead = 500000
        // Total = 525000 + 250000 + 500000 = 1275000
        $this->assertEquals(1275000, $newTotalCost);

        // Assert that the original historical batch cost did NOT change!
        $batch = $batch->fresh(['cost']);
        $this->assertEquals($originalTotalCost, (float) $batch->cost->total_cost);
    }

    public function test_inventory_cost_carry_forward_on_batch_completion()
    {
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-CST-CF-' . uniqid(),
            'source_type' => 'MTS',
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'target_volume_m3' => 5.0,
            'work_center_id' => $this->workCenter->id,
            'planned_date' => now(),
        ]);

        $statuses = DB::table('global.production_batch_statuses')->where('aktif', true)->orderBy('urutan')->get();
        
        $planningStatus = $statuses->firstWhere('status', 'Planning');
        $castingStatus = $statuses->firstWhere('status', 'Casting');
        $demoldingStatus = $statuses->firstWhere('status', 'Demolding');
        $qcStatus = $statuses->firstWhere('status', 'QC');
        $finishedStatus = $statuses->firstWhere('status', 'Finished');

        $batch->update(['batch_status_id' => $planningStatus->id]);

        $transitionService = app(BatchTransitionService::class);
        
        // Sequential transitions: Planning -> Casting -> Demolding -> QC -> Finished
        $batch = $transitionService->transition($batch, $castingStatus->id, 'Casting started');
        $batch = $batch->fresh(['statusModel']);
        $batch = $transitionService->transition($batch, $demoldingStatus->id, 'Demolded');
        $batch = $batch->fresh(['statusModel']);
        $batch = $transitionService->transition($batch, $qcStatus->id, 'QC checking');
        $batch = $batch->fresh(['statusModel']);
        $batch = $transitionService->transition($batch, $finishedStatus->id, 'QC passed, batch completed');

        $batch = $batch->fresh(['cost']);
        
        // Retrieve inventory lot batch created
        $inventoryBatch = InventoryBatch::where('batch_number', $batch->batch_number)->first();
        
        $this->assertNotNull($inventoryBatch);
        $this->assertEquals($batch->id, $inventoryBatch->production_batch_id);
        $this->assertEquals((float) $batch->cost->total_cost, (float) $inventoryBatch->total_cost);
        $this->assertEquals((float) $batch->cost->cost_per_unit, (float) $inventoryBatch->cost_per_unit);
        $this->assertEquals((float) $batch->cost->cost_per_m3, (float) $inventoryBatch->cost_per_m3);
    }
}
