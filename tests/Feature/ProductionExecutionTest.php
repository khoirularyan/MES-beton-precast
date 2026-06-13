<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ProductionBatch;
use App\Models\BatchStatus;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\Customer;
use App\Models\Mold;
use App\Models\InventoryBatch;
use App\Models\DeliveryOrder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;

class ProductionExecutionTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Product $product;
    protected Mold $mold;
    protected SalesOrder $salesOrder;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a super_admin user to bypass RBAC checks
        $this->user = User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Retrieve master data for test setup
        $this->product = Product::first() ?: Product::create([
            'kode' => 'PROD-TEST',
            'nama' => 'Test Product',
            'volume_m3' => 0.5,
        ]);

        $this->mold = Mold::first() ?: Mold::create([
            'kode' => 'MOLD-TEST',
            'nama' => 'Test Mold',
            'jumlah_total' => 5,
            'jumlah_aktif' => 5,
            'kapasitas_per_siklus' => 1,
            'siklus_per_hari' => 1,
        ]);

        $customer = Customer::first() ?: Customer::create([
            'kode' => 'CST-TEST',
            'nama' => 'Test Customer',
        ]);

        $this->salesOrder = SalesOrder::first() ?: SalesOrder::create([
            'no' => 'SO-TEST-' . rand(1000, 9999),
            'customer_id' => $customer->id,
            'product_id' => $this->product->id,
            'qty' => 10,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Planning',
        ]);
    }

    public function test_can_fetch_batch_statuses(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/batch-statuses');

        $response->assertStatus(200);
        $response->assertJsonFragment(['status' => 'Planning']);
        $response->assertJsonFragment(['status' => 'Casting']);
        
        $activeStatuses = BatchStatus::where('aktif', true)->get();
        foreach ($activeStatuses as $status) {
            $response->assertJsonFragment(['status' => $status->status]);
        }
    }

    public function test_can_fetch_production_batches(): void
    {
        $planningStatus = BatchStatus::where('status', 'Planning')->first();
        
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-TEST-FETCH',
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 5,
            'batch_status_id' => $planningStatus->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/production-batches?raw=true');

        $response->assertStatus(200);
        $response->assertJsonFragment(['batch_number' => 'BATCH-TEST-FETCH']);
    }

    public function test_enforces_sequential_transition(): void
    {
        $activeStatuses = BatchStatus::where('aktif', true)->orderBy('urutan')->get();
        $this->assertGreaterThanOrEqual(3, $activeStatuses->count(), 'Test requires at least 3 active statuses');

        $firstStatus = $activeStatuses[0];
        $secondStatus = $activeStatuses[1];
        $thirdStatus = $activeStatuses[2];

        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-TEST-SEQ',
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 5,
            'batch_status_id' => $firstStatus->id,
        ]);

        // Try invalid transition: first -> third (skipping second)
        $response = $this->actingAs($this->user)
            ->postJson("/api/production-batches/{$batch->id}/transition", [
                'to_status_id' => $thirdStatus->id,
                'notes' => 'Attempting skip',
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Transition failed']);

        // Try valid transition: first -> second
        $response = $this->actingAs($this->user)
            ->postJson("/api/production-batches/{$batch->id}/transition", [
                'to_status_id' => $secondStatus->id,
                'notes' => 'Correct sequence',
            ]);

        $response->assertStatus(200);
        $this->assertEquals($secondStatus->id, $batch->fresh()->batch_status_id);

        // Verify status change log was created
        $this->assertDatabaseHas('public.production_batch_status_logs', [
            'production_batch_id' => $batch->id,
            'from_status_id' => $firstStatus->id,
            'to_status_id' => $secondStatus->id,
        ]);
    }

    public function test_finished_transitions_updates_inventory(): void
    {
        $finishedStatus = BatchStatus::where('aktif', true)
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%finished%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%selesai%']);
            })
            ->firstOrFail();

        $activeStatuses = BatchStatus::where('aktif', true)->orderBy('urutan')->get();
        $finishedIndex = $activeStatuses->search(fn($s) => $s->id === $finishedStatus->id);
        $this->assertGreaterThan(0, $finishedIndex, 'Finished status cannot be the first active status');
        $preFinishedStatus = $activeStatuses[$finishedIndex - 1];

        // Create a batch in QC stage
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-TEST-INV-' . rand(100, 999),
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 10,
            'actual_qty' => 10,
            'batch_status_id' => $preFinishedStatus->id,
        ]);

        $initialStock = DB::table('public.production_inventory')
            ->where('product_id', $this->product->id)
            ->where('gudang', 'WH-FG')
            ->value('stok') ?: 0;

        // Transition to Finished
        $response = $this->actingAs($this->user)
            ->postJson("/api/production-batches/{$batch->id}/transition", [
                'to_status_id' => $finishedStatus->id,
                'notes' => 'Moving to finished yard',
            ]);

        $response->assertStatus(200);

        // Verify inventory aggregate stock increased
        $newStock = DB::table('public.production_inventory')
            ->where('product_id', $this->product->id)
            ->where('gudang', 'WH-FG')
            ->value('stok');

        $this->assertEquals($initialStock + 10, $newStock);

        // Verify inventory batch lot was created
        $this->assertDatabaseHas('public.production_inventory_batches', [
            'batch_number' => $batch->batch_number,
            'product_id' => $this->product->id,
            'qty_on_hand' => 10,
            'warehouse' => 'WH-FG',
        ]);
    }

    public function test_delivered_transitions_creates_delivery_order_and_deducts_stock(): void
    {
        $deliveredStatus = BatchStatus::where('aktif', true)
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%delivered%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%kirim%']);
            })
            ->firstOrFail();

        $activeStatuses = BatchStatus::where('aktif', true)->orderBy('urutan')->get();
        $deliveredIndex = $activeStatuses->search(fn($s) => $s->id === $deliveredStatus->id);
        $this->assertGreaterThan(0, $deliveredIndex, 'Delivered status cannot be the first active status');
        $finishedStatus = $activeStatuses[$deliveredIndex - 1];

        // Pre-create aggregate stock and batch lot
        DB::table('public.production_inventory')->updateOrInsert(
            ['product_id' => $this->product->id, 'gudang' => 'WH-FG'],
            ['stok' => 20]
        );

        $batchNumber = 'BATCH-TEST-DELIV-' . rand(100, 999);
        InventoryBatch::create([
            'batch_number' => $batchNumber,
            'product_id' => $this->product->id,
            'warehouse' => 'WH-FG',
            'production_date' => now(),
            'qty_on_hand' => 20,
        ]);

        $batch = ProductionBatch::create([
            'batch_number' => $batchNumber,
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 15,
            'actual_qty' => 15,
            'batch_status_id' => $finishedStatus->id,
            'sales_order_id' => $this->salesOrder->id,
        ]);

        // Transition Finished -> Delivered
        $response = $this->actingAs($this->user)
            ->postJson("/api/production-batches/{$batch->id}/transition", [
                'to_status_id' => $deliveredStatus->id,
                'notes' => 'Shipped to site',
            ]);

        $response->assertStatus(200);

        // Verify inventory aggregate stock decremented: 20 - 15 = 5
        $newStock = DB::table('public.production_inventory')
            ->where('product_id', $this->product->id)
            ->where('gudang', 'WH-FG')
            ->value('stok');

        $this->assertEquals(5, $newStock);

        // Verify lot stock decremented: 20 - 15 = 5
        $lotStock = DB::table('public.production_inventory_batches')
            ->where('batch_number', $batchNumber)
            ->value('qty_on_hand');

        $this->assertEquals(5, $lotStock);

        // Verify Delivery Order was generated
        $this->assertDatabaseHas('public.production_delivery_orders', [
            'sales_order_id' => $this->salesOrder->id,
            'qty' => 15,
            'status' => 'Selesai',
        ]);
    }
}
