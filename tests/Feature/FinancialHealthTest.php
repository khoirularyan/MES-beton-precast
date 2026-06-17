<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\BomHeader;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\ProductionPlan;
use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FinancialHealthTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminUser;
    private Product $product;
    private BomHeader $bom;
    private \App\Models\Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['kode' => 'admin'], ['nama' => 'Admin', 'is_active' => true]);

        $this->adminUser = User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => 'admin',
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        $this->customer = \App\Models\Customer::create([
            'kode' => 'CUST-TEST-' . substr(uniqid(), -6),
            'nama' => 'Test Customer',
            'aktif' => true,
        ]);

        $this->product = Product::create([
            'kode' => 'TEST-PROD-' . substr(uniqid(), -6),
            'nama' => 'Test Product precast',
            'kategori' => 'Panel Beton',
            'berat' => 1000.0,
            'volume_m3' => 1.0,
            'harga' => 500000,
            'satuan' => 'Unit',
            'aktif' => true,
        ]);

        $this->bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
            'notes' => 'Active BOM',
            'output_qty' => 1.0,
            'output_uom' => 'Unit',
            'total_material_cost' => 300000,
            'overhead_pct' => 10,
        ]);
    }

    /**
     * Test command repair of missing BOM snapshots
     */
    public function test_repair_bom_snapshots_command(): void
    {
        // Create batch with null bom_header_id
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-TEST-REP',
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 10.0,
            'planned_date' => now()->toDateString(),
            'bom_header_id' => null,
            'batch_status_id' => 1,
        ]);

        // Create SO item with null bom_header_id
        $so = SalesOrder::create([
            'no' => 'SO-TEST-REP',
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 2500000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
        ]);

        $soItem = SalesOrderItem::create([
            'sales_order_id' => $so->id,
            'product_id' => $this->product->id,
            'qty_ordered' => 5.0,
            'unit_price' => 500000.0,
            'bom_header_id' => null,
        ]);

        // Run command costing:repair-bom-snapshots
        $this->artisan('costing:repair-bom-snapshots')
            ->assertExitCode(0);

        // Check if values were repaired
        $this->assertEquals($this->bom->id, $batch->fresh()->bom_header_id);
        $this->assertEquals($this->bom->id, $soItem->fresh()->bom_header_id);
    }

    /**
     * Test command dry run does not modify database
     */
    public function test_repair_bom_snapshots_dry_run(): void
    {
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-TEST-DRY',
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 10.0,
            'planned_date' => now()->toDateString(),
            'bom_header_id' => null,
            'batch_status_id' => 1,
        ]);

        $this->artisan('costing:repair-bom-snapshots', ['--dry-run' => true])
            ->assertExitCode(0);

        $this->assertNull($batch->fresh()->bom_header_id);
    }

    /**
     * Test Financial Health endpoint
     */
    public function test_financial_health_endpoint(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/dashboard/financial-health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'revenue_readiness',
                'cost_readiness',
                'margin_readiness',
                'pipeline_readiness',
                'finished_batches',
                'batches_with_actual_cost',
                'batches_without_cost',
                'actual_cost_ratio',
                'estimated_cost_ratio',
                'batches_without_bom',
                'so_items_without_bom',
            ]);
    }

    /**
     * Test dashboard payload financial metadata
     */
    public function test_dashboard_metadata_payload(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'financial',
                'financial_metadata' => [
                    'revenue_source',
                    'cost_source',
                    'cost_confidence',
                    'actual_cost_ratio',
                    'estimated_cost_ratio',
                    'last_calculated_at',
                ],
                'financial_warnings',
            ]);
    }
}
