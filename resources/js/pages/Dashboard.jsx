import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import KPIDrilldownDialog from "@/components/shared/KPIDrilldownDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { showExportToast } from "@/components/shared/FilterPopover";
import { toast } from "sonner";
import { FactoryHero } from "@/components/visuals/IndustrialVisuals";
import ProductIcon from "@/components/visuals/ProductIcon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import {
  Target, TrendingUp, Thermometer, ShieldCheck, AlertTriangle, Package,
  Boxes, Hammer, Activity, Download, RefreshCw, AlertCircle
} from "lucide-react";
import { formatNumber, formatRupiah, company } from "@/data/mockData";

const activityIconMap = {
  success: { bg: "#E6F5EC", color: "#107E3E", icon: ShieldCheck },
  error: { bg: "#FBE6E9", color: "#B00020", icon: AlertTriangle },
  warning: { bg: "#FDF3E7", color: "#E9730C", icon: Activity },
  info: { bg: "#E5F0FA", color: "#0A6ED1", icon: Hammer },
};

const getKpiDefinitions = (data) => {
  const p = data?.production || {};
  const inv = data?.inventory || {};
  const d = data?.delivery || {};
  const cost = data?.costing || {};

  return {
    "kpi-target": {
      label: "Production Target",
      formula: "Target = Σ target_qty dari batch produksi hari ini",
      dataSource: "Production Batches (planned_date = today)",
      deskripsi: "Jumlah unit yang direncanakan untuk diproduksi hari ini berdasarkan batch yang dijadwalkan.",
      navigation_path: "/planning",
      breakdown: [
        { label: "Target Hari Ini", value: p.target_today || 0, unit: "unit", color: "#59687A" }
      ]
    },
    "kpi-realisasi": {
      label: "Actual Today",
      formula: "Realisasi = Σ actual_qty dari batch berstatus Finished hari ini",
      dataSource: "Production Batches (status = Finished)",
      deskripsi: "Jumlah unit aktual yang telah selesai dicetak hari ini.",
      navigation_path: "/production-execution",
      breakdown: [
        { label: "Realisasi Selesai", value: p.actual_today || 0, unit: "unit", color: "#107E3E" }
      ]
    },
    "kpi-achievement": {
      label: "Achievement",
      formula: "Achievement (%) = (Realisasi ÷ Target) × 100",
      dataSource: "Dihitung dari Target & Realisasi Hari Ini",
      deskripsi: "Persentase realisasi dibanding target produksi.",
      navigation_path: "/production-execution",
      breakdown: [
        { label: "Realisasi", value: p.actual_today || 0, unit: "unit", color: "#107E3E" },
        { label: "Target", value: p.target_today || 0, unit: "unit", color: "#59687A" },
        { label: "Achievement", value: `${(p.achievement || 0).toFixed(1)}%`, color: "#0A6ED1" }
      ]
    },
    "kpi-curing": {
      label: "Active Batch",
      formula: "Active Batch = Count(batch) dengan status Ready Material, Casting, atau QC",
      dataSource: "Production Batches (aktif)",
      deskripsi: "Jumlah batch produksi yang saat ini sedang aktif berjalan di area pabrik.",
      navigation_path: "/curing",
      breakdown: [
        { label: "Batch Aktif", value: p.active_batches || 0, unit: "batch", color: "#0A6ED1" }
      ]
    },
    "kpi-qc": {
      label: "Overdue Batch",
      formula: "Overdue = Count(batch) belum selesai & planned_end < NOW",
      dataSource: "Production Batches (terlambat)",
      deskripsi: "Jumlah batch produksi yang melewati batas waktu penyelesaian yang direncanakan.",
      navigation_path: "/production-execution",
      breakdown: [
        { label: "Batch Terlambat", value: p.overdue_batches || 0, unit: "batch", color: "#B00020" }
      ]
    },
    "kpi-reject": {
      label: "Low Stock Material",
      formula: "Low Stock = Count(material) dengan qty_on_hand ≤ min_stok dan > 0.5 * min_stok",
      dataSource: "Material Inventory",
      deskripsi: "Bahan baku yang kuantitas stoknya saat ini berada di bawah batas minimum stok aman.",
      navigation_path: "/inventory",
      breakdown: [
        { label: "Stok Rendah (Low)", value: inv.low_stock_count || 0, unit: "item", color: "#E9730C" },
        { label: "Stok Kritis (Critical)", value: inv.critical_stock_count || 0, unit: "item", color: "#B00020" }
      ]
    },
    "kpi-stok": {
      label: "Finished Goods Stock",
      formula: "FG Stock = Σ stok produk jadi di gudang utama",
      dataSource: "Inventory Finished Goods",
      deskripsi: "Total produk jadi yang siap dikirim dan berada di gudang Finished Goods.",
      navigation_path: "/inventory",
      breakdown: [
        { label: "Stok Gudang FG", value: inv.finished_goods_stock || 0, unit: "unit", color: "#107E3E" }
      ]
    },
    "kpi-material": {
      label: "Material Inventory Value",
      formula: "Inventory Value = Σ (qty_on_hand * harga) untuk semua bahan baku",
      dataSource: "Material Inventory & Master Harga",
      deskripsi: "Nilai valuasi finansial dari seluruh stok bahan baku yang tersimpan saat ini.",
      navigation_path: "/inventory",
      breakdown: [
        { label: "Total Valuasi", value: formatRupiah(inv.material_value || 0), color: "#0A6ED1" }
      ]
    },
    "kpi-mold": {
      label: "Mold Utilization",
      formula: "Average Mold Utilization (%) = AVG(utilisasi) dari semua cetakan aktif",
      dataSource: "Master Cetakan",
      deskripsi: "Rata-rata utilitas penggunaan cetakan aktif saat ini.",
      navigation_path: "/master-data",
      breakdown: [
        { label: "Utilisasi Cetakan", value: `${(p.mold_utilization || 0).toFixed(1)}%`, color: "#107E3E" }
      ]
    },
    "kpi-wip": {
      label: "Stock Aging > 30d",
      formula: "Aging Stock = Σ stok produk jadi dengan umur simpan > 30 hari",
      dataSource: "Inventory Finished Goods (tgl_produksi)",
      deskripsi: "Volume produk jadi yang telah tersimpan di gudang melebihi 30 hari sejak tanggal produksi.",
      navigation_path: "/inventory",
      breakdown: [
        { label: "Stok Usang (> 30 hari)", value: inv.aging_stock_qty || 0, unit: "unit", color: "#E9730C" }
      ]
    },
    "kpi-efisiensi": {
      label: "Delivery Performance",
      formula: "Delivery Performance (%) = (Σ DO status Delivered ÷ Σ Total DO) * 100",
      dataSource: "Delivery Orders",
      deskripsi: "Persentase ketepatan waktu pengiriman yang sukses diselesaikan.",
      navigation_path: "/delivery",
      breakdown: [
        { label: "Delivery Performance", value: `${(d.performance || 0).toFixed(1)}%`, color: "#107E3E" }
      ]
    },
    "kpi-jadi-hari": {
      label: "Pending Delivery",
      formula: "Pending Delivery = Count(DO) dengan status belum terkirim (Pending, Confirmed, Loading, In Transit)",
      dataSource: "Delivery Orders (aktif)",
      deskripsi: "Jumlah order pengiriman yang saat ini sedang diproses atau antri dikirim.",
      navigation_path: "/delivery",
      breakdown: [
        { label: "Order Pending", value: d.pending_count || 0, unit: "DO", color: "#E9730C" },
        { label: "Pengiriman Hari Ini", value: d.today_count || 0, unit: "DO", color: "#0A6ED1" }
      ]
    },
    "kpi-cost-today": {
      label: "Production Cost Today",
      formula: "Cost Today = Σ total_cost dari batch produksi hari ini",
      dataSource: "Production Costs (planned_date = today)",
      deskripsi: cost.today_production_cost != null
        ? "Total biaya standar produksi dari batch yang dijadwalkan hari ini."
        : "Belum ada data biaya hari ini. Pastikan batch sudah mencapai status Casting.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Biaya Hari Ini", value: cost.today_production_cost != null ? cost.today_production_cost : "Belum ada data", unit: cost.today_production_cost != null ? "Rp" : "", color: "#0A6ED1" }
      ]
    },
    "kpi-cost-month": {
      label: "Production Cost This Month",
      formula: "Cost This Month = Σ total_cost dari batch produksi bulan ini",
      dataSource: "Production Costs (planned_date = this month)",
      deskripsi: cost.monthly_production_cost != null
        ? "Total biaya standar produksi dari batch yang dijadwalkan bulan ini."
        : "Belum ada data biaya bulan ini. Data muncul setelah batch mencapai status Casting.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Biaya Bulan Ini", value: cost.monthly_production_cost != null ? cost.monthly_production_cost : "Belum ada data", unit: cost.monthly_production_cost != null ? "Rp" : "", color: "#E9730C" }
      ]
    },
    "kpi-cost-avg": {
      label: "Average Cost per m\u00b3",
      formula: "Average Cost = Total Cost Month ÷ Total Volume Month",
      dataSource: "Production Costs & Batches",
      deskripsi: cost.average_cost_per_m3 != null
        ? "Rata-rata biaya standar produksi per meter kubik untuk bulan ini."
        : "Belum ada data biaya per m\u00b3. Pastikan target_volume_m3 diisi pada batch produksi.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Rata-rata / m\u00b3", value: cost.average_cost_per_m3 != null ? cost.average_cost_per_m3 : "Belum ada data", unit: cost.average_cost_per_m3 != null ? "Rp/m\u00b3" : "", color: "#107E3E" }
      ]
    },
    "kpi-fg-value": {
      label: "FG Inventory Value",
      formula: "FG Value = Σ (qty_on_hand × cost_per_unit) per lot dari InventoryBatch",
      dataSource: "production_inventory_batches (cost_per_unit)",
      deskripsi: inv.fg_inventory_value != null
        ? "Nilai valuasi finansial produk jadi berdasarkan HPP per unit dari lot produksi."
        : "Belum ada nilai inventory FG. Data muncul setelah batch selesai (Finished) dan cost_per_unit tercatat.",
      navigation_path: "/inventory",
      breakdown: [
        { label: "Nilai FG", value: inv.fg_inventory_value != null ? formatRupiah(inv.fg_inventory_value) : "Belum ada data", color: "#107E3E" }
      ]
    },
    "kpi-revenue-month": {
      label: "Revenue Month",
      formula: "Revenue = Σ (qty_ordered * unit_price) dari SO item bulan ini",
      dataSource: "production_sales_order_items & production_sales_orders",
      deskripsi: "Total pendapatan dari item Sales Order yang dipesan bulan ini.",
      navigation_path: "/sales",
      breakdown: [
        { label: "Revenue Bulan Ini", value: formatRupiah(data?.financial?.revenue_month || 0), color: "#0A6ED1" }
      ]
    },
    "kpi-cost-month-fin": {
      label: "Cost Month",
      formula: "Cost = Σ biaya standard / aktual batch bulan ini",
      dataSource: "production_costs / production_bom_headers",
      deskripsi: "Total biaya produksi bulan ini menggunakan data aktual atau fallback estimasi BOM.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Cost Bulan Ini", value: formatRupiah(data?.financial?.cost_month || 0), color: "#E9730C" }
      ]
    },
    "kpi-gross-margin": {
      label: "Gross Margin",
      formula: "Gross Margin = Revenue - Cost",
      dataSource: "Kombinasi Revenue & Cost Bulan Ini",
      deskripsi: "Selisih antara total pendapatan dan total biaya produksi bulan ini.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Gross Margin", value: formatRupiah(data?.financial?.gross_margin || 0), color: "#107E3E" }
      ]
    },
    "kpi-margin-pct": {
      label: "Margin %",
      formula: "Margin (%) = (Gross Margin ÷ Revenue) * 100",
      dataSource: "Dihitung dari Gross Margin & Revenue",
      deskripsi: "Rasio keuntungan kotor terhadap pendapatan bulan ini.",
      navigation_path: "/reports",
      breakdown: [
        { label: "Margin %", value: `${(data?.financial?.gross_margin_pct || 0).toFixed(1)}%`, color: "#107E3E" }
      ]
    }
  };
};

const Dashboard = () => {
  const [drilldown, setDrilldown] = useState(null);
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["dashboardOverview"],
    queryFn: async () => {
      const res = await dashboardApi.getOverview();
      return res.data;
    }
  });

  const { data: drilldownDetails } = useQuery({
    queryKey: ["kpiDrilldown", drilldown?.id],
    queryFn: async () => {
      if (!drilldown?.id) return null;
      const res = await dashboardApi.getKpiDrilldown(drilldown.id);
      return res.data;
    },
    enabled: Boolean(drilldown?.id),
  });

  useEffect(() => {
    if (error) {
      toast.error("Gagal memuat data dashboard. Silakan coba lagi.");
      console.error("Dashboard error:", error);
    }
  }, [error]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] });
    if (drilldown?.id) {
      queryClient.invalidateQueries({ queryKey: ["kpiDrilldown", drilldown.id] });
    }
    toast.success("Dashboard data refreshed");
  };

  const production = dashboardData?.production || {};
  const inventory = dashboardData?.inventory || {};
  const delivery = dashboardData?.delivery || {};
  const salesOrder = dashboardData?.sales_order || {};
  const costing = dashboardData?.costing || {};
  const financial = dashboardData?.financial || {};
  const financialMetadata = dashboardData?.financial_metadata || {};
  const financialWarnings = dashboardData?.financial_warnings || [];

  const kpiDefs = getKpiDefinitions(dashboardData);
  const staticDef = drilldown ? kpiDefs[drilldown.id] : null;
  const def = staticDef ? {
    ...staticDef,
    trend: drilldownDetails?.trend || [],
    breakdown: (drilldownDetails?.breakdown && drilldownDetails.breakdown.length > 0)
      ? drilldownDetails.breakdown
      : (staticDef.breakdown || []),
    formula: (drilldownDetails?.formula && drilldownDetails.formula !== "KPI not supported")
      ? drilldownDetails.formula
      : staticDef.formula,
    dataSource: (drilldownDetails?.source && drilldownDetails.source !== "N/A")
      ? drilldownDetails.source
      : staticDef.dataSource,
    metadata: drilldownDetails?.metadata,
  } : null;

  const openKPI = (id, accent, value, delta) => setDrilldown({ id, accent, value, delta });

  const accentHex = {
    default: "#0A6ED1", success: "#107E3E", warning: "#E9730C", error: "#B00020", neutral: "#59687A",
  };

  // Extract Recharts Data
  const trendData = production.trend_14_days || [];
  const monthlyData = production.monthly_production || [];
  const topProductsList = production.top_products || [];
  const activitiesList = production.recent_activities || [];

  return (
    <div>
      <PageHeader
        title="Production Dashboard"
        subtitle="Performance summary of Precast Concrete plant today"
        breadcrumbs={["Home", "Dashboard"]}
        testId="dashboard-page-header"
        actions={
          <>
            <Button data-testid="btn-refresh" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button data-testid="btn-export" size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={() => showExportToast("dashboard report")}>
              <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* Hero Banner */}
        <FactoryHero
          company={company.name}
          plant={company.plant}
          shift={production.shift_name || company.shift}
          supervisor={production.supervisor_name || company.operator}
          moldsUsed={production.molds_used || 0}
          moldsTotal={production.molds_total || 0}
          wipQty={production.wip_qty || 0}
          planDayCurrent={production.plan_day_current || 1}
          planDayTotal={production.plan_day_total || 1}
        />

        {/* KPI Tabs */}
        <Tabs defaultValue="production" className="w-full" data-testid="kpi-tabs">
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto flex flex-wrap gap-1 max-w-max">
            <TabsTrigger value="production" className="text-xs h-8">Production & Molds</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs h-8">Inventory Status</TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs h-8">Delivery Logistics</TabsTrigger>
            <TabsTrigger value="costing" className="text-xs h-8">Financial & Costing</TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPICard testId="kpi-target" label="Production Target" value={isLoading ? "..." : formatNumber(production.target_today)} unit="unit" icon={Target} accent="neutral" info={kpiDefs["kpi-target"].deskripsi} onClick={() => openKPI("kpi-target", "neutral", `${formatNumber(production.target_today)} unit`)} />
              <KPICard testId="kpi-realisasi" label="Actual Today" value={isLoading ? "..." : formatNumber(production.actual_today)} unit="unit" icon={TrendingUp} accent="default" info={kpiDefs["kpi-realisasi"].deskripsi} onClick={() => openKPI("kpi-realisasi", "default", `${formatNumber(production.actual_today)} unit`)} />
              <KPICard testId="kpi-achievement" label="Achievement" value={isLoading ? "..." : `${(production.achievement || 0).toFixed(1)}%`} icon={Activity} accent={(production.achievement || 0) >= 90 ? "success" : "warning"} info={kpiDefs["kpi-achievement"].deskripsi} onClick={() => openKPI("kpi-achievement", (production.achievement || 0) >= 90 ? "success" : "warning", `${(production.achievement || 0).toFixed(1)}%`)} />
              <KPICard testId="kpi-curing" label="Active Batch" value={isLoading ? "..." : formatNumber(production.active_batches)} unit="batch" icon={Boxes} accent="warning" info={kpiDefs["kpi-curing"].deskripsi} onClick={() => openKPI("kpi-curing", "warning", `${formatNumber(production.active_batches)} batch`)} />
              <KPICard testId="kpi-qc" label="Overdue Batch" value={isLoading ? "..." : formatNumber(production.overdue_batches)} unit="batch" icon={AlertTriangle} accent="error" info={kpiDefs["kpi-qc"].deskripsi} onClick={() => openKPI("kpi-qc", "error", `${formatNumber(production.overdue_batches)} batch`)} />
              <KPICard testId="kpi-mold" label="Mold Utilization" value={isLoading ? "..." : `${(production.mold_utilization || 0).toFixed(1)}%`} icon={Hammer} accent={(production.mold_utilization || 0) >= 80 ? "success" : "warning"} info={kpiDefs["kpi-mold"].deskripsi} onClick={() => openKPI("kpi-mold", (production.mold_utilization || 0) >= 80 ? "success" : "warning", `${(production.mold_utilization || 0).toFixed(1)}%`)} />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard testId="kpi-stok" label="Finished Goods Stock" value={isLoading ? "..." : formatNumber(inventory.finished_goods_stock)} unit="unit" icon={Package} accent="success" info={kpiDefs["kpi-stok"].deskripsi} onClick={() => openKPI("kpi-stok", "success", `${formatNumber(inventory.finished_goods_stock)} unit`)} />
              <KPICard testId="kpi-fg-value" label="FG Inventory Value" value={isLoading ? "..." : (inventory.fg_inventory_value != null ? formatRupiah(inventory.fg_inventory_value) : "–")} icon={TrendingUp} accent={inventory.fg_inventory_value != null ? "success" : "neutral"} info={kpiDefs["kpi-fg-value"].deskripsi} onClick={() => openKPI("kpi-fg-value", "success", inventory.fg_inventory_value != null ? formatRupiah(inventory.fg_inventory_value) : "Belum ada data")} />
              <KPICard testId="kpi-material" label="Material Inventory Value" value={isLoading ? "..." : formatRupiah(inventory.material_value)} icon={Boxes} accent="default" info={kpiDefs["kpi-material"].deskripsi} onClick={() => openKPI("kpi-material", "default", formatRupiah(inventory.material_value))} />
              <KPICard testId="kpi-reject" label="Low Stock Material" value={isLoading ? "..." : formatNumber(inventory.low_stock_count)} unit="item" icon={AlertTriangle} accent="default" info={kpiDefs["kpi-reject"].deskripsi} onClick={() => openKPI("kpi-reject", "default", `${formatNumber(inventory.low_stock_count)} item`)} />
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 max-w-2xl">
              <KPICard testId="kpi-efisiensi" label="Delivery Performance" value={isLoading ? "..." : `${(delivery.performance || 0).toFixed(1)}%`} icon={TrendingUp} accent="success" info={kpiDefs["kpi-efisiensi"].deskripsi} onClick={() => openKPI("kpi-efisiensi", "success", `${(delivery.performance || 0).toFixed(1)}%`)} />
              <KPICard testId="kpi-jadi-hari" label="Pending Delivery" value={isLoading ? "..." : formatNumber(delivery.pending_count)} unit="order" icon={ShieldCheck} accent="success" info={kpiDefs["kpi-jadi-hari"].deskripsi} onClick={() => openKPI("kpi-jadi-hari", "success", `${formatNumber(delivery.pending_count)} order`)} />
            </div>
          </TabsContent>

          <TabsContent value="costing" className="mt-3">
            {/* Warning Banner */}
            {!isLoading && financialWarnings.length > 0 && (
              <div className="mb-3 flex flex-col gap-1.5 bg-[#FDF3E7] border border-[#F8C98C] rounded-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#E9730C] text-sm">⚠️</span>
                  <span className="text-xs font-semibold text-[#7A3B00]">Peringatan Data Finansial ({financialWarnings.length})</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-[#7A3B00] space-y-1">
                  {financialWarnings.map((warning, index) => (
                    <li key={index}>
                      {warning.type === 'MISSING_BOM' 
                        ? `Batch #${warning.batch_id} tidak memiliki snapshot BOM. Fallback aktif digunakan.`
                        : warning.message || JSON.stringify(warning)
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isLoading && financialWarnings.length === 0 && financialMetadata.cost_confidence === 'MEDIUM' && (
              <div className="mb-3 flex items-start gap-2.5 bg-[#F4F6F8] border border-[#DFE3E8] rounded-md px-4 py-3">
                <span className="text-[#59687A] text-xs mt-0.5">ℹ️</span>
                <div>
                  <span className="text-xs font-semibold text-[#1C252E]">Costing menggunakan Estimasi BOM — </span>
                  <span className="text-xs text-[#59687A]">Actual production cost belum tersedia untuk batch bulan ini. Margin di bawah dihitung menggunakan HPP standar.</span>
                </div>
              </div>
            )}

            {/* Confidence Badge Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#59687A] uppercase tracking-wider">Financial Performance</span>
              {!isLoading && (
                <div 
                  className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase"
                  style={
                    financialMetadata.cost_confidence === 'HIGH' 
                      ? { backgroundColor: '#E6F5EC', color: '#107E3E', borderColor: '#C2E5D3' }
                      : financialMetadata.cost_confidence === 'MEDIUM'
                      ? { backgroundColor: '#FDF3E7', color: '#E9730C', borderColor: '#F8C98C' }
                      : { backgroundColor: '#FBE6E9', color: '#B00020', borderColor: '#F3C2C9' }
                  }
                >
                  {financialMetadata.cost_confidence === 'HIGH' && 'Actual Production Cost'}
                  {financialMetadata.cost_confidence === 'MEDIUM' && 'Estimated BOM Cost'}
                  {(financialMetadata.cost_confidence === 'NONE' || !financialMetadata.cost_confidence) && 'No Costing Data'}
                </div>
              )}
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard testId="kpi-revenue-month" label="Revenue Month"
                value={isLoading ? "..." : formatRupiah(financial.revenue_month || 0)}
                icon={TrendingUp} accent="default"
                info={kpiDefs["kpi-revenue-month"]?.deskripsi}
                onClick={() => openKPI("kpi-revenue-month", "default", formatRupiah(financial.revenue_month || 0))} />
              <KPICard testId="kpi-cost-month-fin" label="Cost Month"
                value={isLoading ? "..." : formatRupiah(financial.cost_month || 0)}
                icon={Activity} accent="warning"
                info={kpiDefs["kpi-cost-month-fin"]?.deskripsi}
                onClick={() => openKPI("kpi-cost-month-fin", "warning", formatRupiah(financial.cost_month || 0))} />
              <KPICard testId="kpi-gross-margin" label="Gross Margin"
                value={isLoading ? "..." : formatRupiah(financial.gross_margin || 0)}
                icon={ShieldCheck} accent="success"
                info={kpiDefs["kpi-gross-margin"]?.deskripsi}
                onClick={() => openKPI("kpi-gross-margin", "success", formatRupiah(financial.gross_margin || 0))} />
              <KPICard testId="kpi-margin-pct" label="Margin %"
                value={isLoading ? "..." : `${(financial.gross_margin_pct || 0).toFixed(1)}%`}
                icon={Activity} accent={(financial.gross_margin_pct || 0) >= 30 ? "success" : "warning"}
                info={kpiDefs["kpi-margin-pct"]?.deskripsi}
                onClick={() => openKPI("kpi-margin-pct", (financial.gross_margin_pct || 0) >= 30 ? "success" : "warning", `${(financial.gross_margin_pct || 0).toFixed(1)}%`)} />
            </div>

            {/* Charts & Breakdown Sub-row */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue vs Cost Trend Chart */}
              <div className="lg:col-span-2 bg-white border border-[#DFE3E8] rounded-md p-4">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Revenue vs Cost Trend</div>
                    <div className="text-base font-semibold text-[#1C252E] font-display">Last 6 Months</div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#59687A]">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0A6ED1]" /> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#E9730C]" /> Cost</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#107E3E]" /> Margin</span>
                  </div>
                </div>

                {/* Activity check */}
                {!isLoading && financial.monthly_series && !financial.monthly_series.some(s => s.activity) ? (
                  <div className="h-[220px] flex flex-col items-center justify-center border border-dashed border-[#DFE3E8] rounded bg-[#F8FAFC]">
                    <span className="text-lg">📊</span>
                    <span className="text-xs font-semibold text-[#59687A] mt-1">No Activity</span>
                    <span className="text-[10px] text-[#59687A] mt-0.5">Tidak ada transaksi produksi atau penjualan pada periode ini.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={financial.monthly_series || []} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#59687A" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v} />
                      <Tooltip formatter={(value) => [formatRupiah(value), null]} />
                      <Line type="monotone" dataKey="revenue" stroke="#0A6ED1" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="cost" stroke="#E9730C" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="margin" stroke="#107E3E" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Sales Pipeline Breakdown */}
              <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
                <div className="mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Sales Pipeline Breakdown</div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Total Value Allocation</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#59687A] font-medium">Draft & Submitted</span>
                      <span className="text-[#1C252E] font-semibold font-mono-num">{formatRupiah(financial.pipeline_breakdown?.draft || 0)}</span>
                    </div>
                    <div className="w-full bg-[#EEF0F2] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ 
                        width: `${financial.revenue_pipeline > 0 ? ((financial.pipeline_breakdown?.draft || 0) / financial.revenue_pipeline) * 100 : 0}%`, 
                        backgroundColor: '#59687A' 
                      }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#0A6ED1] font-medium">Approved & Planned</span>
                      <span className="text-[#1C252E] font-semibold font-mono-num">{formatRupiah(financial.pipeline_breakdown?.approved || 0)}</span>
                    </div>
                    <div className="w-full bg-[#EEF0F2] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ 
                        width: `${financial.revenue_pipeline > 0 ? ((financial.pipeline_breakdown?.approved || 0) / financial.revenue_pipeline) * 100 : 0}%`, 
                        backgroundColor: '#0A6ED1' 
                      }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#E9730C] font-medium">Casting & QC (Production)</span>
                      <span className="text-[#1C252E] font-semibold font-mono-num">{formatRupiah(financial.pipeline_breakdown?.production || 0)}</span>
                    </div>
                    <div className="w-full bg-[#EEF0F2] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ 
                        width: `${financial.revenue_pipeline > 0 ? ((financial.pipeline_breakdown?.production || 0) / financial.revenue_pipeline) * 100 : 0}%`, 
                        backgroundColor: '#E9730C' 
                      }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#107E3E] font-medium">Delivered & Completed</span>
                      <span className="text-[#1C252E] font-semibold font-mono-num">{formatRupiah(financial.pipeline_breakdown?.delivered || 0)}</span>
                    </div>
                    <div className="w-full bg-[#EEF0F2] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ 
                        width: `${financial.revenue_pipeline > 0 ? ((financial.pipeline_breakdown?.delivered || 0) / financial.revenue_pipeline) * 100 : 0}%`, 
                        backgroundColor: '#107E3E' 
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <KPIDrilldownDialog
          open={Boolean(drilldown)}
          onOpenChange={(o) => { if (!o) setDrilldown(null); }}
          definition={def}
          currentValue={drilldown?.value}
          currentDelta={drilldown?.delta}
          accent={drilldown ? accentHex[drilldown.accent] : "#0A6ED1"}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Production trend (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Production Trend</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">Last 14 Days</div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#59687A]">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#59687A]" /> Target</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0A6ED1]" /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#B00020]" /> Reject</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="realArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A6ED1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0A6ED1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="realisasi" stroke="#0A6ED1" strokeWidth={2} fill="url(#realArea)" />
                <Line type="monotone" dataKey="target" stroke="#59687A" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="reject" stroke="#B00020" strokeWidth={1.5} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly bar */}
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Monthly Production</div>
              <div className="text-base font-semibold text-[#1C252E] font-display">Last 6 Months</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="target" fill="#DFE3E8" radius={[2,2,0,0]} />
                <Bar dataKey="produksi" fill="#0A6ED1" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row: top products + activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Top Products</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">This Month</div>
              </div>
              <Button variant="link" size="sm" className="text-xs text-[#0A6ED1] h-auto p-0" onClick={() => toast.info("Opening full top products list...")}>View all →</Button>
            </div>
            <div className="space-y-3">
              {topProductsList.map((p, i) => (
                <div key={p.kode} data-testid={`top-product-${i}`} className="flex items-center gap-3">
                  <ProductIcon name={p.nama} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-[#1C252E] truncate">{p.nama}</div>
                        <div className="text-[10px] text-[#59687A] font-mono-num">{p.kode}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-sm font-semibold text-[#1C252E] font-mono-num">{formatNumber(p.qty)}</div>
                        <div className="text-[10px] text-[#59687A]">{p.persen}%</div>
                      </div>
                    </div>
                    <Progress value={p.persen} className="h-1" />
                  </div>
                </div>
              ))}
              {!isLoading && topProductsList.length === 0 && (
                <div className="text-xs text-[#59687A] py-8 text-center">Tidak ada data produk.</div>
              )}
            </div>
          </div>

          {/* Sales Order Status Card */}
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Sales Order Status</div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Overview</div>
                </div>
                <Button variant="link" size="sm" className="text-xs text-[#0A6ED1] h-auto p-0" onClick={() => toast.info("Opening sales order management...")}>Manage SO →</Button>
              </div>
              <div className="space-y-4">
                {/* Draft */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9E9E9E]" />
                    <span className="text-xs font-medium text-[#1C252E]">Draft Orders</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1C252E] font-mono-num">{salesOrder.draft_count || 0} SO</span>
                </div>
                {/* Approved / Planning */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0A6ED1]" />
                    <span className="text-xs font-medium text-[#1C252E]">Approved (Planning)</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1C252E] font-mono-num">{salesOrder.approved_count || 0} SO</span>
                </div>
                {/* Production */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E9730C]" />
                    <span className="text-xs font-medium text-[#1C252E]">In Production</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1C252E] font-mono-num">{salesOrder.production_count || 0} SO</span>
                </div>
                {/* Delivered */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#107E3E]" />
                    <span className="text-xs font-medium text-[#1C252E]">Delivered / Completed</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1C252E] font-mono-num">{salesOrder.delivered_count || 0} SO</span>
                </div>
              </div>
            </div>
            
            {/* Small visual stacked bar */}
            <div className="mt-6 pt-4 border-t border-[#EEF0F2]">
              <div className="text-[10px] text-[#59687A] mb-1.5 font-medium">Distribution</div>
              <div className="h-2 rounded-full overflow-hidden flex bg-[#F4F6F8]">
                {(() => {
                  const draft = salesOrder.draft_count || 0;
                  const approved = salesOrder.approved_count || 0;
                  const prod = salesOrder.production_count || 0;
                  const deliv = salesOrder.delivered_count || 0;
                  const total = draft + approved + prod + deliv || 1;
                  
                  return (
                    <>
                      <div style={{ width: `${(draft/total)*100}%` }} className="bg-[#9E9E9E]" title={`Draft: ${draft}`} />
                      <div style={{ width: `${(approved/total)*100}%` }} className="bg-[#0A6ED1]" title={`Approved: ${approved}`} />
                      <div style={{ width: `${(prod/total)*100}%` }} className="bg-[#E9730C]" title={`Production: ${prod}`} />
                      <div style={{ width: `${(deliv/total)*100}%` }} className="bg-[#107E3E]" title={`Delivered: ${deliv}`} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Production Activity</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">Today's Timeline</div>
              </div>
              <Button variant="link" size="sm" className="text-xs text-[#0A6ED1] h-auto p-0" onClick={() => toast.info("Opening full activity log...")}>Full log →</Button>
            </div>
            <div className="space-y-0 -mx-4">
              {activitiesList.map((a, i) => {
                const cfg = activityIconMap[a.status] || activityIconMap.info;
                const IconC = cfg.icon;
                return (
                  <div key={i} data-testid={`activity-${i}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] border-l-2 transition-colors" style={{ borderLeftColor: cfg.color }}>
                    <div className="font-mono-num text-[11px] text-[#59687A] w-12 flex-shrink-0 mt-1">{a.waktu}</div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <IconC className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#1C252E]">{a.aktivitas}</div>
                      <div className="text-xs text-[#59687A] truncate">{a.detail}</div>
                    </div>
                    <StatusBadge status={a.line} variant="info" />
                  </div>
                );
              })}
              {!isLoading && activitiesList.length === 0 && (
                <div className="text-xs text-[#59687A] py-8 text-center">Tidak ada aktivitas hari ini.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
