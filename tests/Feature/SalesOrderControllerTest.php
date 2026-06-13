<?php

namespace Tests\Feature;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\BomHeader;
use App\Models\ProductionDemand;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SalesOrderControllerTest extends TestCase
{
    use DatabaseTransactions;

    private User $salesUser;
    private User $managerUser;
    private User $ppicUser;
    private Customer $customer;
    private Product $product;
    private BomHeader $bom;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create RBAC Roles in Database if not already there
        $salesRole = Role::firstOrCreate(['kode' => 'sales'], ['nama' => 'Sales', 'is_active' => true]);
        $managerRole = Role::firstOrCreate(['kode' => 'manager'], ['nama' => 'Manager', 'is_active' => true]);
        $ppicRole = Role::firstOrCreate(['kode' => 'ppic'], ['nama' => 'PPIC', 'is_active' => true]);

        // 2. Create Users
        $this->salesUser = User::factory()->create([
            'username' => 'sales_' . uniqid(),
            'role' => 'sales',
            'role_id' => $salesRole->id,
            'is_active' => true,
        ]);

        $this->managerUser = User::factory()->create([
            'username' => 'manager_' . uniqid(),
            'role' => 'manager',
            'role_id' => $managerRole->id,
            'is_active' => true,
        ]);

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
            'kontak_nama' => 'Budi Santoso',
            'kontak_telepon' => '08123456789',
            'alamat' => 'Jl. Medan Merdeka Selatan No. 8-9',
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

        $material = \App\Models\Material::create([
            'kode' => 'MAT-TEST-' . substr(uniqid(), -6),
            'nama' => 'Semen Portland Test',
            'satuan' => 'kg',
            'kategori' => 'Raw Material',
            'harga' => 1200,
            'aktif' => true,
        ]);

        \App\Models\BomItem::create([
            'bom_header_id' => $this->bom->id,
            'material_id' => $material->id,
            'qty_per_unit' => 10.00,
            'waste_pct' => 0.00,
            'harga_snapshot' => 1200,
            'material_type' => 'Raw Material',
        ]);
    }

    /**
     * Test sales order creation with automatic snapshots and estimates.
     */
    public function test_can_create_sales_order_with_snapshots_and_estimates(): void
    {
        $soNo = 'SO-' . uniqid();
        $payload = [
            'no' => $soNo,
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'nilai' => 180000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(30)->toDateString(),
            'prioritas' => 'Tinggi',
            'catatan' => 'Deliver immediately',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'qty_ordered' => 10,
                    'unit_price' => 18000000,
                    'notes' => 'Item 1 notes',
                ]
            ]
        ];

        $response = $this->actingAs($this->salesUser)
            ->postJson('/api/sales-orders', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'Draft');

        $returnedNo = $response->json('no');

        // Check snapshots inside database
        $this->assertDatabaseHas('public.production_sales_orders', [
            'no' => $returnedNo,
            'status' => 'Draft',
        ]);

        $this->assertDatabaseHas('public.production_sales_order_items', [
            'product_code_snapshot' => $this->product->kode,
            'product_name_snapshot' => 'Box Culvert 100x100cm K-350',
            'unit_snapshot' => 'Unit',
            'bom_header_id' => $this->bom->id,
            'bom_version_snapshot' => 'V1.0',
            'estimated_volume' => 80.000, // 8.000 * 10
            'estimated_weight' => 80000.00, // 8000 * 10
            'unit_price' => 18000000.00,
        ]);

        // Check AuditLog is created
        $this->assertDatabaseHas('global.audit_logs', [
            'action' => 'sales_order.created',
            'entity_type' => 'sales_order',
            'user_id' => $this->salesUser->id,
        ]);
    }

    /**
     * Test draft submission.
     */
    public function test_can_submit_sales_order(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Draft',
        ]);

        $response = $this->actingAs($this->salesUser)
            ->postJson("/api/sales-orders/{$so->id}/submit");

        $response->assertStatus(200);
        $this->assertEquals('Submitted', $so->fresh()->status);

        // Check AuditLog
        $this->assertDatabaseHas('global.audit_logs', [
            'action' => 'sales_order.submitted',
            'entity_type' => 'sales_order',
            'entity_id' => $so->id,
        ]);
    }

    /**
     * Test manager approval and rejection.
     */
    public function test_manager_can_approve_submitted_sales_order(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Submitted',
        ]);

        $response = $this->actingAs($this->managerUser)
            ->postJson("/api/sales-orders/{$so->id}/confirm");

        $response->assertStatus(200);
        $this->assertEquals('Approved', $so->fresh()->status);

        // Check AuditLog
        $this->assertDatabaseHas('global.audit_logs', [
            'action' => 'sales_order.approved',
            'entity_type' => 'sales_order',
            'entity_id' => $so->id,
        ]);
    }

    public function test_manager_can_reject_submitted_sales_order_with_reason(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Submitted',
        ]);

        $response = $this->actingAs($this->managerUser)
            ->postJson("/api/sales-orders/{$so->id}/reject", [
                'reason' => 'Harga terlalu murah',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Rejected', $so->fresh()->status);

        // Check AuditLog holds rejection reason
        $log = AuditLog::where('action', 'sales_order.rejected')
            ->where('entity_id', $so->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals('Harga terlalu murah', $log->new_values['reason']);
    }

    /**
     * Test demand generation by PPIC.
     */
    public function test_ppic_can_generate_demands_for_approved_so(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Approved',
        ]);

        $item = SalesOrderItem::create([
            'sales_order_id' => $so->id,
            'product_id' => $this->product->id,
            'qty_ordered' => 5.00,
            'unit_price' => 18000000.00,
            'delivery_date' => $so->tgl_kirim,
            'bom_header_id' => $this->bom->id,
            'bom_version_snapshot' => 'V1.0',
            'product_code_snapshot' => 'BC-1010-K350',
            'product_name_snapshot' => 'Box Culvert 100x100cm K-350',
            'unit_snapshot' => 'Unit',
        ]);

        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/sales-orders/{$so->id}/generate-demands");

        $response->assertStatus(200);
        $this->assertEquals('Planning', $so->fresh()->status);

        // Check production demand is created
        $this->assertDatabaseHas('public.production_demands', [
            'sales_order_id' => $so->id,
            'sales_order_item_id' => $item->id,
            'source_type' => 'Sales Order',
            'demand_qty' => 5.00,
            'status' => 'Open',
        ]);

        // Attempting to generate again should trigger duplicate demand protection error
        $duplicateResponse = $this->actingAs($this->ppicUser)
            ->postJson("/api/sales-orders/{$so->id}/generate-demands");

        $duplicateResponse->assertStatus(422);
    }

    /**
     * Verify RBAC validations.
     */
    public function test_rbac_prevents_unauthorized_actions(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Submitted',
        ]);

        // Sales user cannot approve
        $response = $this->actingAs($this->salesUser)
            ->postJson("/api/sales-orders/{$so->id}/confirm");
        $response->assertStatus(403);

        // PPIC user cannot approve
        $response = $this->actingAs($this->ppicUser)
            ->postJson("/api/sales-orders/{$so->id}/confirm");
        $response->assertStatus(403);

        // Sales user cannot generate demand
        $response = $this->actingAs($this->salesUser)
            ->postJson("/api/sales-orders/{$so->id}/generate-demands");
        $response->assertStatus(403);
    }

    /**
     * Test sales order status automatically syncs with production batches progress.
     */
    public function test_sales_order_status_syncs_with_production_batches(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-SYNC-' . uniqid(),
            'so_type' => 'MTO',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 90000000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(15)->toDateString(),
            'status' => 'Planning',
        ]);

        $demand = ProductionDemand::create([
            'demand_number' => 'DEMAND-' . uniqid(),
            'source_type' => 'Sales Order',
            'sales_order_id' => $so->id,
            'product_id' => $this->product->id,
            'demand_qty' => 5.00,
            'required_date' => $so->tgl_kirim,
            'status' => 'Open',
        ]);

        // Create first batch in Planning
        $batch = \App\Models\ProductionBatch::create([
            'batch_number' => 'BATCH-' . uniqid(),
            'demand_id' => $demand->id,
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 5.00,
            'status' => 'Planning',
        ]);

        // Sales order should remain in Planning status
        $this->assertEquals('Planning', $so->fresh()->status);

        // Update batch to Casting (Production status)
        $batch->update(['status' => 'Casting']);
        $this->assertEquals('Production', $so->fresh()->status);

        // Update batch to Finished (Completed status)
        $batch->update(['status' => 'Finished']);
        $this->assertEquals('Completed', $so->fresh()->status);

        // Update batch to Delivered (Delivered status)
        $batch->update(['status' => 'Delivered']);
        $this->assertEquals('Delivered', $so->fresh()->status);
    }
}
