<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\QcInspection;
use App\Models\QcDefect;
use App\Models\QcParameter;
use App\Models\DefectCategory;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class QcInspectionTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Product $product;
    protected ProductionBatch $batch;
    protected QcParameter $parameter;
    protected DefectCategory $defectCategory;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a super_admin user to bypass RBAC
        $this->user = User::factory()->create([
            'username' => 'qc_admin_' . uniqid(),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // 2. Fetch or create Product
        $this->product = Product::first() ?: Product::create([
            'kode' => 'PROD-QC-TEST',
            'nama' => 'QC Test Product',
            'volume_m3' => 0.45,
            'aktif' => true
        ]);

        // 3. Fetch or create ProductionBatch
        $this->batch = ProductionBatch::first() ?: ProductionBatch::create([
            'batch_number' => 'BATCH-QC-' . rand(1000, 9999),
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'actual_qty' => 10,
            'planned_date' => now()->toDateString(),
        ]);

        // 4. Fetch or create QcParameter
        $this->parameter = QcParameter::first() ?: QcParameter::create([
            'kode' => 'QCP-TEST',
            'parameter' => 'Slump Test',
            'satuan' => 'cm',
            'aktif' => true
        ]);

        // 5. Fetch or create DefectCategory
        $this->defectCategory = DefectCategory::first() ?: DefectCategory::create([
            'kode' => 'DEF-TEST',
            'nama' => 'Retak Permukaan',
            'tingkat' => 'Minor',
            'aktif' => true
        ]);
    }

    public function test_can_create_qc_inspection()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)->postJson('/api/qc-inspections', [
            'production_batch_id' => $this->batch->id,
            'inspection_date'     => now()->toDateString(),
            'qty_inspected'       => 10,
            'qty_passed'          => 8,
            'qty_rejected'        => 2,
            'notes'               => 'Testing new inspection',
            'photo'               => UploadedFile::fake()->create('defect.png', 100, 'image/png'),
            'defects'             => [
                [
                    'defect_category_id' => $this->defectCategory->id,
                    'qty'                => 2,
                    'notes'              => 'Small hairline cracks'
                ]
            ],
            'parameters'          => [
                [
                    'qc_parameter_id' => $this->parameter->id,
                    'value'           => '10 cm',
                    'is_passed'       => true,
                    'notes'           => 'Within range'
                ]
            ]
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id', 'no', 'qty_inspected', 'qty_passed', 'qty_rejected', 'photo_path', 'qc_status'
        ]);

        $this->assertEquals('PARTIAL_PASS', $response->json('qc_status'));

        // Check DB tables
        $this->assertDatabaseHas('public.production_qc_inspections', [
            'production_batch_id' => $this->batch->id,
            'qty_inspected'       => 10,
            'qty_passed'          => 8,
            'qty_rejected'        => 2
        ]);

        $this->assertDatabaseHas('public.production_qc_defects', [
            'defect_category_id' => $this->defectCategory->id,
            'qty'                => 2
        ]);

        $this->assertDatabaseHas('public.production_qc_parameter_values', [
            'qc_parameter_id' => $this->parameter->id,
            'value'           => '10 cm',
            'is_passed'       => true
        ]);

        // Check Audit Log
        $this->assertDatabaseHas('global.audit_logs', [
            'action' => 'qc.inspection.created',
            'entity_type' => 'qc_inspection'
        ]);
    }

    public function test_validation_enforces_passed_plus_rejected_equals_inspected()
    {
        $response = $this->actingAs($this->user)->postJson('/api/qc-inspections', [
            'production_batch_id' => $this->batch->id,
            'inspection_date'     => now()->toDateString(),
            'qty_inspected'       => 10,
            'qty_passed'          => 8,
            'qty_rejected'        => 1, // Sum is 9 !== 10
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['qty_inspected']);
    }

    public function test_can_update_qc_inspection()
    {
        $inspection = QcInspection::create([
            'no'                  => 'QC-TEST-0001',
            'production_batch_id' => $this->batch->id,
            'product_id'          => $this->product->id,
            'inspection_date'     => now()->toDateString(),
            'qty_inspected'       => 5,
            'qty_passed'          => 5,
            'qty_rejected'        => 0,
            'inspector_id'        => $this->user->id
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/qc-inspections/{$inspection->id}", [
            'inspection_date' => now()->toDateString(),
            'qty_inspected'   => 5,
            'qty_passed'      => 4,
            'qty_rejected'    => 1,
            'notes'           => 'Updated notes',
            'defects'         => [
                [
                    'defect_category_id' => $this->defectCategory->id,
                    'qty'                => 1
                ]
            ]
        ]);

        $response->assertStatus(200);
        $this->assertEquals('PARTIAL_PASS', $response->json('qc_status'));

        $this->assertDatabaseHas('public.production_qc_inspections', [
            'id'           => $inspection->id,
            'qty_passed'   => 4,
            'qty_rejected' => 1
        ]);

        $this->assertDatabaseHas('public.production_qc_defects', [
            'inspection_id'      => $inspection->id,
            'defect_category_id' => $this->defectCategory->id,
            'qty'                => 1
        ]);

        $this->assertDatabaseHas('global.audit_logs', [
            'action' => 'qc.inspection.updated',
            'entity_type' => 'qc_inspection'
        ]);
    }

    public function test_qc_dashboard_statistics()
    {
        $response = $this->actingAs($this->user)->getJson('/api/qc-dashboard');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'inspections_today',
            'passed_today',
            'rejected_today',
            'reject_rate',
            'batches_waiting_qc',
            'top_defect_categories',
            'defect_trend'
        ]);
    }

    public function test_main_dashboard_statistics_contains_qc()
    {
        $response = $this->actingAs($this->user)->getJson('/api/dashboard');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'production',
            'inventory',
            'delivery',
            'sales_order',
            'qc' => [
                'inspections_today',
                'passed_today',
                'rejected_today',
                'reject_rate',
                'batches_waiting_qc'
            ]
        ]);
    }
}
