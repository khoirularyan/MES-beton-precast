<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\ProductionBatch;
use App\Models\ProductionDemand;
use App\Models\ProductionPlan;
use App\Models\InventoryBatch;
use App\Models\ProductionCost;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        // Open Sales Orders
        $openSalesOrders = SalesOrder::query()
            ->whereNotIn('status', ['Completed', 'Delivered', 'Cancelled'])
            ->whereNull('deleted_at')
            ->count();

        // Pending Delivery (SO yang sudah Completed tapi belum Delivered)
        $pendingDelivery = SalesOrder::query()
            ->where('status', 'Completed')
            ->whereNull('deleted_at')
            ->count();

        // Overdue delivery
        $overdueDelivery = SalesOrder::query()
            ->whereNotIn('status', ['Completed', 'Delivered', 'Cancelled'])
            ->where('tgl_kirim', '<', now()->toDateString())
            ->whereNull('deleted_at')
            ->count();

        // Production Batches by status ID
        $batchStats = ProductionBatch::query()
            ->whereNull('deleted_at')
            ->selectRaw('batch_status_id, count(*) as total')
            ->groupBy('batch_status_id')
            ->pluck('total', 'batch_status_id');

        // Map status ID to status name for dashboard response
        $dbStatuses = DB::table('global.production_batch_statuses')->get();
        
        $activeBatches = 0;
        $qcPendingBatches = 0;
        $batchStatsSummary = [];
        
        foreach ($dbStatuses as $s) {
            $count = $batchStats->get($s->id, 0);
            $batchStatsSummary[$s->status] = $count;
            
            $nameLower = strtolower(trim($s->status));
            if (strpos($nameLower, 'casting') !== false || strpos($nameLower, 'cetak') !== false) {
                $activeBatches = $count;
            }
            if (strpos($nameLower, 'qc') !== false || strpos($nameLower, 'quality') !== false) {
                $qcPendingBatches = $count;
            }
        }

        // Open Demands
        $openDemands = ProductionDemand::query()
            ->where('status', 'Open')
            ->whereNull('deleted_at')
            ->count();

        // Production Plans - material readiness
        $planMaterialStatus = ProductionPlan::query()
            ->whereIn('status', ['Draft', 'Approved', 'Released'])
            ->whereNull('deleted_at')
            ->selectRaw('material_status, count(*) as total')
            ->groupBy('material_status')
            ->pluck('total', 'material_status');

        // Stock Aging — batches older than 30 days
        $agingStock = InventoryBatch::query()
            ->where('status', 'Available')
            ->where('production_date', '<', now()->subDays(30)->toDateString())
            ->whereNull('deleted_at')
            ->count();

        // Production Cost variance this month
        $costVariance = ProductionCost::query()
            ->whereHas('productionBatch', function ($q) {
                $q->whereMonth('created_at', now()->month)
                  ->whereYear('created_at', now()->year);
            })
            ->selectRaw('
                SUM(estimated_material_cost + estimated_labor_cost + estimated_overhead_cost) as total_estimated,
                SUM(actual_material_cost + actual_labor_cost + actual_overhead_cost) as total_actual,
                SUM(variance_amount) as total_variance
            ')
            ->first();

        // Recent Sales Orders
        $recentSalesOrders = SalesOrder::with('customer', 'product')
            ->whereNull('deleted_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($so) => [
                'id'         => $so->id,
                'no'         => $so->no,
                'customer'   => $so->customer?->nama,
                'product'    => $so->product?->nama,
                'qty'        => $so->qty,
                'status'     => $so->status,
                'tgl_kirim'  => $so->tgl_kirim?->toDateString(),
                'prioritas'  => $so->prioritas,
            ]);

        // Production Batch progress
        $progressStatusIds = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%finished%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%selesai%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%delivered%'])
            ->whereRaw('LOWER(status) NOT LIKE ?', ['%kirim%'])
            ->pluck('id');

        $batchProgress = ProductionBatch::with(['product', 'workCenter', 'statusModel'])
            ->whereIn('batch_status_id', $progressStatusIds)
            ->whereNull('deleted_at')
            ->orderBy('planned_start')
            ->limit(10)
            ->get()
            ->map(fn ($b) => [
                'id'            => $b->id,
                'batch_number'  => $b->batch_number,
                'product'       => $b->product?->nama,
                'target_qty'    => $b->target_qty,
                'actual_qty'    => $b->actual_qty,
                'status'        => $b->statusModel?->status,
                'planned_start' => $b->planned_start?->toDateTimeString(),
                'planned_end'   => $b->planned_end?->toDateTimeString(),
                'work_center'   => $b->workCenter?->name,
            ]);

        return response()->json([
            'summary' => [
                'open_sales_orders'   => $openSalesOrders,
                'pending_delivery'    => $pendingDelivery,
                'overdue_delivery'    => $overdueDelivery,
                'active_batches'      => $activeBatches,
                'qc_pending_batches'  => $qcPendingBatches,
                'open_demands'        => $openDemands,
                'aging_stock_batches' => $agingStock,
            ],
            'plan_material_status'  => $planMaterialStatus,
            'batch_status_summary'  => $batchStatsSummary,
            'cost_this_month'       => [
                'total_estimated' => (float) ($costVariance->total_estimated ?? 0),
                'total_actual'    => (float) ($costVariance->total_actual ?? 0),
                'total_variance'  => (float) ($costVariance->total_variance ?? 0),
            ],
            'recent_sales_orders' => $recentSalesOrders,
            'batch_progress'      => $batchProgress,
        ]);
    }
}
