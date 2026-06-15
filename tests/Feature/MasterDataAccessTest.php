<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Material;
use App\Models\BatchStatus;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class MasterDataAccessTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $ppicUser;
    protected User $salesUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Admin User (role: admin)
        $this->adminUser = User::factory()->create([
            'username'  => 'test_admin_' . uniqid(),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        // PPIC User (role: ppic)
        $this->ppicUser = User::factory()->create([
            'username'  => 'test_ppic_' . uniqid(),
            'role'      => 'ppic',
            'is_active' => true,
        ]);

        // Sales User (role: sales)
        $this->salesUser = User::factory()->create([
            'username'  => 'test_sales_' . uniqid(),
            'role'      => 'sales',
            'is_active' => true,
        ]);
    }

    /**
     * Test fine-grained permissions for Sales role.
     */
    public function test_sales_role_fine_grained_permissions()
    {
        // 1. Sales can view products
        $response = $this->actingAs($this->salesUser)->getJson('/api/products');
        $response->assertStatus(200);

        // 2. Sales cannot create product
        $response = $this->actingAs($this->salesUser)->postJson('/api/products', [
            'kode' => 'NEW-PROD-TEST',
            'nama' => 'New Product Test',
            'aktif' => true,
        ]);
        $response->assertStatus(403);

        // 3. Sales cannot view materials
        $response = $this->actingAs($this->salesUser)->getJson('/api/materials');
        $response->assertStatus(403);
    }

    /**
     * Test PPIC role can manage master data but cannot manage statuses.
     */
    public function test_ppic_role_can_manage_master_but_not_statuses()
    {
        // 1. PPIC can view products and materials
        $this->actingAs($this->ppicUser)->getJson('/api/products')->assertStatus(200);
        $this->actingAs($this->ppicUser)->getJson('/api/materials')->assertStatus(200);

        // 2. PPIC can create product (validation error is 422, not 403)
        $response = $this->actingAs($this->ppicUser)->postJson('/api/products', [
            'nama' => 'Incomplete Product'
        ]);
        $response->assertStatus(422);

        // 3. PPIC CANNOT create/update batch-status (restricted to admin)
        $response = $this->actingAs($this->ppicUser)->postJson('/api/batch-statuses', [
            'kode' => 'BS-TEST',
            'status' => 'Testing Status',
            'urutan' => 99,
        ]);
        $response->assertStatus(403);
    }

    /**
     * Test Admin role can manage statuses.
     */
    public function test_admin_role_can_manage_statuses()
    {
        // 1. Admin can view batch-statuses
        $this->actingAs($this->adminUser)->getJson('/api/batch-statuses')->assertStatus(200);

        // 2. Admin can create batch-status (validation error 422 instead of 403, indicating access is permitted)
        $response = $this->actingAs($this->adminUser)->postJson('/api/batch-statuses', [
            'status' => 'Invalid Request'
        ]);
        $response->assertStatus(422);
    }

    /**
     * Test that audit logs are created for master data changes.
     */
    public function test_audit_logs_are_written_for_master_data_changes()
    {
        // Setup initial count of audit logs
        $initialCount = AuditLog::count();

        // 1. Create a product with PPIC User
        $response = $this->actingAs($this->ppicUser)->postJson('/api/products', [
            'kode' => 'AUDIT-PROD-1',
            'nama' => 'Audit Product Test',
            'volume_m3' => 0.5,
            'aktif' => true,
        ]);
        $response->assertStatus(201);

        // Verify product.created log exists
        $this->assertGreaterThan($initialCount, AuditLog::count());
        $latestLog = AuditLog::latest('id')->first();
        $this->assertEquals('product.created', $latestLog->action);
        $this->assertEquals('product', $latestLog->entity_type);
        $this->assertNotNull($latestLog->new_values);
        $this->assertEquals($this->ppicUser->id, $latestLog->user_id);

        // 2. Update the product
        $productId = $response->json('id');
        $initialCount = AuditLog::count();

        $response = $this->actingAs($this->ppicUser)->putJson("/api/products/{$productId}", [
            'kode' => 'AUDIT-PROD-1',
            'nama' => 'Updated Audit Product Name',
            'volume_m3' => 0.5,
            'aktif' => true,
        ]);
        $response->assertStatus(200);

        // Verify product.updated log exists
        $this->assertGreaterThan($initialCount, AuditLog::count());
        $latestLog = AuditLog::latest('id')->first();
        $this->assertEquals('product.updated', $latestLog->action);
        $this->assertEquals('Audit Product Test', $latestLog->old_values['nama']);
        $this->assertEquals('Updated Audit Product Name', $latestLog->new_values['nama']);

        // 3. Delete the product
        $initialCount = AuditLog::count();

        $response = $this->actingAs($this->ppicUser)->deleteJson("/api/products/{$productId}");
        $response->assertStatus(200);

        // Verify product.deleted log exists
        $this->assertGreaterThan($initialCount, AuditLog::count());
        $latestLog = AuditLog::latest('id')->first();
        $this->assertEquals('product.deleted', $latestLog->action);
        $this->assertEquals('Updated Audit Product Name', $latestLog->old_values['nama']);
    }
}
