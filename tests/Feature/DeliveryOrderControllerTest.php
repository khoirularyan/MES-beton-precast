<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\DeliveryOrder;
use App\Models\InventoryBatch;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DeliveryOrderControllerTest extends TestCase
{
    use DatabaseTransactions;

    private User $user;
    private Customer $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure user roles exist
        $role = Role::updateOrCreate(
            ['kode' => 'warehouse'],
            ['nama' => 'Warehouse Staff', 'is_active' => true]
        );

        $this->user = User::factory()->create([
            'username' => 'warehouse_' . uniqid(),
            'role' => 'warehouse',
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'kode' => 'CUST-TEST-DO',
            'nama' => 'PT Test Customer',
            'aktif' => true,
        ]);

        $this->product = Product::create([
            'kode' => 'PROD-TEST-DO',
            'nama' => 'U-Ditch Test Product',
            'kategori' => 'U-Ditch',
            'satuan' => 'unit',
            'harga' => 500000,
            'aktif' => true,
        ]);
    }

    public function test_can_fetch_delivery_orders(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-TEST-DO-' . rand(100, 999),
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 10,
            'nilai' => 5000000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
        ]);

        DeliveryOrder::create([
            'no' => 'DO-TEST-' . rand(100, 999),
            'sales_order_id' => $so->id,
            'customer_id' => $this->customer->id,
            'qty' => 5,
            'tgl_kirim' => now(),
            'status' => 'Disiapkan',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/delivery-orders');

        $response->assertStatus(200);
        $response->assertJsonFragment(['qty' => 5]);
    }

    public function test_fifo_check_returns_warning_for_aged_inventory(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-TEST-DO-' . rand(100, 999),
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 10,
            'nilai' => 5000000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
        ]);

        // Create an old batch (35 days old)
        InventoryBatch::create([
            'batch_number' => 'LOT-OLD-35',
            'product_id' => $this->product->id,
            'warehouse' => 'WH-FG',
            'production_date' => now()->subDays(35),
            'qty_on_hand' => 15,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/delivery-orders/fifo-check?sales_order_id={$so->id}");

        $response->assertStatus(200);
        $response->assertJson([
            'has_warning' => true,
            'batch_number' => 'LOT-OLD-35',
            'aging_days' => 35,
        ]);
    }

    public function test_fifo_check_returns_no_warning_for_fresh_inventory(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-TEST-DO-' . rand(100, 999),
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 10,
            'nilai' => 5000000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
        ]);

        // Create a fresh batch (5 days old)
        InventoryBatch::create([
            'batch_number' => 'LOT-FRESH-5',
            'product_id' => $this->product->id,
            'warehouse' => 'WH-FG',
            'production_date' => now()->subDays(5),
            'qty_on_hand' => 15,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/delivery-orders/fifo-check?sales_order_id={$so->id}");

        $response->assertStatus(200);
        $response->assertJson([
            'has_warning' => false,
        ]);
    }

    public function test_can_create_delivery_order(): void
    {
        $so = SalesOrder::create([
            'no' => 'SO-TEST-DO-' . rand(100, 999),
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 10,
            'nilai' => 5000000,
            'tgl_order' => now(),
            'tgl_kirim' => now()->addDays(5),
            'status' => 'Approved',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/delivery-orders', [
                'sales_order_id' => $so->id,
                'customer_id' => $this->customer->id,
                'qty' => 10,
                'truk' => 'B-1234-XYZ',
                'driver' => 'Joko',
                'tgl_kirim' => now()->toDateString(),
                'catatan' => 'Deliver ASAP',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('public.production_delivery_orders', [
            'sales_order_id' => $so->id,
            'customer_id' => $this->customer->id,
            'qty' => 10,
            'truk' => 'B-1234-XYZ',
            'driver' => 'Joko',
        ]);
    }
}
