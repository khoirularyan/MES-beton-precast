<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Material;
use App\Models\BomHeader;
use App\Models\BomItem;
use App\Models\ProductionPlan;
use App\Models\ProductionBatch;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;

class ProductionPlanningEnhancementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Product $product;
    protected Material $material;
    protected BomHeader $bom;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a super_admin user to bypass RBAC
        $this->user = User::factory()->create([
            'username' => 'plan_admin_' . uniqid(),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // 2. Create Product
        $this->product = Product::create([
            'kode' => 'PRD-' . rand(10000, 99999),
            'nama' => 'Plan Test Product',
            'volume_m3' => 0.5,
            'aktif' => true
        ]);

        // 3. Create Material
        $this->material = Material::create([
            'kode' => 'MAT-' . rand(10000, 99999),
            'nama' => 'Plan Test Cement',
            'satuan' => 'Kg',
            'kategori' => 'Semen',
            'stok' => 8000, // Seed 8000 Kg
            'min_stok' => 1000,
            'harga' => 1500,
            'aktif' => true,
        ]);

        // 4. Create BOM
        $this->bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1',
            'status' => 'active',
            'output_qty' => 1.0,
            'output_uom' => 'pcs',
        ]);

        // Create BOM Item (10 kg of cement per unit product with 0% waste)
        BomItem::create([
            'bom_header_id' => $this->bom->id,
            'material_id'   => $this->material->id,
            'qty_per_unit'  => 10.0,
            'waste_pct'     => 0.0,
            'urutan'        => 1,
        ]);
    }

    public function test_material_readiness_calculation()
    {
        // Require 100 pcs -> needs 1000 Kg cement. Available is 8000 Kg. Shortage = 0.
        $response = $this->actingAs($this->user)->getJson('/api/planning/material-readiness?' . http_build_query([
            'product_id' => $this->product->id,
            'qty'        => 100,
        ]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'materials' => [
                '*' => ['material', 'required_qty', 'available_qty', 'shortage_qty', 'satuan', 'status']
            ],
            'has_shortage'
        ]);

        $this->assertFalse($response->json('has_shortage'));
        
        $materials = $response->json('materials');
        $this->assertCount(1, $materials);
        $this->assertEquals(1000.0, $materials[0]['required_qty']);
        $this->assertEquals(8000.0, $materials[0]['available_qty']);
        $this->assertEquals(0.0, $materials[0]['shortage_qty']);
        $this->assertEquals('READY', $materials[0]['status']);
    }

    public function test_material_readiness_shortage_detection()
    {
        // Require 1000 pcs -> needs 10000 Kg cement. Available is 8000 Kg. Shortage = 2000 Kg.
        $response = $this->actingAs($this->user)->getJson('/api/planning/material-readiness?' . http_build_query([
            'product_id' => $this->product->id,
            'qty'        => 1000,
        ]));

        $response->assertStatus(200);
        $this->assertTrue($response->json('has_shortage'));

        $materials = $response->json('materials');
        $this->assertEquals(10000.0, $materials[0]['required_qty']);
        $this->assertEquals(8000.0, $materials[0]['available_qty']);
        $this->assertEquals(2000.0, $materials[0]['shortage_qty']);
        $this->assertEquals('SHORTAGE', $materials[0]['status']);
    }

    public function test_mps_summary_aggregation()
    {
        // 1. Create a Production Plan in the current month
        $plan = ProductionPlan::create([
            'plan_number'        => 'PLN-' . rand(10000, 99999),
            'plan_level'         => 'MPS',
            'period_start'       => now()->startOfMonth()->toDateString(),
            'period_end'         => now()->endOfMonth()->toDateString(),
            'product_id'         => $this->product->id,
            'planned_qty'        => 1000,
            'planned_volume_m3'  => 500.0, // 1000 * 0.5
            'status'             => 'Scheduled',
        ]);

        // 2. Fetch finished status ID
        $finishedStatus = DB::table('global.production_batch_statuses')
            ->where('status', 'Finished')
            ->first() ?: DB::table('global.production_batch_statuses')->orderBy('urutan', 'desc')->first();

        // 3. Create a completed Production Batch under the plan
        $batch = ProductionBatch::create([
            'batch_number'       => 'BTC-' . rand(10000, 99999),
            'production_plan_id' => $plan->id,
            'source_type'        => 'SO',
            'product_id'         => $this->product->id,
            'target_qty'         => 10,
            'actual_qty'         => 8, // Completed 8 units -> 8 * 0.5 = 4.0 m3
            'target_volume_m3'   => 5.0,
            'batch_status_id'    => $finishedStatus->id,
            'actual_end'         => now()->toDateTimeString(),
        ]);

        $finishedStatusIds = DB::table('global.production_batch_statuses')
            ->whereIn('status', ['Finished', 'Delivered'])
            ->pluck('id');

        $log = [];
        $log[] = "FINISHED STATUS ID: " . $finishedStatus->id;
        $log[] = "FINISHED STATUS IDS IN DB: " . json_encode($finishedStatusIds->toArray());

        // Request MPS Summary
        $response = $this->actingAs($this->user)->getJson('/api/planning/mps-summary?plan_level=MPS');

        $log[] = "RESPONSE STATUS: " . $response->getStatusCode();
        $log[] = "RESPONSE BODY: " . $response->getContent();

        // Let's check query log
        DB::enableQueryLog();
        $this->actingAs($this->user)->getJson('/api/planning/mps-summary?plan_level=MPS');
        $log[] = "QUERY LOG: " . json_encode(DB::getQueryLog());
        DB::disableQueryLog();

        file_put_contents('c:/MES-beton-precast/test_debug.txt', implode("\n", $log));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'kpis' => ['monthly_planned_volume', 'monthly_produced_volume', 'achievement_pct', 'open_demand_count'],
            'summary_table' => [
                '*' => ['month_year', 'planned_volume', 'produced_volume', 'achievement_pct']
            ]
        ]);

        $kpis = $response->json('kpis');
        $this->assertEquals(500.0, $kpis['monthly_planned_volume']);
        $this->assertEquals(4.0, $kpis['monthly_produced_volume']);
        $this->assertEquals(0.8, $kpis['achievement_pct']); // 4.0 / 500.0 * 100 = 0.8%
    }
}
