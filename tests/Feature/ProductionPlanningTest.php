<?php

namespace Tests\Feature;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\BomHeader;
use App\Models\ProductionDemand;
use App\Models\ProductionPlan;
use App\Models\ProductionBatch;
use App\Models\Mold;
use App\Models\WorkCenter;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductionPlanningTest extends TestCase
{
    use DatabaseTransactions;

    private User $ppicUser;
    private Customer $customer;
    private Product $product;
    private BomHeader $bom;
    private Mold $mold;
    private WorkCenter $workCenter;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create RBAC Roles in Database
        $ppicRole = Role::firstOrCreate(['kode' => 'ppic'], ['nama' => 'PPIC', 'is_active' => true]);

        // 2. Create PPIC User
        $this->ppicUser = User::factory()->create([
            'username' => 'ppic_' . uniqid(),
            'role' => 'ppic',
            'role_id' => $ppicRole->id,
            'is_active' => true,
        ]);

        // 3. Create Customer
        $this->customer = Customer::create([
            'kode' => 'CUST-' . substr(uniqid(), -6),
            'nama' => 'Pemerintah Provinsi DKI Jakarta',
            'tipe' => 'Government',
            'aktif' => true,
        ]);

        // 4. Create Product
        $this->product = Product::create([
            'kode' => 'TEST-BC-' . substr(uniqid(), -6),
            'nama' => 'Box Culvert 100x100cm K-350',
            'kategori' => 'Box Culvert',
            'berat' => 8000.00,
            'volume_m3' => 8.000,
            'harga' => 18000000,
            'satuan' => 'Unit',
            'aktif' => true,
        ]);

        // 5. Create Active BOM for the Product
        $this->bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
            'notes' => 'Active BOM version',
            'output_qty' => 1.0,
            'output_uom' => 'Unit',
            'total_material_cost' => 12000000,
            'total_waste_cost' => 500000,
        ]);

        // 6. Create Mold
        $this->mold = Mold::create([
            'kode' => 'MOLD-' . substr(uniqid(), -6),
            'nama' => 'Box Culvert Mold 100x100',
            'produk' => $this->product->nama,
            'product_id' => $this->product->id,
            'jumlah' => 1,
            'aktif' => 1,
            'kapasitas_per_siklus' => 5, // Capacity = 5
            'siklus_per_hari' => 1,
        ]);

        // 7. Create Work Center
        $this->workCenter = WorkCenter::create([
            'code' => 'LINE-01',
            'name' => 'Production Line 01',
            'capacity_qty_per_shift' => 50,
            'is_active' => true,
        ]);
    }

    /**
     * Test PPIC Confirm Ready (Approve Demand)
     */
    public function test_ppic_can_confirm_ready_demand(): void
    {
        $demand = ProductionDemand::create([
            'demand_number' => 'DEMAND-' . uniqid(),
            'source_type'   => 'Sales Order',
            'product_id'    => $this->product->id,
            'demand_qty'    => 25.00,
            'required_date' => now()->addDays(10)->toDateString(),
            'status'        => 'Open',
        ]);

        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/production-demands/{$demand->id}/approve");

        $response->assertStatus(200);
        $this->assertEquals('Approved', $demand->fresh()->status);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'production_demand.approved',
            'entity_type' => 'production_demand',
            'entity_id'   => $demand->id,
        ]);
    }

    /**
     * Test PPIC Reject Demand
     */
    public function test_ppic_can_reject_demand(): void
    {
        $demand = ProductionDemand::create([
            'demand_number' => 'DEMAND-' . uniqid(),
            'source_type'   => 'Sales Order',
            'product_id'    => $this->product->id,
            'demand_qty'    => 25.00,
            'required_date' => now()->addDays(10)->toDateString(),
            'status'        => 'Open',
        ]);

        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/production-demands/{$demand->id}/reject", [
                'reason' => 'BOM not ready or materials unavailable'
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Cancelled', $demand->fresh()->status);
        $this->assertEquals('BOM not ready or materials unavailable', $demand->fresh()->notes);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'production_demand.rejected',
            'entity_type' => 'production_demand',
            'entity_id'   => $demand->id,
        ]);
    }

    /**
     * Test PPIC Scheduling Dialog and Automatic Batch Generation
     */
    public function test_ppic_can_schedule_demand_and_auto_generate_batches(): void
    {
        $demand = ProductionDemand::create([
            'demand_number' => 'DEMAND-' . uniqid(),
            'source_type'   => 'Sales Order',
            'product_id'    => $this->product->id,
            'demand_qty'    => 23.00, // Demand Qty = 23, Mold Capacity = 5, batches = 5 (4 of 5, 1 of 3)
            'required_date' => now()->addDays(10)->toDateString(),
            'status'        => 'Approved',
        ]);

        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/production-demands/{$demand->id}/schedule", [
                'work_center_id' => $this->workCenter->id,
                'mold_id'        => $this->mold->id,
                'start_date'     => now()->addDays(2)->toDateString(),
                'end_date'       => now()->addDays(5)->toDateString(),
                'shift'          => 'Shift 1',
                'notes'          => 'Scheduled by Test',
            ]);

        $response->assertStatus(201);

        // Verify Plan created
        $plan = ProductionPlan::where('demand_id', $demand->id)->first();
        $this->assertNotNull($plan);
        $this->assertEquals('Scheduled', $plan->status);
        $this->assertEquals(5, $plan->required_batches); // CEIL(23 / 5) = 5
        $this->assertEquals($this->mold->id, $plan->mold_id);
        $this->assertEquals(5, $plan->mold_capacity_per_cycle);

        // Verify Demand status is Planned
        $this->assertEquals('Planned', $demand->fresh()->status);

        // Verify Batches generated
        $batches = ProductionBatch::where('production_plan_id', $plan->id)->orderBy('batch_sequence')->get();
        $this->assertCount(5, $batches);

        // Check Batch Quantities: 4 batches of 5, 1 batch of 3
        $this->assertEquals(5.00, $batches[0]->target_qty);
        $this->assertEquals(5.00, $batches[1]->target_qty);
        $this->assertEquals(5.00, $batches[2]->target_qty);
        $this->assertEquals(5.00, $batches[3]->target_qty);
        $this->assertEquals(3.00, $batches[4]->target_qty);

        // Verify Batch Status is Planning
        foreach ($batches as $batch) {
            $this->assertEquals('Planning', $batch->status);
            $this->assertEquals($this->mold->id, $batch->mold_id);
        }

        // Verify audit logs
        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'production_plan.scheduled',
            'entity_type' => 'production_plan',
            'entity_id'   => $plan->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'production_batch.generated',
            'entity_type' => 'production_batch',
            'entity_id'   => $batches[0]->id,
        ]);
    }

    /**
     * Test Start Planned Batch Directly (Planned -> In Progress)
     */
    public function test_can_start_planned_batch_directly(): void
    {
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-' . uniqid(),
            'source_type'  => 'SO',
            'product_id'   => $this->product->id,
            'target_qty'   => 5.00,
            'status'       => 'Planned',
        ]);

        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/production-batches/{$batch->id}/start");

        $response->assertStatus(200);
        $this->assertEquals('Casting', $batch->fresh()->status);
        $this->assertNotNull($batch->fresh()->actual_start);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'production_batch.started',
            'entity_type' => 'production_batch',
            'entity_id'   => $batch->id,
        ]);
    }

    /**
     * Test delete scheduled plan returns demand to queue
     */
    public function test_delete_scheduled_plan_reverts_demand_status(): void
    {
        $demand = ProductionDemand::create([
            'demand_number' => 'DEMAND-' . uniqid(),
            'source_type'   => 'Sales Order',
            'product_id'    => $this->product->id,
            'demand_qty'    => 10.00,
            'required_date' => now()->addDays(10)->toDateString(),
            'status'        => 'Approved',
        ]);

        // Schedule
        $this->actingAs($this->ppicUser)
            ->postJson("/api/production-demands/{$demand->id}/schedule", [
                'work_center_id' => $this->workCenter->id,
                'mold_id'        => $this->mold->id,
                'start_date'     => now()->addDays(2)->toDateString(),
                'end_date'       => now()->addDays(5)->toDateString(),
                'shift'          => 'Shift 1',
            ]);

        $this->assertEquals('Planned', $demand->fresh()->status);
        $plan = ProductionPlan::where('demand_id', $demand->id)->first();
        $this->assertNotNull($plan);

        // Delete Plan
        $response = $this->actingAs($this->ppicUser)
            ->deleteJson("/api/production-plans/{$plan->id}");

        $response->assertStatus(200);

        // Verify Demand is returned to Approved
        $this->assertEquals('Approved', $demand->fresh()->status);

        // Verify Batches are deleted
        $this->assertEquals(0, ProductionBatch::where('production_plan_id', $plan->id)->count());
    }

    /**
     * Test Gantt Calendar and Dashboard stats endpoints
     */
    public function test_can_retrieve_calendar_data_and_stats(): void
    {
        // 1. Check stats
        $statsResponse = $this->actingAs($this->ppicUser)
            ->getJson("/api/production-plans/stats");

        $statsResponse->assertStatus(200);
        $statsResponse->assertJsonStructure([
            'demand_open', 'demand_approved', 'demand_planned',
            'batch_planning', 'batch_active', 'batch_finished', 'batch_delivered',
            'total_scheduled_qty', 'mold_utilization_pct', 'line_utilization_pct', 'late_demand_count'
        ]);

        // 2. Check calendar
        $calResponse = $this->actingAs($this->ppicUser)
            ->getJson("/api/production-plans/calendar?from=" . now()->toDateString() . "&to=" . now()->addDays(30)->toDateString());

        $calResponse->assertStatus(200);
        $calResponse->assertJsonStructure([
            '*' => [
                'resource', 'start', 'end', 'qty', 'customer', 'sales_order'
            ]
        ]);
    }
}
