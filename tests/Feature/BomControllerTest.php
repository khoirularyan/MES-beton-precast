<?php

namespace Tests\Feature;

use App\Models\BomHeader;
use App\Models\BomItem;
use App\Models\Product;
use App\Models\Material;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BomControllerTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;
    private Product $product;
    private Material $material1;
    private Material $material2;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Ensure a role with master-bom.manage or super_admin exists or is created
        $role = Role::firstOrCreate(
            ['kode' => 'super_admin'],
            ['nama' => 'Super Admin', 'is_active' => true]
        );

        // 2. Create admin user
        $this->admin = User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => 'super_admin',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        // 3. Create test product
        $this->product = Product::create([
            'kode' => 'PRD-' . substr(uniqid(), -8),
            'nama' => 'Precast Test Product',
            'kategori' => 'Spun Pile',
            'grade' => 'K-500',
            'berat' => 1200.50,
            'volume_m3' => 0.500,
            'harga' => 1500000,
            'satuan' => 'PCS',
            'aktif' => true,
        ]);

        // 4. Create test materials
        $this->material1 = Material::create([
            'kode' => 'MAT-' . substr(uniqid(), -8),
            'nama' => 'Semen Portland',
            'satuan' => 'kg',
            'kategori' => 'Raw Material',
            'harga' => 1200,
            'aktif' => true,
        ]);

        $this->material2 = Material::create([
            'kode' => 'MAT-' . substr(uniqid(), -8),
            'nama' => 'Besi Beton D10',
            'satuan' => 'batang',
            'kategori' => 'Reinforcement',
            'harga' => 85000,
            'aktif' => true,
        ]);
    }

    public function test_can_create_draft_bom_with_recalculated_snapshot_totals(): void
    {
        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'notes' => 'Initial test BOM',
            'items' => [
                [
                    'material_id' => $this->material1->id,
                    'qty_per_unit' => 350.5,
                    'waste_pct' => 2.5,
                    'catatan' => 'Semen per unit precast',
                ],
                [
                    'material_id' => $this->material2->id,
                    'qty_per_unit' => 5,
                    'waste_pct' => 0.0,
                    'catatan' => 'Besi reinforcement',
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('bom.status', 'draft');

        // Total Material Cost calculation:
        // Item 1: 350.5 * 1200 = 420,600
        // Item 2: 5 * 85,000 = 425,000
        // Total Material Cost = 420,600 + 425,000 = 845,600
        $response->assertJsonPath('bom.total_material_cost', 845600);

        // Waste Cost calculation:
        // Item 1: 420,600 * 2.5% = 10,515
        // Item 2: 425,000 * 0% = 0
        // Total Waste Cost = 10,515
        $response->assertJsonPath('bom.total_waste_cost', 10515);

        // Check if items have the correct snapshot price
        $hasItem = DB::table('global.production_bom_items')->where([
            'material_id' => $this->material1->id,
            'harga_snapshot' => 1200,
            'material_type' => 'Raw Material'
        ])->exists();
        $this->assertTrue($hasItem, "BOM item with correct snapshot price does not exist in database.");
    }

    public function test_warns_when_product_or_material_is_inactive(): void
    {
        $inactiveMaterial = Material::create([
            'kode' => 'MAT-INA-' . substr(uniqid(), -8),
            'nama' => 'Bahan Kimia Rusak',
            'satuan' => 'liter',
            'kategori' => 'Chemical',
            'harga' => 25000,
            'aktif' => false, // Inactive!
        ]);

        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V1.0-Warn',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'items' => [
                [
                    'material_id' => $inactiveMaterial->id,
                    'qty_per_unit' => 10,
                    'waste_pct' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            "warnings" => [
                "Material '" . $inactiveMaterial->nama . "' sedang tidak aktif."
            ]
        ]);
    }

    public function test_prevents_duplicate_materials_in_same_bom(): void
    {
        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V1.0-Dup',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'items' => [
                [
                    'material_id' => $this->material1->id,
                    'qty_per_unit' => 10,
                    'waste_pct' => 0,
                ],
                [
                    'material_id' => $this->material1->id, // DUPLICATE!
                    'qty_per_unit' => 20,
                    'waste_pct' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Validasi gagal: Terdapat duplikasi material dalam satu BOM.'
        ]);
    }

    public function test_prevents_duplicate_bom_versions_per_product(): void
    {
        BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'draft',
        ]);

        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V1.0', // DUPLICATE!
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'items' => [
                [
                    'material_id' => $this->material1->id,
                    'qty_per_unit' => 10,
                    'waste_pct' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(422);
    }

    public function test_can_update_draft_bom_and_recalculate_totals(): void
    {
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'draft',
        ]);

        $payload = [
            'version' => 'V1.0-Revised',
            'output_qty' => 2,
            'output_uom' => 'PCS',
            'notes' => 'Updated draft note',
            'items' => [
                [
                    'material_id' => $this->material2->id,
                    'qty_per_unit' => 8,
                    'waste_pct' => 5.0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->putJson('/api/boms/' . $bom->id, $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('bom.version', 'V1.0-Revised');
        
        // Cost: 8 * 85000 = 680,000 material, 680,000 * 5% = 34,000 waste
        $response->assertJsonPath('bom.total_material_cost', 680000);
        $response->assertJsonPath('bom.total_waste_cost', 34000);
    }

    public function test_cannot_update_non_draft_bom(): void
    {
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active', // Active!
        ]);

        $payload = [
            'version' => 'V1.0-Fail',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'items' => []
        ];

        $response = $this->actingAs($this->admin)
            ->putJson('/api/boms/' . $bom->id, $payload);

        $response->assertStatus(422);
    }

    public function test_can_activate_bom_and_archives_previous_active_bom(): void
    {
        // 1. Create an active BOM
        $oldActive = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
        ]);

        // 2. Create a draft BOM
        $draft = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V2.0',
            'status' => 'draft',
        ]);

        // 3. Activate the draft
        $response = $this->actingAs($this->admin)
            ->postJson("/api/boms/{$draft->id}/activate");

        $response->assertStatus(200);
        
        $this->assertEquals('active', $draft->fresh()->status);
        $this->assertEquals('archived', $oldActive->fresh()->status);
    }

    public function test_cannot_activate_bom_if_product_is_inactive(): void
    {
        $inactiveProduct = Product::create([
            'kode' => 'PRD-INA-' . substr(uniqid(), -8),
            'nama' => 'Precast Inactive Product',
            'aktif' => false, // Inactive!
        ]);

        $bom = BomHeader::create([
            'product_id' => $inactiveProduct->id,
            'version' => 'V1.0',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/boms/{$bom->id}/activate");

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Gagal mengaktifkan BOM: Produk tidak aktif.'
        ]);
    }

    public function test_can_archive_active_bom(): void
    {
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/boms/{$bom->id}/archive");

        $response->assertStatus(200);
        $this->assertEquals('archived', $bom->fresh()->status);
    }

    public function test_can_clone_bom_and_snapshots_new_prices(): void
    {
        // 1. Create a draft with a manually customized older snapshot price
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'active',
            'output_qty' => 1,
            'output_uom' => 'PCS',
        ]);

        BomItem::create([
            'bom_header_id' => $bom->id,
            'material_id' => $this->material1->id,
            'qty_per_unit' => 10,
            'waste_pct' => 0,
            'harga_snapshot' => 1000 // Custom old price (current is 1200)
        ]);

        // 2. Clone the BOM
        $response = $this->actingAs($this->admin)
            ->postJson("/api/boms/{$bom->id}/clone", [
                'version' => 'V1.0-Cloned'
            ]);

        $response->assertStatus(201);
        $clonedId = $response->json('bom.id');

        // Check if cloned item takes the *new current price* (1200) as snapshot
        $clonedItem = BomItem::where('bom_header_id', $clonedId)
            ->where('material_id', $this->material1->id)
            ->first();

        $this->assertEquals(1200, $clonedItem->harga_snapshot);
    }

    public function test_can_soft_delete_draft_bom(): void
    {
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/boms/' . $bom->id);

        $response->assertStatus(200);
        $deletedAt = DB::table('global.production_bom_headers')->where('id', $bom->id)->value('deleted_at');
        $this->assertNotNull($deletedAt, "BOM draft header was not soft deleted.");
    }

    public function test_can_create_bom_with_custom_overhead_percentage(): void
    {
        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V1.0-OH',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'overhead_pct' => 18.50,
            'items' => [
                [
                    'material_id' => $this->material1->id,
                    'qty_per_unit' => 10,
                    'waste_pct' => 0.0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(201);
        $this->assertEquals(18.50, $response->json('bom.overhead_pct'));
    }

    public function test_can_update_bom_with_custom_overhead_percentage(): void
    {
        $bom = BomHeader::create([
            'product_id' => $this->product->id,
            'version' => 'V1.0-OH-U',
            'status' => 'draft',
            'overhead_pct' => 15.00,
        ]);

        $payload = [
            'version' => 'V1.0-OH-U-rev',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'overhead_pct' => 20.00,
            'items' => [
                [
                    'material_id' => $this->material1->id,
                    'qty_per_unit' => 10,
                    'waste_pct' => 0.0,
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->putJson('/api/boms/' . $bom->id, $payload);

        $response->assertStatus(200);
        $this->assertEquals(20.00, $response->json('bom.overhead_pct'));
    }

    public function test_can_create_draft_bom_with_empty_items(): void
    {
        $payload = [
            'product_id' => $this->product->id,
            'version' => 'V2.0-Empty',
            'output_qty' => 1,
            'output_uom' => 'PCS',
            'overhead_pct' => 12.00,
            'notes' => 'Empty draft BOM test',
            'items' => []
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/boms', $payload);

        $response->assertStatus(201);
        $this->assertEquals('draft', $response->json('bom.status'));
        $this->assertEmpty($response->json('bom.items'));
    }
}
