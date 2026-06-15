<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\ProductionBatch;
use App\Models\ProductionDemand;
use App\Models\ProductionPlan;
use App\Models\InventoryBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Get aggregated dashboard statistics.
     * Caches result for 30 seconds to optimize performance.
     */
    public function index(): JsonResponse
    {
        $data = Cache::remember('mes_dashboard_stats', 30, function () {
            // Get finished/delivered status IDs dynamically from master config
            $finishedStatusIds = DB::table('global.production_batch_statuses')
                ->whereIn('status', ['Finished', 'Delivered'])
                ->pluck('id');

            // 1. Production Stats
            $todayStr = now()->toDateString();
            
            $targetToday = (float) DB::table('public.production_batches')
                ->where('planned_date', $todayStr)
                ->whereNull('deleted_at')
                ->sum('target_qty');

            // Calculate actual completed quantity today based on actual completion date
            $actualToday = (float) DB::table('public.production_batches')
                ->whereIn('batch_status_id', $finishedStatusIds)
                ->where(function($q) use ($todayStr) {
                    $q->whereDate('actual_end', $todayStr)
                      ->orWhere(function($sub) use ($todayStr) {
                          $sub->whereNull('actual_end')
                              ->where('planned_date', $todayStr);
                      });
                })
                ->whereNull('deleted_at')
                ->sum(DB::raw('CASE WHEN COALESCE(actual_qty, 0) > 0 THEN actual_qty ELSE target_qty END'));

            $achievement = $targetToday > 0 ? ($actualToday / $targetToday) * 100 : 0.0;

            $activeStatusIds = DB::table('global.production_batch_statuses')
                ->whereIn('status', ['Ready Material', 'Casting', 'Demolding', 'QC'])
                ->pluck('id');

            $activeBatches = DB::table('public.production_batches')
                ->whereIn('batch_status_id', $activeStatusIds)
                ->whereNull('deleted_at')
                ->count();

            $overdueBatches = DB::table('public.production_batches')
                ->where('planned_end', '<', now())
                ->whereNotIn('batch_status_id', $finishedStatusIds)
                ->whereNull('deleted_at')
                ->count();

            $moldUtilization = 0.0; // Will be calculated dynamically below based on actual mold usage

            // Calculate current shift and supervisor dynamically
            $currentHour = now()->hour;
            $activeShift = 'Shift Pagi';
            if ($currentHour >= 7 && $currentHour < 15) {
                $activeShift = 'Shift Pagi';
            } elseif ($currentHour >= 15 && $currentHour < 23) {
                $activeShift = 'Shift Sore';
            } else {
                $activeShift = 'Shift Malam';
            }

            $shiftRecord = DB::table('global.production_shifts as s')
                ->leftJoin('global.production_users as u', 's.supervisor_id', '=', 'u.id')
                ->where('s.aktif', true)
                ->where(function($q) use ($activeShift) {
                    $q->where('s.nama', $activeShift)
                      ->orWhere('s.nama', 'like', '%' . $activeShift . '%');
                })
                ->select('s.nama', 's.jam', 'u.name as supervisor_name')
                ->first();

            $shiftName = $shiftRecord ? ($shiftRecord->nama . ' (' . $shiftRecord->jam . ')') : $activeShift;
            $supervisorName = ($shiftRecord && $shiftRecord->supervisor_name) ? $shiftRecord->supervisor_name : 'Budi Santoso';

            // Calculate Work in Progress (WIP) quantity
            $wipQty = (float) DB::table('public.production_batches')
                ->whereIn('batch_status_id', $activeStatusIds)
                ->whereNull('deleted_at')
                ->sum('target_qty');

            // Calculate Mold usage dynamically from active production batches
            $activeBatchesMolds = DB::table('public.production_batches')
                ->whereIn('batch_status_id', $activeStatusIds)
                ->whereNull('deleted_at')
                ->whereNotNull('mold_id')
                ->select('mold_id', DB::raw('SUM(target_qty) as used_qty'))
                ->groupBy('mold_id')
                ->pluck('used_qty', 'mold_id')
                ->toArray();

            $molds = DB::table('global.production_molds')
                ->whereNull('deleted_at')
                ->get();

            $moldsTotal = 0;
            $moldsUsed = 0;

            foreach ($molds as $mold) {
                $moldsTotal += $mold->jumlah_total;
                $usedForThisType = (int) ($activeBatchesMolds[$mold->id] ?? 0);
                $usedForThisType = min($usedForThisType, $mold->jumlah_total);
                $moldsUsed += $usedForThisType;
            }

            $moldUtilization = $moldsTotal > 0 ? ($moldsUsed / $moldsTotal) * 100 : 0.0;

            // Calculate current day of active plans
            $activePlans = DB::table('public.production_plans')
                ->whereNotIn('status', ['Completed', 'Cancelled'])
                ->whereNull('deleted_at')
                ->get();

            $planDayCurrent = 1;
            $planDayTotal = 1;

            if ($activePlans->isNotEmpty()) {
                $earliestStart = null;
                $latestEnd = null;

                foreach ($activePlans as $plan) {
                    $start = $plan->start_date ?: $plan->period_start;
                    $end = $plan->end_date ?: $plan->period_end;

                    if ($start) {
                        if (!$earliestStart || $start < $earliestStart) {
                            $earliestStart = $start;
                        }
                    }
                    if ($end) {
                        if (!$latestEnd || $end > $latestEnd) {
                            $latestEnd = $end;
                        }
                    }
                }

                if ($earliestStart && $latestEnd) {
                    $startDate = \Carbon\Carbon::parse($earliestStart);
                    $endDate = \Carbon\Carbon::parse($latestEnd);
                    $today = now();

                    $planDayTotal = (int) ($startDate->diffInDays($endDate) + 1);
                    
                    if ($today->lt($startDate)) {
                        $planDayCurrent = 1;
                    } elseif ($today->gt($endDate)) {
                        $planDayCurrent = $planDayTotal;
                    } else {
                        $planDayCurrent = (int) ($startDate->diffInDays($today) + 1);
                    }
                }
            }

            // 1.1 Production Trend (Last 14 Days)
            $startDate = now()->subDays(13)->toDateString();
            $endDate = now()->toDateString();

            $batchSums = DB::table('public.production_batches')
                ->whereBetween('planned_date', [$startDate, $endDate])
                ->whereNull('deleted_at')
                ->selectRaw("
                    planned_date,
                    SUM(target_qty) as total_target,
                    SUM(CASE WHEN batch_status_id IN (" . ($finishedStatusIds->isEmpty() ? '0' : $finishedStatusIds->implode(',')) . ") THEN actual_qty ELSE 0 END) as total_actual
                ")
                ->groupBy('planned_date')
                ->get()
                ->keyBy(function($item) {
                    return \Carbon\Carbon::parse($item->planned_date)->toDateString();
                });

            $rejectSums = DB::table('public.production_qc_inspections')
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->selectRaw('tanggal, SUM(dimensi_reject) as total_reject')
                ->groupBy('tanggal')
                ->get()
                ->keyBy(function($item) {
                    return \Carbon\Carbon::parse($item->tanggal)->toDateString();
                });

            $trend14Days = [];
            for ($i = 13; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dateStr = $date->toDateString();
                $formattedDate = $date->translatedFormat('d M');

                $batchData = $batchSums->get($dateStr);
                $rejectData = $rejectSums->get($dateStr);

                $trend14Days[] = [
                    'tanggal'   => $formattedDate,
                    'target'    => $batchData ? (float) $batchData->total_target : 0.0,
                    'realisasi' => $batchData ? (float) $batchData->total_actual : 0.0,
                    'reject'    => $rejectData ? (float) $rejectData->total_reject : 0.0,
                ];
            }

            // 1.2 Monthly Production (Last 6 Months)
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth()->toDateString();
            $monthlySums = DB::table('public.production_batches')
                ->where('planned_date', '>=', $sixMonthsAgo)
                ->whereNull('deleted_at')
                ->selectRaw("
                    DATE_TRUNC('month', planned_date) as month_date,
                    SUM(target_qty) as total_target,
                    SUM(CASE WHEN batch_status_id IN (" . ($finishedStatusIds->isEmpty() ? '0' : $finishedStatusIds->implode(',')) . ") THEN actual_qty ELSE 0 END) as total_actual
                ")
                ->groupBy(DB::raw("DATE_TRUNC('month', planned_date)"))
                ->get()
                ->keyBy(function($item) {
                    return \Carbon\Carbon::parse($item->month_date)->format('Y-m');
                });

            $monthlyProduction = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $key = $date->format('Y-m');
                $formattedMonth = $date->translatedFormat('M');

                $monthData = $monthlySums->get($key);

                $monthlyProduction[] = [
                    'bulan'    => $formattedMonth,
                    'target'   => $monthData ? (float) $monthData->total_target : 0.0,
                    'produksi' => $monthData ? (float) $monthData->total_actual : 0.0,
                ];
            }

            // 1.3 Top Products (This Month)
            $topProducts = DB::table('public.production_batches as pb')
                ->join('global.production_products as pp', 'pb.product_id', '=', 'pp.id')
                ->whereMonth('pb.planned_date', now()->month)
                ->whereYear('pb.planned_date', now()->year)
                ->whereIn('pb.batch_status_id', $finishedStatusIds)
                ->whereNull('pb.deleted_at')
                ->selectRaw('pp.kode, pp.nama, SUM(pb.actual_qty) as total_qty')
                ->groupBy('pp.kode', 'pp.nama')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

            if ($topProducts->isEmpty()) {
                $topProducts = DB::table('public.production_inventory as pi')
                    ->join('global.production_products as pp', 'pi.product_id', '=', 'pp.id')
                    ->selectRaw('pp.kode, pp.nama, SUM(pi.stok) as total_qty')
                    ->groupBy('pp.kode', 'pp.nama')
                    ->orderByDesc('total_qty')
                    ->limit(5)
                    ->get();
            }

            $totalTopQty = $topProducts->sum('total_qty');
            $formattedTopProducts = $topProducts->map(function ($tp) use ($totalTopQty) {
                $qty = (float) $tp->total_qty;
                $percent = $totalTopQty > 0 ? round(($qty / $totalTopQty) * 100, 1) : 0.0;
                return [
                    'kode'   => $tp->kode,
                    'nama'   => $tp->nama,
                    'qty'    => $qty,
                    'persen' => $percent,
                ];
            })->toArray();

            // 1.4 Production Activity (Today's Timeline)
            $recentLogs = DB::table('public.production_batch_status_logs as psl')
                ->join('public.production_batches as pb', 'psl.production_batch_id', '=', 'pb.id')
                ->join('global.production_products as pp', 'pb.product_id', '=', 'pp.id')
                ->join('global.production_batch_statuses as bs', 'psl.to_status_id', '=', 'bs.id')
                ->leftJoin('global.production_work_centers as wc', 'pb.work_center_id', '=', 'wc.id')
                ->whereDate('psl.changed_at', now()->toDateString())
                ->select([
                    'psl.changed_at',
                    'pb.batch_number',
                    'pp.nama as product_name',
                    'pb.target_qty',
                    'bs.status as status_name',
                    'bs.warna',
                    'wc.name as work_center_name'
                ])
                ->orderByDesc('psl.changed_at')
                ->limit(10)
                ->get();

            if ($recentLogs->isEmpty()) {
                $recentLogs = DB::table('public.production_batch_status_logs as psl')
                    ->join('public.production_batches as pb', 'psl.production_batch_id', '=', 'pb.id')
                    ->join('global.production_products as pp', 'pb.product_id', '=', 'pp.id')
                    ->join('global.production_batch_statuses as bs', 'psl.to_status_id', '=', 'bs.id')
                    ->leftJoin('global.production_work_centers as wc', 'pb.work_center_id', '=', 'wc.id')
                    ->select([
                        'psl.changed_at',
                        'pb.batch_number',
                        'pp.nama as product_name',
                        'pb.target_qty',
                        'bs.status as status_name',
                        'bs.warna',
                        'wc.name as work_center_name'
                    ])
                    ->orderByDesc('psl.changed_at')
                    ->limit(10)
                    ->get();
            }

            $recentActivities = $recentLogs->map(function ($log) {
                $waktu = date('H:i', strtotime($log->changed_at));
                $status = 'info';
                $statusNameLower = strtolower($log->status_name);
                if (strpos($statusNameLower, 'finish') !== false) {
                    $status = 'success';
                } elseif (strpos($statusNameLower, 'qc') !== false) {
                    $status = 'info';
                } elseif (strpos($statusNameLower, 'cast') !== false) {
                    $status = 'warning';
                }

                return [
                    'waktu'     => $waktu,
                    'aktivitas' => 'Status: ' . $log->status_name,
                    'detail'    => $log->batch_number . ' - ' . $log->product_name . ' (' . round($log->target_qty) . ' unit)',
                    'line'      => $log->work_center_name ?: 'Batch',
                    'status'    => $status,
                ];
            })->toArray();

            // 2. Inventory Stats
            $finishedGoodsStock = (int) DB::table('public.production_inventory')->sum('stok');

            $materialValue = (float) DB::table('global.production_materials as pm')
                ->leftJoin('public.production_material_inventory as pmi', 'pm.id', '=', 'pmi.material_id')
                ->selectRaw('SUM(COALESCE(pmi.qty_on_hand, 0) * pm.harga) as val')
                ->value('val') ?: 0.0;

            $lowStockCount = DB::table('global.production_materials as pm')
                ->leftJoin('public.production_material_inventory as pmi', 'pm.id', '=', 'pmi.material_id')
                ->whereRaw('COALESCE(pmi.qty_on_hand, 0) <= pm.min_stok')
                ->whereRaw('COALESCE(pmi.qty_on_hand, 0) > 0.5 * pm.min_stok')
                ->count();

            $criticalStockCount = DB::table('global.production_materials as pm')
                ->leftJoin('public.production_material_inventory as pmi', 'pm.id', '=', 'pmi.material_id')
                ->whereRaw('COALESCE(pmi.qty_on_hand, 0) <= 0.5 * pm.min_stok')
                ->count();

            $agingStock = (int) DB::table('public.production_inventory')
                ->where(function ($query) {
                    $query->where('age_hari', '>', 30)
                          ->orWhere('tgl_produksi', '<', now()->subDays(30)->toDateString());
                })
                ->sum('stok');

            // 3. Delivery Stats
            $totalDeliveries = DB::table('public.production_delivery_orders')->count();
            $deliveredDeliveries = DB::table('public.production_delivery_orders')->where('status', 'Delivered')->count();
            $deliveryPerformance = $totalDeliveries > 0 ? ($deliveredDeliveries / $totalDeliveries) * 100 : 100.0;

            $pendingDelivery = DB::table('public.production_delivery_orders')
                ->whereNotIn('status', ['Delivered', 'Returned'])
                ->count();

            $todayDeliveryCount = DB::table('public.production_delivery_orders')
                ->where('tgl_kirim', $todayStr)
                ->count();

            // 4. Sales Order Stats
            $soDraft = SalesOrder::where('status', 'Draft')->count();
            $soApproved = SalesOrder::where('status', 'Approved')->count();
            $soProduction = SalesOrder::whereIn('status', ['Production', 'Planning'])->count();
            $soDelivered = SalesOrder::whereIn('status', ['Delivered', 'Completed'])->count();

            // 5. QC Stats
            $inspectionsToday = (int) DB::table('public.production_qc_inspections')
                ->where('tanggal', $todayStr)
                ->count();

            $passedToday = (int) DB::table('public.production_qc_inspections')
                ->where('tanggal', $todayStr)
                ->sum('dimensi_ok');

            $rejectedToday = (int) DB::table('public.production_qc_inspections')
                ->where('tanggal', $todayStr)
                ->sum('dimensi_reject');

            $qtyInspectedToday = (int) DB::table('public.production_qc_inspections')
                ->where('tanggal', $todayStr)
                ->sum('qty');

            $qcRejectRate = 0.0;
            if ($qtyInspectedToday > 0) {
                $qcRejectRate = round(($rejectedToday / $qtyInspectedToday) * 100, 2);
            }

            $qcStatusIds = DB::table('global.production_batch_statuses')
                ->where('aktif', true)
                ->whereRaw('LOWER(status) LIKE ?', ['%qc%'])
                ->pluck('id');

            $batchesWaitingQc = (int) DB::table('public.production_batches')
                ->whereIn('batch_status_id', $qcStatusIds)
                ->whereNull('deleted_at')
                ->count();

            $todayStr = date('Y-m-d');
            $startOfMonth = date('Y-m-01');
            $endOfMonth = date('Y-m-t');

            // --- REAL cost data only — no hardcoded fallbacks ---
            $todayCostRaw = DB::table('public.production_costs as pc')
                ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
                ->whereDate('pb.planned_date', $todayStr)
                ->whereNull('pb.deleted_at')
                ->sum('pc.total_cost');
            $todayCost = $todayCostRaw > 0 ? (float) $todayCostRaw : null;

            $monthlyCostRaw = DB::table('public.production_costs as pc')
                ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
                ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
                ->whereNull('pb.deleted_at')
                ->sum('pc.total_cost');
            $monthlyCost = $monthlyCostRaw > 0 ? (float) $monthlyCostRaw : null;

            $avgCostPerM3Raw = DB::table('public.production_costs as pc')
                ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
                ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
                ->whereNull('pb.deleted_at')
                ->selectRaw('SUM(pc.total_cost) / NULLIF(SUM(pb.target_volume_m3), 0) as avg_cost')
                ->value('avg_cost');
            $avgCostPerM3 = ($avgCostPerM3Raw !== null && $avgCostPerM3Raw > 0) ? (float) $avgCostPerM3Raw : null;

            // Monthly cost trend (last 6 months) — for chart
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth()->toDateString();
            $monthlyCostSums = DB::table('public.production_costs as pc')
                ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
                ->where('pb.planned_date', '>=', $sixMonthsAgo)
                ->whereNull('pb.deleted_at')
                ->selectRaw("DATE_TRUNC('month', pb.planned_date) as month_date, SUM(pc.total_cost) as total")
                ->groupBy(DB::raw("DATE_TRUNC('month', pb.planned_date)"))
                ->get()
                ->keyBy(function ($item) {
                    return \Carbon\Carbon::parse($item->month_date)->format('Y-m');
                });

            $monthlyCostTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $key  = $date->format('Y-m');
                $row  = $monthlyCostSums->get($key);
                $monthlyCostTrend[] = [
                    'bulan' => $date->translatedFormat('M y'),
                    'cost'  => $row ? (float) $row->total : null,
                ];
            }

            // Costing readiness: check if any WorkCenter has non-zero rates
            $wcWithRates = DB::table('global.production_work_centers')
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->where('standard_labor_rate_per_m3', '>', 0)
                      ->orWhere('standard_overhead_rate_per_m3', '>', 0);
                })
                ->count();
            $hasCostData   = $monthlyCostRaw > 0;
            $ratesConfigured = $wcWithRates > 0;

            // FG Inventory Value from InventoryBatch lot-level cost
            $fgInventoryValue = (float) DB::table('public.production_inventory_batches')
                ->whereIn('status', ['Available', 'Partial', 'Reserved'])
                ->whereRaw('qty_on_hand > 0')
                ->whereNotNull('cost_per_unit')
                ->selectRaw('SUM(qty_on_hand * cost_per_unit) as total_value')
                ->value('total_value') ?: 0.0;

            return [
                'production' => [
                    'target_today'       => $targetToday,
                    'actual_today'       => $actualToday,
                    'achievement'        => $achievement,
                    'active_batches'     => $activeBatches,
                    'overdue_batches'    => $overdueBatches,
                    'mold_utilization'   => $moldUtilization,
                    'trend_14_days'      => $trend14Days,
                    'monthly_production' => $monthlyProduction,
                    'top_products'       => $formattedTopProducts,
                    'recent_activities'  => $recentActivities,
                    'molds_used'         => $moldsUsed,
                    'molds_total'        => $moldsTotal,
                    'wip_qty'            => $wipQty,
                    'plan_day_current'   => $planDayCurrent,
                    'plan_day_total'     => $planDayTotal,
                    'shift_name'         => $shiftName,
                    'supervisor_name'    => $supervisorName,
                ],
                'inventory' => [
                    'finished_goods_stock' => $finishedGoodsStock,
                    'material_value'       => $materialValue,
                    'low_stock_count'      => $lowStockCount,
                    'critical_stock_count' => $criticalStockCount,
                    'aging_stock_qty'      => $agingStock,
                    'fg_inventory_value'   => $fgInventoryValue > 0 ? $fgInventoryValue : null,
                ],
                'delivery' => [
                    'performance'   => $deliveryPerformance,
                    'pending_count' => $pendingDelivery,
                    'today_count'   => $todayDeliveryCount,
                ],
                'sales_order' => [
                    'draft_count'      => $soDraft,
                    'approved_count'   => $soApproved,
                    'production_count' => $soProduction,
                    'delivered_count'  => $soDelivered,
                ],
                'qc' => [
                    'inspections_today'  => $inspectionsToday,
                    'passed_today'       => $passedToday,
                    'rejected_today'     => $rejectedToday,
                    'reject_rate'        => $qcRejectRate,
                    'batches_waiting_qc' => $batchesWaitingQc,
                ],
                'costing' => [
                    'today_production_cost'    => $todayCost,
                    'monthly_production_cost'  => $monthlyCost,
                    'average_cost_per_m3'      => $avgCostPerM3,
                    'monthly_cost_trend'       => $monthlyCostTrend,
                    'has_cost_data'            => $hasCostData,
                    'rates_configured'         => $ratesConfigured,
                ],
            ];
        });

        return response()->json($data);
    }
}
