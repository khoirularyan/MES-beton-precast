import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import KPIDrilldownDialog from "@/components/shared/KPIDrilldownDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  todayKPIs, productionTrend, monthlyProduction, topProducts, recentActivities, formatNumber, kpiDefinitions
} from "@/data/mockData";
import {
  Target, TrendingUp, Thermometer, ShieldCheck, AlertTriangle, Package,
  Boxes, Hammer, Activity, Download, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { showExportToast, showRefreshToast } from "@/components/shared/FilterPopover";
import { toast } from "sonner";
import { FactoryHero } from "@/components/visuals/IndustrialVisuals";
import ProductIcon from "@/components/visuals/ProductIcon";
import { company } from "@/data/mockData";

const activityIconMap = {
  success: { bg: "#E6F5EC", color: "#107E3E", icon: ShieldCheck },
  error: { bg: "#FBE6E9", color: "#B00020", icon: AlertTriangle },
  warning: { bg: "#FDF3E7", color: "#E9730C", icon: Activity },
  info: { bg: "#E5F0FA", color: "#0A6ED1", icon: Hammer },
};

const Dashboard = () => {
  const [drilldown, setDrilldown] = useState(null);
  const openKPI = (id, accent, value, delta) => setDrilldown({ id, accent, value, delta });
  const def = drilldown ? kpiDefinitions[drilldown.id] : null;
  const accentHex = {
    default: "#0A6ED1", success: "#107E3E", warning: "#E9730C", error: "#B00020", neutral: "#59687A",
  };
  return (
    <div>
      <PageHeader
        title="Dashboard Produksi"
        subtitle="Ringkasan kinerja pabrik Precast Concrete hari ini"
        breadcrumbs={["Beranda", "Dashboard"]}
        testId="dashboard-page-header"
        actions={
          <>
            <Button data-testid="btn-refresh" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={showRefreshToast}>
              <RefreshCw className="w-3.5 h-3.5" /> Perbarui
            </Button>
            <Button data-testid="btn-export" size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={() => showExportToast("laporan dashboard")}>
              <Download className="w-3.5 h-3.5" /> Ekspor Laporan
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* Hero Banner */}
        <FactoryHero company={company.name} plant={company.plant} shift={company.shift} />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard testId="kpi-target" label="Target Produksi" value={todayKPIs.targetProduksi} unit="unit" icon={Target} accent="neutral" info={kpiDefinitions["kpi-target"].deskripsi} onClick={() => openKPI("kpi-target", "neutral", `${todayKPIs.targetProduksi} unit`)} />
          <KPICard testId="kpi-realisasi" label="Realisasi Hari Ini" value={todayKPIs.realisasiProduksi} unit="unit" icon={TrendingUp} accent="default" trend="down" trendValue="-3.5%" info={kpiDefinitions["kpi-realisasi"].deskripsi} onClick={() => openKPI("kpi-realisasi", "default", `${todayKPIs.realisasiProduksi} unit`, "-3.5% vs kemarin")} />
          <KPICard testId="kpi-achievement" label="Pencapaian" value={`${todayKPIs.achievement.toFixed(1)}%`} icon={Activity} accent={todayKPIs.achievement >= 90 ? "success" : "warning"} trend="down" trendValue="-2.1%" info={kpiDefinitions["kpi-achievement"].deskripsi} onClick={() => openKPI("kpi-achievement", todayKPIs.achievement >= 90 ? "success" : "warning", `${todayKPIs.achievement.toFixed(1)}%`, "-2.1% vs kemarin")} />
          <KPICard testId="kpi-curing" label="Dalam Curing" value={todayKPIs.dalamCuring} unit="unit" icon={Thermometer} accent="warning" trend="up" trendValue="+12" info={kpiDefinitions["kpi-curing"].deskripsi} onClick={() => openKPI("kpi-curing", "warning", `${todayKPIs.dalamCuring} unit`, "+12 vs kemarin")} />
          <KPICard testId="kpi-qc" label="Siap QC" value={todayKPIs.siapQC} unit="unit" icon={ShieldCheck} accent="default" trend="up" trendValue="+8" info={kpiDefinitions["kpi-qc"].deskripsi} onClick={() => openKPI("kpi-qc", "default", `${todayKPIs.siapQC} unit`, "+8 vs kemarin")} />
          <KPICard testId="kpi-reject" label="Reject Rate" value={`${todayKPIs.rejectRate}%`} icon={AlertTriangle} accent="error" trend="up" trendValue="+0.4%" info={kpiDefinitions["kpi-reject"].deskripsi} onClick={() => openKPI("kpi-reject", "error", `${todayKPIs.rejectRate}%`, "+0.4% vs kemarin")} />

          <KPICard testId="kpi-stok" label="Stok Produk Jadi" value={formatNumber(todayKPIs.stokProdukJadi)} unit="unit" icon={Package} accent="success" trend="up" trendValue="+124" info={kpiDefinitions["kpi-stok"].deskripsi} onClick={() => openKPI("kpi-stok", "success", `${formatNumber(todayKPIs.stokProdukJadi)} unit`, "+124 vs kemarin")} />
          <KPICard testId="kpi-material" label="Pemakaian Material" value={todayKPIs.pemakaianMaterial} unit="ton" icon={Boxes} accent="default" trend="up" trendValue="+5.2%" info={kpiDefinitions["kpi-material"].deskripsi} onClick={() => openKPI("kpi-material", "default", `${todayKPIs.pemakaianMaterial} ton`, "+5.2% vs kemarin")} />
          <KPICard testId="kpi-mold" label="Utilisasi Cetakan" value={`${todayKPIs.utilisasiCetakan}%`} icon={Hammer} accent={todayKPIs.utilisasiCetakan >= 80 ? "success" : "warning"} trend="up" trendValue="+3%" info={kpiDefinitions["kpi-mold"].deskripsi} onClick={() => openKPI("kpi-mold", todayKPIs.utilisasiCetakan >= 80 ? "success" : "warning", `${todayKPIs.utilisasiCetakan}%`, "+3% vs kemarin")} />
          <KPICard testId="kpi-wip" label="Work In Progress" value={todayKPIs.worKInProgress} unit="unit" icon={Activity} accent="neutral" trend="up" trendValue="+18" info={kpiDefinitions["kpi-wip"].deskripsi} onClick={() => openKPI("kpi-wip", "neutral", `${todayKPIs.worKInProgress} unit`, "+18 vs kemarin")} />
          <KPICard testId="kpi-efisiensi" label="Efisiensi Produksi" value={`${todayKPIs.efisiensiProduksi}%`} icon={TrendingUp} accent="success" trend="up" trendValue="+1.2%" info={kpiDefinitions["kpi-efisiensi"].deskripsi} onClick={() => openKPI("kpi-efisiensi", "success", `${todayKPIs.efisiensiProduksi}%`, "+1.2% vs kemarin")} />
          <KPICard testId="kpi-jadi-hari" label="Produk Jadi Hari Ini" value={todayKPIs.realisasiProduksi - todayKPIs.reject} unit="unit" icon={ShieldCheck} accent="success" trend="down" trendValue="-2%" info={kpiDefinitions["kpi-jadi-hari"].deskripsi} onClick={() => openKPI("kpi-jadi-hari", "success", `${todayKPIs.realisasiProduksi - todayKPIs.reject} unit`, "-2% vs kemarin")} />
        </div>

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
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Tren Produksi</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">14 Hari Terakhir</div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#59687A]">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#59687A]" /> Target</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0A6ED1]" /> Realisasi</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#B00020]" /> Reject</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={productionTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
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
              <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Produksi Bulanan</div>
              <div className="text-base font-semibold text-[#1C252E] font-display">6 Bulan Terakhir</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyProduction} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Top Produk</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">Bulan Ini</div>
              </div>
              <Button variant="link" size="sm" className="text-xs text-[#0A6ED1] h-auto p-0" onClick={() => toast.info("Membuka daftar lengkap top produk...")}>Lihat semua →</Button>
            </div>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
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
                    <Progress value={p.persen * 4} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Aktivitas Produksi</div>
                <div className="text-base font-semibold text-[#1C252E] font-display">Timeline Hari Ini</div>
              </div>
              <Button variant="link" size="sm" className="text-xs text-[#0A6ED1] h-auto p-0" onClick={() => toast.info("Membuka log aktivitas lengkap...")}>Log lengkap →</Button>
            </div>
            <div className="space-y-0 -mx-4">
              {recentActivities.map((a, i) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
