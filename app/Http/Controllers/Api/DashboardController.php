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

            // Load active BOMs
            $activeBoms = DB::table('global.production_bom_headers')
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->get()
                ->keyBy('product_id');

            // Defensive costing validation warnings
            $financialWarnings = [];

            // Helper to get estimated/actual cost for a batch
            $getBatchCost = function ($batch, &$financialWarnings, $activeBoms) {
                $actual = DB::table('public.production_costs')
                    ->where('production_batch_id', $batch->id)
                    ->value('total_cost');

                if ($actual !== null && $actual > 0) {
                    return [
                        'cost' => (float) $actual,
                        'source' => 'ACTUAL'
                    ];
                }

                // Check BOM Snapshot
                $bomId = $batch->bom_header_id;
                $bom = null;
                if ($bomId) {
                    $bom = DB::table('global.production_bom_headers')
                        ->where('id', $bomId)
                        ->first();
                }

                // Fallback to active BOM
                if (!$bom) {
                    $bom = $activeBoms->get($batch->product_id);
                }

                if ($bom) {
                    $matCost = (float) $bom->total_material_cost;
                    $ohPct = (float) ($bom->overhead_pct ?? 0);
                    $costPerUnit = $matCost + ($ohPct / 100.0 * $matCost);
                    return [
                        'cost' => $costPerUnit * (float) $batch->target_qty,
                        'source' => 'BOM_ESTIMATE'
                    ];
                }

                // Exclude batch from cost calculations and record warning
                $financialWarnings[] = [
                    'type' => 'MISSING_BOM',
                    'batch_id' => $batch->id
                ];

                return [
                    'cost' => 0.0,
                    'source' => 'NO_DATA'
                ];
            };

            // Today's cost calculation
            $todayBatches = DB::table('public.production_batches')
                ->where('planned_date', $todayStr)
                ->whereNull('deleted_at')
                ->get();
            $todayCost = 0.0;
            foreach ($todayBatches as $b) {
                $cRes = $getBatchCost($b, $financialWarnings, $activeBoms);
                $todayCost += $cRes['cost'];
            }

            // Month's cost calculation
            $monthlyBatches = DB::table('public.production_batches')
                ->whereBetween('planned_date', [$startOfMonth, $endOfMonth])
                ->whereNull('deleted_at')
                ->get();
            $monthlyCost = 0.0;
            $actualCostsCount = 0;
            $estimatedCostsCount = 0;
            $noCostsCount = 0;

            foreach ($monthlyBatches as $b) {
                $cRes = $getBatchCost($b, $financialWarnings, $activeBoms);
                $monthlyCost += $cRes['cost'];
                if ($cRes['source'] === 'ACTUAL') {
                    $actualCostsCount++;
                } elseif ($cRes['source'] === 'BOM_ESTIMATE') {
                    $estimatedCostsCount++;
                } else {
                    $noCostsCount++;
                }
            }

            $hasCostData = ($monthlyCost > 0);
            $totalMonthlyCosted = $actualCostsCount + $estimatedCostsCount + $noCostsCount;
            $actualCostRatio = $totalMonthlyCosted > 0 ? (int) round(($actualCostsCount / $totalMonthlyCosted) * 100) : 0;
            $estimatedCostRatio = $totalMonthlyCosted > 0 ? (int) round(($estimatedCostsCount / $totalMonthlyCosted) * 100) : 0;

            $costSource = 'NO_DATA';
            $costConfidence = 'NONE';
            if ($actualCostsCount > 0) {
                $costSource = 'ACTUAL';
                $costConfidence = 'HIGH';
            } elseif ($estimatedCostsCount > 0) {
                $costSource = 'BOM_ESTIMATE';
                $costConfidence = 'MEDIUM';
            }

            $avgCostPerM3Raw = DB::table('public.production_costs as pc')
                ->join('public.production_batches as pb', 'pc.production_batch_id', '=', 'pb.id')
                ->whereBetween('pb.planned_date', [$startOfMonth, $endOfMonth])
                ->whereNull('pb.deleted_at')
                ->selectRaw('SUM(pc.total_cost) / NULLIF(SUM(pb.target_volume_m3), 0) as avg_cost')
                ->value('avg_cost');
            $avgCostPerM3 = ($avgCostPerM3Raw !== null && $avgCostPerM3Raw > 0) ? (float) $avgCostPerM3Raw : null;

            // Monthly cost trend (last 6 months) — for chart & series
            $monthlySeries = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $start = $date->copy()->startOfMonth()->toDateString();
                $end = $date->copy()->endOfMonth()->toDateString();
                $monthLabel = $date->format('M');

                // Cost for this month
                $monthBatches = DB::table('public.production_batches')
                    ->whereBetween('planned_date', [$start, $end])
                    ->whereNull('deleted_at')
                    ->get();
                $cMonthVal = 0.0;
                foreach ($monthBatches as $b) {
                    $cRes = $getBatchCost($b, $financialWarnings, $activeBoms);
                    $cMonthVal += $cRes['cost'];
                }

                // Revenue for this month
                $rMonthVal = (float) DB::table('public.production_sales_order_items as soi')
                    ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                    ->whereBetween('so.tgl_order', [$start, $end])
                    ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                    ->whereNull('so.deleted_at')
                    ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                $activity = ($rMonthVal > 0 || $cMonthVal > 0);

                $monthlySeries[] = [
                    'month' => $monthLabel,
                    'revenue' => $rMonthVal,
                    'cost' => $cMonthVal,
                    'margin' => $rMonthVal - $cMonthVal,
                    'activity' => $activity
                ];
            }

            // Month's Revenue
            $revenueMonth = (float) DB::table('public.production_sales_order_items as soi')
                ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                ->whereNull('so.deleted_at')
                ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

            // Revenue Delivered
            $revenueDelivered = (float) DB::table('public.production_sales_order_items as soi')
                ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                ->whereNull('so.deleted_at')
                ->sum(DB::raw('soi.qty_delivered * soi.unit_price'));

            // Revenue Pipeline
            $revenuePipeline = (float) DB::table('public.production_sales_order_items as soi')
                ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                ->whereIn('so.status', ['Draft', 'Submitted', 'Approved', 'Planning', 'Production'])
                ->whereNull('so.deleted_at')
                ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

            $grossMargin = $revenueMonth - $monthlyCost;
            $grossMarginPct = $revenueMonth > 0 ? ($grossMargin / $revenueMonth) * 100.0 : 0.0;

            // Sales Pipeline Breakdown
            $statusValues = DB::table('public.production_sales_order_items as soi')
                ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                ->whereNull('so.deleted_at')
                ->select('so.status', DB::raw('SUM(soi.qty_ordered * soi.unit_price) as total_val'))
                ->groupBy('so.status')
                ->pluck('total_val', 'so.status')
                ->toArray();

            $draftVal = (float) ($statusValues['Draft'] ?? 0.0) + (float) ($statusValues['Submitted'] ?? 0.0);
            $approvedVal = (float) ($statusValues['Approved'] ?? 0.0) + (float) ($statusValues['Planning'] ?? 0.0);
            $productionVal = (float) ($statusValues['Production'] ?? 0.0);
            $deliveredVal = (float) ($statusValues['Delivered'] ?? 0.0) + (float) ($statusValues['Completed'] ?? 0.0);

            $pipelineBreakdown = [
                'draft' => $draftVal,
                'approved' => $approvedVal,
                'production' => $productionVal,
                'delivered' => $deliveredVal,
            ];

            // Costing readiness: check if any WorkCenter has non-zero rates
            $wcWithRates = DB::table('global.production_work_centers')
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->where('standard_labor_rate_per_m3', '>', 0)
                      ->orWhere('standard_overhead_rate_per_m3', '>', 0);
                })
                ->count();
            $ratesConfigured = $wcWithRates > 0;

            // FG Inventory Value from InventoryBatch lot-level cost
            $fgInventoryValue = (float) DB::table('public.production_inventory_batches')
                ->whereIn('status', ['Available', 'Partial', 'Reserved'])
                ->whereRaw('qty_on_hand > 0')
                ->whereNotNull('cost_per_unit')
                ->selectRaw('SUM(qty_on_hand * cost_per_unit) as total_value')
                ->value('total_value') ?: 0.0;

            $monthlyCostTrend = [];
            foreach ($monthlySeries as $seriesItem) {
                $monthlyCostTrend[] = [
                    'bulan' => $seriesItem['month'],
                    'cost'  => $seriesItem['cost'] > 0 ? $seriesItem['cost'] : null,
                ];
            }

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
                    'today_production_cost'    => $todayCost > 0 ? $todayCost : null,
                    'monthly_production_cost'  => $monthlyCost > 0 ? $monthlyCost : null,
                    'average_cost_per_m3'      => $avgCostPerM3,
                    'monthly_cost_trend'       => $monthlyCostTrend,
                    'has_cost_data'            => $hasCostData,
                    'rates_configured'         => $ratesConfigured,
                ],
                'financial' => [
                    'revenue_month'      => $revenueMonth,
                    'revenue_delivered'  => $revenueDelivered,
                    'revenue_pipeline'   => $revenuePipeline,
                    'cost_month'         => $monthlyCost,
                    'gross_margin'       => $grossMargin,
                    'gross_margin_pct'   => $grossMarginPct,
                    'monthly_series'     => $monthlySeries,
                    'pipeline_breakdown' => $pipelineBreakdown,
                ],
                'financial_metadata' => [
                    'revenue_source'       => 'SALES_ORDER_ITEMS',
                    'cost_source'          => $costSource,
                    'cost_confidence'      => $costConfidence,
                    'actual_cost_ratio'    => $actualCostRatio,
                    'estimated_cost_ratio' => $estimatedCostRatio,
                    'last_calculated_at'   => now()->toDateTimeString(),
                ],
                'financial_warnings' => $financialWarnings,
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/dashboard/financial-health
     */
    public function financialHealth(): JsonResponse
    {
        $totalSO = DB::table('public.production_sales_orders')->whereNull('deleted_at')->count();
        
        $mismatches = DB::table('public.production_sales_orders as so')
            ->leftJoin('public.production_sales_order_items as soi', 'so.id', '=', 'soi.sales_order_id')
            ->select('so.id', DB::raw('so.nilai - COALESCE(SUM(soi.qty_ordered * soi.unit_price), 0) as diff'))
            ->groupBy('so.id', 'so.nilai')
            ->get();
        
        $mismatchCount = 0;
        foreach ($mismatches as $m) {
            if (abs((float)$m->diff) > 0.01) {
                $mismatchCount++;
            }
        }
        
        $revenueReadiness = $totalSO > 0 ? (int) round((($totalSO - $mismatchCount) / $totalSO) * 100) : 100;

        $finishedStatusIds = DB::table('global.production_batch_statuses')
            ->whereIn('status', ['Finished', 'Delivered'])
            ->pluck('id');
            
        $finishedBatches = DB::table('public.production_batches')
            ->whereIn('batch_status_id', $finishedStatusIds)
            ->whereNull('deleted_at')
            ->count();

        $batchesWithActualCost = DB::table('public.production_batches as pb')
            ->join('public.production_costs as pc', 'pb.id', '=', 'pc.production_batch_id')
            ->whereIn('pb.batch_status_id', $finishedStatusIds)
            ->whereNull('pb.deleted_at')
            ->count();

        $batchesWithoutCost = $finishedBatches - $batchesWithActualCost;
        
        $batchesWithBom = DB::table('public.production_batches')
            ->whereNotNull('bom_header_id')
            ->whereNull('deleted_at')
            ->count();
            
        $costReadiness = $finishedBatches > 0 ? (int) round((($batchesWithActualCost + min($batchesWithoutCost, $batchesWithBom)) / $finishedBatches) * 100) : 100;
        
        $marginReadiness = (int) round(($revenueReadiness + $costReadiness) / 2);
        
        $soItemsWithoutBom = DB::table('public.production_sales_order_items')->whereNull('bom_header_id')->count();
        $soItemsTotal = DB::table('public.production_sales_order_items')->count();
        $pipelineReadiness = $soItemsTotal > 0 ? (int) round((($soItemsTotal - $soItemsWithoutBom) / $soItemsTotal) * 100) : 100;

        $actualCostRatio = $finishedBatches > 0 ? (int) round(($batchesWithActualCost / $finishedBatches) * 100) : 0;
        $estimatedCostRatio = $finishedBatches > 0 ? (int) round(($batchesWithoutCost / $finishedBatches) * 100) : 0;

        $batchesWithoutBom = DB::table('public.production_batches')->whereNull('bom_header_id')->whereNull('deleted_at')->count();

        return response()->json([
            'revenue_readiness'   => $revenueReadiness,
            'cost_readiness'      => $costReadiness,
            'margin_readiness'    => $marginReadiness,
            'pipeline_readiness'  => $pipelineReadiness,
            'finished_batches'    => $finishedBatches,
            'batches_with_actual_cost' => $batchesWithActualCost,
            'batches_without_cost' => $batchesWithoutCost,
            'actual_cost_ratio'    => $actualCostRatio,
            'estimated_cost_ratio' => $estimatedCostRatio,
            'batches_without_bom' => $batchesWithoutBom,
            'so_items_without_bom' => $soItemsWithoutBom,
        ]);
    }

    /**
     * GET /api/dashboard/kpi-drilldown/{kpi}
     */
    public function kpiDrilldown(string $kpi): JsonResponse
    {
        $kpi = strtolower(trim($kpi));
        $todayStr = date('Y-m-d');
        $startOfMonth = date('Y-m-01');
        $endOfMonth = date('Y-m-t');

        // Resolve active batch status IDs dynamically
        $allStatuses = DB::table('global.production_batch_statuses')->where('aktif', true)->get();
        $activeStatusIds = $allStatuses->filter(function ($s) {
            $name = strtolower($s->status);
            $isPlanning = (strpos($name, 'planning') !== false || strpos($name, 'rencana') !== false || $s->kode === 'BS-01');
            $isClosed = (strpos($name, 'finished') !== false || strpos($name, 'delivered') !== false || strpos($name, 'completed') !== false || strpos($name, 'selesai') !== false || strpos($name, 'cancelled') !== false);
            return !$isPlanning && !$isClosed;
        })->pluck('id')->toArray();

        $finishedStatusIds = DB::table('global.production_batch_statuses')
            ->whereIn('status', ['Finished', 'Delivered', 'Completed'])
            ->pluck('id')
            ->toArray();

        $currentValue = '0';
        $formula = '';
        $source = '';
        $trend = [];
        $breakdown = [];
        $metadata = [
            'last_updated' => now()->format('d M Y H:i'),
            'confidence' => 'HIGH',
            'source_type' => 'ACTUAL'
        ];

        // Cost Confidence & Source fallback logic from database audit values
        $activeBoms = DB::table('global.production_bom_headers')
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->keyBy('product_id');

        $monthlyBatches = DB::table('public.production_batches')
            ->whereBetween('planned_date', [$startOfMonth, $endOfMonth])
            ->whereNull('deleted_at')
            ->get();

        $actualCostsCount = 0;
        $estimatedCostsCount = 0;
        $monthlyCost = 0.0;
        foreach ($monthlyBatches as $b) {
            $actualCost = DB::table('public.production_costs')->where('production_batch_id', $b->id)->value('total_cost');
            if ($actualCost !== null) {
                $actualCostsCount++;
                $monthlyCost += (float)$actualCost;
            } else {
                $bomHeaderId = $b->bom_header_id;
                if (!$bomHeaderId) {
                    $fallbackBom = $activeBoms->get($b->product_id);
                    $bomHeaderId = $fallbackBom ? $fallbackBom->id : null;
                }
                if ($bomHeaderId) {
                    $bomHeader = DB::table('global.production_bom_headers')->where('id', $bomHeaderId)->first();
                    if ($bomHeader) {
                        $estimatedCostsCount++;
                        $materialCost = (float)$bomHeader->total_material_cost;
                        $overheadPct = (float)$bomHeader->overhead_pct;
                        $standardCost = $materialCost * (1 + ($overheadPct / 100));
                        $monthlyCost += $standardCost * (float)$b->target_qty;
                    }
                }
            }
        }

        $costConfidence = 'NONE';
        $costSourceType = 'NO_DATA';
        if ($actualCostsCount > 0) {
            $costConfidence = 'HIGH';
            $costSourceType = 'ACTUAL';
        } elseif ($estimatedCostsCount > 0) {
            $costConfidence = 'MEDIUM';
            $costSourceType = 'BOM_ESTIMATE';
        }

        switch ($kpi) {
            case 'kpi-curing':
            case 'active-batch':
                $activeCount = DB::table('public.production_batches')
                    ->whereIn('batch_status_id', $activeStatusIds)
                    ->whereNull('deleted_at')
                    ->count();
                $currentValue = $activeCount . ' batch';
                $formula = 'Active Batch = Count(batch) dengan status non-planning & non-closed';
                $source = 'public.production_batches & global.production_batch_statuses';

                // Trend
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $dayLabel = $date->format('d M');
                    $dayEnd = $date->endOfDay()->toDateTimeString();
                    $trendCount = DB::table('public.production_batch_status_logs as l')
                        ->where('l.changed_at', '<=', $dayEnd)
                        ->whereIn('l.id', function ($query) use ($dayEnd) {
                            $query->select(DB::raw('MAX(id)'))
                                ->from('public.production_batch_status_logs')
                                ->where('changed_at', '<=', $dayEnd)
                                ->groupBy('production_batch_id');
                        })
                        ->whereIn('l.to_status_id', $activeStatusIds)
                        ->count();
                    $trend[] = ['day' => $dayLabel, 'value' => $trendCount];
                }

                // Breakdown
                $activeBatches = DB::table('public.production_batches')
                    ->whereIn('batch_status_id', $activeStatusIds)
                    ->whereNull('deleted_at')
                    ->get();
                $grouped = $activeBatches->groupBy('batch_status_id');
                foreach ($allStatuses as $s) {
                    if (in_array($s->id, $activeStatusIds)) {
                        $count = isset($grouped[$s->id]) ? $grouped[$s->id]->count() : 0;
                        $breakdown[] = [
                            'label' => $s->status,
                            'value' => $count,
                            'unit' => 'batch'
                        ];
                    }
                }
                break;

            case 'kpi-mold':
            case 'mold-utilization':
                $molds = DB::table('global.production_molds')->whereNull('deleted_at')->get();
                $totalMolds = $molds->sum('jumlah_aktif');
                $maintenanceTotal = $molds->sum(function($m) { return max(0, $m->jumlah_total - $m->jumlah_aktif); });

                $activeBatchesMolds = DB::table('public.production_batches')
                    ->whereIn('batch_status_id', $activeStatusIds)
                    ->whereNull('deleted_at')
                    ->whereNotNull('mold_id')
                    ->select('mold_id', DB::raw('SUM(target_qty) as used_qty'))
                    ->groupBy('mold_id')
                    ->pluck('used_qty', 'mold_id')
                    ->toArray();

                $moldsUsed = 0;
                foreach ($molds as $mold) {
                    $usedQty = (int)($activeBatchesMolds[$mold->id] ?? 0);
                    $moldsUsed += min($usedQty, $mold->jumlah_aktif);
                }

                $utilVal = $totalMolds > 0 ? round(($moldsUsed / $totalMolds) * 100, 1) : 0;
                $currentValue = $utilVal . '%';
                $formula = 'Mold Utilization (%) = (Used Molds ÷ Total Available Molds) * 100';
                $source = 'global.production_molds & public.production_batches';

                // Trend
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $dayLabel = $date->format('d M');
                    $dayEnd = $date->endOfDay()->toDateTimeString();
                    
                    $activeBatchIdsOnDay = DB::table('public.production_batch_status_logs as l')
                        ->where('l.changed_at', '<=', $dayEnd)
                        ->whereIn('l.id', function ($query) use ($dayEnd) {
                            $query->select(DB::raw('MAX(id)'))
                                ->from('public.production_batch_status_logs')
                                ->where('changed_at', '<=', $dayEnd)
                                ->groupBy('production_batch_id');
                        })
                        ->whereIn('l.to_status_id', $activeStatusIds)
                        ->pluck('production_batch_id')
                        ->toArray();

                    $batchesOnDay = DB::table('public.production_batches')
                        ->whereIn('id', $activeBatchIdsOnDay)
                        ->whereNotNull('mold_id')
                        ->get();

                    $usedOnDay = 0;
                    $groupedOnDay = $batchesOnDay->groupBy('mold_id');
                    foreach ($molds as $mold) {
                        $usedQtyOnDay = isset($groupedOnDay[$mold->id]) ? $groupedOnDay[$mold->id]->sum('target_qty') : 0;
                        $usedOnDay += min($usedQtyOnDay, $mold->jumlah_aktif);
                    }
                    $dayUtil = $totalMolds > 0 ? round(($usedOnDay / $totalMolds) * 100, 1) : 0;
                    $trend[] = ['day' => $dayLabel, 'value' => $dayUtil];
                }

                // Breakdown
                $breakdown = [
                    ['label' => 'Molds Used (Casting / Active)', 'value' => $moldsUsed, 'unit' => 'mold'],
                    ['label' => 'Molds Idle (Ready)', 'value' => max(0, $totalMolds - $moldsUsed), 'unit' => 'mold'],
                    ['label' => 'Molds Maintenance / Damaged', 'value' => $maintenanceTotal, 'unit' => 'mold'],
                ];
                break;

            case 'kpi-qc':
            case 'overdue-batch':
                $overdueBatches = DB::table('public.production_batches')
                    ->where('planned_end', '<', now())
                    ->whereIn('batch_status_id', $activeStatusIds)
                    ->whereNull('deleted_at')
                    ->get();
                $currentValue = $overdueBatches->count() . ' batch';
                $formula = 'Overdue Batch = Count(batch) aktif dengan planned_end < NOW()';
                $source = 'public.production_batches';

                // Trend
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $dayLabel = $date->format('d M');
                    $dayEnd = $date->endOfDay()->toDateTimeString();

                    $overdueOnDayCount = DB::table('public.production_batches as pb')
                        ->where('pb.planned_end', '<', $dayEnd)
                        ->whereNull('pb.deleted_at')
                        ->whereIn('pb.id', function ($query) use ($dayEnd, $activeStatusIds) {
                            $query->select('production_batch_id')
                                ->from('public.production_batch_status_logs')
                                ->where('changed_at', '<=', $dayEnd)
                                ->whereIn('id', function ($sub) use ($dayEnd) {
                                    $sub->select(DB::raw('MAX(id)'))
                                        ->from('public.production_batch_status_logs')
                                        ->where('changed_at', '<=', $dayEnd)
                                        ->groupBy('production_batch_id');
                                })
                                ->whereIn('to_status_id', $activeStatusIds);
                        })
                        ->count();
                    $trend[] = ['day' => $dayLabel, 'value' => $overdueOnDayCount];
                }

                // Breakdown
                $b1to3 = 0; $b4to7 = 0; $bMore7 = 0;
                foreach ($overdueBatches as $b) {
                    $days = now()->diffInDays(\Carbon\Carbon::parse($b->planned_end));
                    if ($days <= 3) $b1to3++;
                    elseif ($days <= 7) $b4to7++;
                    else $bMore7++;
                }
                $breakdown = [
                    ['label' => 'Overdue 1-3 Days', 'value' => $b1to3, 'unit' => 'batch'],
                    ['label' => 'Overdue 4-7 Days', 'value' => $b4to7, 'unit' => 'batch'],
                    ['label' => 'Overdue > 7 Days', 'value' => $bMore7, 'unit' => 'batch'],
                ];
                break;

            case 'kpi-realisasi':
            case 'production-output':
                $qtyToday = (float) DB::table('public.production_batches')
                    ->whereIn('batch_status_id', $finishedStatusIds)
                    ->where(function($q) use ($todayStr) {
                        $q->whereDate('actual_end', $todayStr)
                          ->orWhere(function($q2) use ($todayStr) {
                              $q2->whereNull('actual_end')
                                ->whereDate('planned_date', $todayStr);
                          });
                    })
                    ->whereNull('deleted_at')
                    ->sum(DB::raw('CASE WHEN COALESCE(actual_qty, 0) > 0 THEN actual_qty ELSE target_qty END'));

                $currentValue = $qtyToday . ' unit';
                $formula = 'Production Output = Σ actual_qty dari batch berstatus Finished hari ini';
                $source = 'public.production_batches';

                // Trend
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $dayLabel = $date->format('d M');
                    $dayStr = $date->toDateString();
                    $trendQty = (float) DB::table('public.production_batches')
                        ->whereIn('batch_status_id', $finishedStatusIds)
                        ->where(function($q) use ($dayStr) {
                            $q->whereDate('actual_end', $dayStr)
                              ->orWhere(function($q2) use ($dayStr) {
                                  $q2->whereNull('actual_end')
                                    ->whereDate('planned_date', $dayStr);
                              });
                        })
                        ->whereNull('deleted_at')
                        ->sum(DB::raw('CASE WHEN COALESCE(actual_qty, 0) > 0 THEN actual_qty ELSE target_qty END'));
                    $trend[] = ['day' => $dayLabel, 'value' => $trendQty];
                }

                // Breakdown
                $todayCategories = DB::table('public.production_batches as pb')
                    ->join('global.production_products as p', 'pb.product_id', '=', 'p.id')
                    ->whereIn('pb.batch_status_id', $finishedStatusIds)
                    ->where(function($q) use ($todayStr) {
                        $q->whereDate('pb.actual_end', $todayStr)
                          ->orWhere(function($q2) use ($todayStr) {
                              $q2->whereNull('pb.actual_end')
                                ->whereDate('pb.planned_date', $todayStr);
                          });
                    })
                    ->whereNull('pb.deleted_at')
                    ->select('p.kategori', DB::raw("SUM(CASE WHEN COALESCE(pb.actual_qty, 0) > 0 THEN pb.actual_qty ELSE pb.target_qty END) as total"))
                    ->groupBy('p.kategori')
                    ->get();

                foreach ($todayCategories as $row) {
                    $breakdown[] = [
                        'label' => $row->kategori ?: 'Lainnya',
                        'value' => (float)$row->total,
                        'unit' => 'unit'
                    ];
                }
                break;

            case 'kpi-qc-pass':
            case 'qc':
                $qcSums = DB::table('public.production_qc_inspections')
                    ->where('tanggal', $todayStr)
                    ->selectRaw('SUM(COALESCE(qty_passed, dimensi_ok, 0)) as passed, SUM(COALESCE(qty_rejected, dimensi_reject, 0)) as rejected')
                    ->first();
                $passed = (float)($qcSums->passed ?? 0);
                $rejected = (float)($qcSums->rejected ?? 0);
                $total = $passed + $rejected;
                $currentValue = $total > 0 ? round(($passed / $total) * 100, 1) . '%' : '100%';
                $formula = 'QC Pass Rate (%) = (Passed Inspections ÷ Total Inspections) * 100';
                $source = 'public.production_qc_inspections';

                // Trend
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $dayLabel = $date->format('d M');
                    $dayStr = $date->toDateString();
                    $daySums = DB::table('public.production_qc_inspections')
                        ->where('tanggal', $dayStr)
                        ->selectRaw('SUM(COALESCE(qty_passed, dimensi_ok, 0)) as passed, SUM(COALESCE(qty_rejected, dimensi_reject, 0)) as rejected')
                        ->first();
                    $dp = (float)($daySums->passed ?? 0);
                    $dr = (float)($daySums->rejected ?? 0);
                    $dt = $dp + $dr;
                    $pRate = $dt > 0 ? round(($dp / $dt) * 100, 1) : 100.0;
                    $trend[] = ['day' => $dayLabel, 'value' => $pRate];
                }

                // Breakdown
                $defects = DB::table('public.production_qc_defects as d')
                    ->join('global.production_defect_categories as c', 'd.defect_category_id', '=', 'c.id')
                    ->select('c.nama', DB::raw('SUM(d.qty) as total_qty'))
                    ->groupBy('c.nama')
                    ->get();
                foreach ($defects as $d) {
                    $breakdown[] = [
                        'label' => $d->nama,
                        'value' => (int)$d->total_qty,
                        'unit' => 'defect'
                    ];
                }
                if (empty($breakdown)) {
                    $allPassed = DB::table('public.production_qc_inspections')->sum(DB::raw('COALESCE(qty_passed, dimensi_ok, 0)'));
                    $allRejected = DB::table('public.production_qc_inspections')->sum(DB::raw('COALESCE(qty_rejected, dimensi_reject, 0)'));
                    $breakdown = [
                        ['label' => 'Total Passed Quantity', 'value' => (int)$allPassed, 'unit' => 'unit'],
                        ['label' => 'Total Rejected Quantity', 'value' => (int)$allRejected, 'unit' => 'unit'],
                    ];
                }
                break;

            case 'kpi-revenue-month':
            case 'revenue':
                $revenueMonth = (float) DB::table('public.production_sales_order_items as soi')
                    ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                    ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                    ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                    ->whereNull('so.deleted_at')
                    ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                $currentValue = 'Rp ' . number_format($revenueMonth, 0, ',', '.');
                $formula = 'Revenue Month = Σ (qty_ordered * unit_price) SO item bulan ini';
                $source = 'public.production_sales_order_items & public.production_sales_orders';

                // Trend (6 Months)
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $start = $date->copy()->startOfMonth()->toDateString();
                    $end = $date->copy()->endOfMonth()->toDateString();
                    $monthLabel = $date->format('M');
                    $rMonthVal = (float) DB::table('public.production_sales_order_items as soi')
                        ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                        ->whereBetween('so.tgl_order', [$start, $end])
                        ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                        ->whereNull('so.deleted_at')
                        ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));
                    $trend[] = ['day' => $monthLabel, 'value' => $rMonthVal];
                }

                // Breakdown by customer
                $customerRevenues = DB::table('public.production_sales_order_items as soi')
                    ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                    ->join('global.production_customers as c', 'so.customer_id', '=', 'c.id')
                    ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                    ->whereNull('so.deleted_at')
                    ->select('c.nama', DB::raw('SUM(soi.qty_ordered * soi.unit_price) as total'))
                    ->groupBy('c.nama')
                    ->limit(5)
                    ->get();
                foreach ($customerRevenues as $row) {
                    $breakdown[] = [
                        'label' => $row->nama,
                        'value' => (float)$row->total,
                        'unit' => 'IDR'
                    ];
                }
                if (empty($breakdown)) {
                    $breakdown = [
                        ['label' => 'Approved Revenue', 'value' => (float)DB::table('public.production_sales_order_items as soi')->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')->where('so.status', 'Approved')->whereNull('so.deleted_at')->sum(DB::raw('soi.qty_ordered * soi.unit_price')), 'unit' => 'IDR'],
                        ['label' => 'Production Revenue', 'value' => (float)DB::table('public.production_sales_order_items as soi')->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')->where('so.status', 'Production')->whereNull('so.deleted_at')->sum(DB::raw('soi.qty_ordered * soi.unit_price')), 'unit' => 'IDR'],
                    ];
                }
                break;

            case 'kpi-cost-month-fin':
            case 'cost':
                $currentValue = 'Rp ' . number_format($monthlyCost, 0, ',', '.');
                $formula = 'Cost Month = Σ standard / actual batch cost bulan ini';
                $source = 'public.production_costs & global.production_bom_headers';
                $metadata['confidence'] = $costConfidence;
                $metadata['source_type'] = $costSourceType;

                // Trend (6 Months)
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $start = $date->copy()->startOfMonth()->toDateString();
                    $end = $date->copy()->endOfMonth()->toDateString();
                    $monthLabel = $date->format('M');

                    $monthBatches = DB::table('public.production_batches')
                        ->whereBetween('planned_date', [$start, $end])
                        ->whereNull('deleted_at')
                        ->get();
                    $cMonthVal = 0.0;
                    foreach ($monthBatches as $b) {
                        $actualCost = DB::table('public.production_costs')->where('production_batch_id', $b->id)->value('total_cost');
                        if ($actualCost !== null) {
                            $cMonthVal += (float)$actualCost;
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
                                    $cMonthVal += $standardCost * (float)$b->target_qty;
                                }
                            }
                        }
                    }
                    $trend[] = ['day' => $monthLabel, 'value' => $cMonthVal];
                }

                // Breakdown: ACTUAL vs BOM_ESTIMATE
                $actualSum = 0.0;
                $bomSum = 0.0;
                foreach ($monthlyBatches as $b) {
                    $actualCost = DB::table('public.production_costs')->where('production_batch_id', $b->id)->value('total_cost');
                    if ($actualCost !== null) {
                        $actualSum += (float)$actualCost;
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
                                $bomSum += $standardCost * (float)$b->target_qty;
                            }
                        }
                    }
                }
                $breakdown = [
                    ['label' => 'Actual Production Cost (ACTUAL)', 'value' => $actualSum, 'unit' => 'IDR'],
                    ['label' => 'Standard Costing Estimate (BOM_ESTIMATE)', 'value' => $bomSum, 'unit' => 'IDR'],
                ];
                break;

            case 'kpi-gross-margin':
            case 'gross-margin':
                $revenueMonth = (float) DB::table('public.production_sales_order_items as soi')
                    ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                    ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                    ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                    ->whereNull('so.deleted_at')
                    ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                $marginVal = $revenueMonth - $monthlyCost;

                $currentValue = 'Rp ' . number_format($marginVal, 0, ',', '.');
                $formula = 'Gross Margin = Revenue - Cost';
                $source = 'Kombinasi Revenue & Cost Month';
                $metadata['confidence'] = $costConfidence;
                $metadata['source_type'] = $costSourceType;

                // Trend (6 Months)
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $start = $date->copy()->startOfMonth()->toDateString();
                    $end = $date->copy()->endOfMonth()->toDateString();
                    $monthLabel = $date->format('M');

                    // Month Cost
                    $monthBatches = DB::table('public.production_batches')
                        ->whereBetween('planned_date', [$start, $end])
                        ->whereNull('deleted_at')
                        ->get();
                    $cMonthVal = 0.0;
                    foreach ($monthBatches as $b) {
                        $actualCost = DB::table('public.production_costs')->where('production_batch_id', $b->id)->value('total_cost');
                        if ($actualCost !== null) {
                            $cMonthVal += (float)$actualCost;
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
                                    $cMonthVal += $standardCost * (float)$b->target_qty;
                                }
                            }
                        }
                    }

                    // Month Revenue
                    $rMonthVal = (float) DB::table('public.production_sales_order_items as soi')
                        ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                        ->whereBetween('so.tgl_order', [$start, $end])
                        ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                        ->whereNull('so.deleted_at')
                        ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                    $mMonthVal = $rMonthVal - $cMonthVal;
                    $trend[] = ['day' => $monthLabel, 'value' => $mMonthVal];
                }

                $breakdown = [
                    ['label' => 'Total Revenue Month', 'value' => $revenueMonth, 'unit' => 'IDR'],
                    ['label' => 'Total Cost Month', 'value' => $monthlyCost, 'unit' => 'IDR'],
                ];
                break;

            case 'kpi-margin-pct':
            case 'margin':
                $revenueMonth = (float) DB::table('public.production_sales_order_items as soi')
                    ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                    ->whereBetween('so.tgl_order', [$startOfMonth, $endOfMonth])
                    ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                    ->whereNull('so.deleted_at')
                    ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                $marginVal = $revenueMonth - $monthlyCost;
                $marginPct = $revenueMonth > 0 ? round(($marginVal / $revenueMonth) * 100, 1) : 0.0;

                $currentValue = $marginPct . '%';
                $formula = 'Gross Margin (%) = ((Revenue - Cost) ÷ Revenue) * 100';
                $source = 'Kombinasi Revenue & Cost Month';
                $metadata['confidence'] = $costConfidence;
                $metadata['source_type'] = $costSourceType;

                // Trend (6 Months)
                for ($i = 5; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $start = $date->copy()->startOfMonth()->toDateString();
                    $end = $date->copy()->endOfMonth()->toDateString();
                    $monthLabel = $date->format('M');

                    // Month Cost
                    $monthBatches = DB::table('public.production_batches')
                        ->whereBetween('planned_date', [$start, $end])
                        ->whereNull('deleted_at')
                        ->get();
                    $cMonthVal = 0.0;
                    foreach ($monthBatches as $b) {
                        $actualCost = DB::table('public.production_costs')->where('production_batch_id', $b->id)->value('total_cost');
                        if ($actualCost !== null) {
                            $cMonthVal += (float)$actualCost;
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
                                    $cMonthVal += $standardCost * (float)$b->target_qty;
                                }
                            }
                        }
                    }

                    // Month Revenue
                    $rMonthVal = (float) DB::table('public.production_sales_order_items as soi')
                        ->join('public.production_sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
                        ->whereBetween('so.tgl_order', [$start, $end])
                        ->whereIn('so.status', ['Approved', 'Planning', 'Production', 'Delivered', 'Completed'])
                        ->whereNull('so.deleted_at')
                        ->sum(DB::raw('soi.qty_ordered * soi.unit_price'));

                    $mMonthVal = $rMonthVal - $cMonthVal;
                    $mMonthPct = $rMonthVal > 0 ? round(($mMonthVal / $rMonthVal) * 100, 1) : 0.0;
                    $trend[] = ['day' => $monthLabel, 'value' => $mMonthPct];
                }

                // Breakdown High vs Low margin
                $products = DB::table('global.production_products as p')->where('aktif', true)->get();
                $highMarginCount = 0;
                $lowMarginCount = 0;
                foreach ($products as $p) {
                    $price = (float)$p->harga;
                    if ($price <= 0) continue;
                    $bom = $activeBoms->get($p->id);
                    if ($bom) {
                        $materialCost = (float)$bom->total_material_cost;
                        $overheadPct = (float)$bom->overhead_pct;
                        $cost = $materialCost * (1 + ($overheadPct / 100));
                        $margin = ($price - $cost) / $price * 100;
                        if ($margin >= 30) {
                            $highMarginCount++;
                        } else {
                            $lowMarginCount++;
                        }
                    } else {
                        $lowMarginCount++;
                    }
                }
                $breakdown = [
                    ['label' => 'High Margin Products (>= 30%)', 'value' => $highMarginCount, 'unit' => 'produk'],
                    ['label' => 'Low Margin Products (< 30%)', 'value' => $lowMarginCount, 'unit' => 'produk']
                ];
                break;

            default:
                $currentValue = '0';
                $formula = 'KPI not supported';
                $source = 'N/A';
                $metadata['confidence'] = 'NONE';
                $metadata['source_type'] = 'NO_DATA';
                break;
        }

        return response()->json([
            'current_value' => $currentValue,
            'formula'       => $formula,
            'source'        => $source,
            'trend'         => $trend,
            'breakdown'     => $breakdown,
            'metadata'      => $metadata
        ]);
    }
}
