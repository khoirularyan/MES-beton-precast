<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\BomHeader;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\ProductionBatch;
use App\Models\ProductionCost;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class FinancialDashboardTest extends TestCase
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
            'kode' => 'CUST-DASH-' . substr(uniqid(), -6),
            'nama' => 'Test Dashboard Customer',
            'aktif' => true,
        ]);

        $this->product = Product::create([
            'kode' => 'PROD-DASH-' . substr(uniqid(), -6),
            'nama' => 'Test Dash Precast',
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

    public function test_dashboard_financial_calculations(): void
    {
        // 0. Get baseline financial figures directly from database queries to bypass API caching
        $startOfMonth = date('Y-m-01');
        $endOfMonth = date('Y-m-t');

        $baseRevMonth = (float) DB::table('public.production_sales_order_items as soi')
            ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
            ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
            ->whereNull('so.deleted_at')
            ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

        $baseRevDelivered = (float) DB::table('public.production_sales_order_items as soi')
            ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
            ->whereNull('so.deleted_at')
            ->sum(DB::raw('soi.qty_delivered * soi.unit_price'));

        // Query active BOMs
        $activeBoms = DB::table('global.production_bom_headers')
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->keyBy('product_id');

        $monthlyBatches = DB::table('public.production_batches')
            ->whereBetween('planned_date', [$startOfMonth, $endOfMonth])
            ->whereNull('deleted_at')
            ->get();

        $baseCostMonth = 0.0;
        foreach ($monthlyBatches as $b) {
            // Check if actual cost exists
            $actualCost = DB::table('public.production_costs')
                ->where('production_batch_id', $b->id)
                ->value('total_cost');
            if ($actualCost !== null) {
                $baseCostMonth += (float)$actualCost;
            } else {
                $bomHeaderId = $b->bom_header_id;
                if (!$bomHeaderId) {
                    $fallbackBom = $activeBoms->get($b->product_id);
                    $bomHeaderId = $fallbackBom ? $fallbackBom->id : null;
                }
                if ($bomHeaderId) {
                    $bomHeader = DB::table('global.production_bom_headers')->where('id', $bomHeaderId)->first();
                    if ($bomHeader) {
                        $materialCost = (float)$bomHeader->total_material_cost;
                        $overheadPct = (float)$bomHeader->overhead_pct;
                        $standardCost = $materialCost * (1 + ($overheadPct / 100));
                        $baseCostMonth += $standardCost * (float)$b->target_qty;
                    }
                }
            }
        }

        $statusValues = DB::table('public.production_sales_order_items as soi')
            ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->whereNull('so.deleted_at')
            ->select('so.status', DB::raw('SUM(soi.qty_ordered * soi.unit_price) as total_val'))
            ->groupBy('so.status')
            ->pluck('total_val', 'so.status')
            ->toArray();

        $basePipelineApproved = (float) ($statusValues['Approved'] ?? 0.0) + (float) ($statusValues['Planning'] ?? 0.0);

        // 1. Create a sales order item in this month to generate revenue_month
        $so = SalesOrder::create([
            'no' => 'SO-DASH-' . rand(100, 999),
            'so_type' => 'MTS',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'qty' => 5,
            'nilai' => 2500000,
            'tgl_order' => now()->toDateString(),
            'tgl_kirim' => now()->addDays(5)->toDateString(),
            'status' => 'Approved',
        ]);

        $soItem = SalesOrderItem::create([
            'sales_order_id' => $so->id,
            'product_id' => $this->product->id,
            'qty_ordered' => 5.0,
            'qty_delivered' => 2.0, // For revenue_delivered
            'unit_price' => 500000.0,
            'bom_header_id' => $this->bom->id,
        ]);

        // 2. Create batch with fallback BOM estimate
        $batch = ProductionBatch::create([
            'batch_number' => 'BATCH-DASH-' . rand(100, 999),
            'source_type' => 'SO',
            'product_id' => $this->product->id,
            'target_qty' => 5.0,
            'planned_date' => now()->toDateString(),
            'bom_header_id' => $this->bom->id,
            'batch_status_id' => 1,
        ]);

        // Clear the cache to make sure the next request gets the new data
        Cache::forget('dashboard_overview');
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/dashboard');

        $response->assertStatus(200);
        
        $data = $response->json();
        
        // Assert revenue
        $this->assertEquals($baseRevMonth + 2500000.0, (float)$data['financial']['revenue_month']);
        $this->assertEquals($baseRevDelivered + 1000000.0, (float)$data['financial']['revenue_delivered']);
        
        // Assert BOM Cost Fallback (5 target_qty * 330000 standard material cost + 10% overhead = 1650000.0)
        $this->assertEquals($baseCostMonth + 1650000.0, (float)$data['financial']['cost_month']);
        
        // Assert Margin
        $expectedMargin = ($baseRevMonth + 2500000.0) - ($baseCostMonth + 1650000.0);
        $this->assertEquals($expectedMargin, (float)$data['financial']['gross_margin']);

        // Assert Metadata
        $this->assertContains($data['financial_metadata']['cost_source'], ['BOM_ESTIMATE', 'ACTUAL']);
        $this->assertContains($data['financial_metadata']['cost_confidence'], ['MEDIUM', 'HIGH']);
        
        // Assert Pipeline Breakdown
        $this->assertEquals($basePipelineApproved + 2500000.0, (float)$data['financial']['pipeline_breakdown']['approved']);

        // Assert Monthly Trend Series
        $this->assertNotEmpty($data['financial']['monthly_series']);
        $currentMonthLabel = now()->format('M');
        $found = false;
        foreach ($data['financial']['monthly_series'] as $series) {
            if ($series['month'] === $currentMonthLabel) {
                $this->assertEquals($baseRevMonth + 2500000.0, (float)$series['revenue']);
                $this->assertTrue($series['activity']);
                $found = true;
            }
        }
        $this->assertTrue($found);
    }
}
