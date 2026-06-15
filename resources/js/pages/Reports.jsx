import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Printer, AlertCircle, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { showExportToast, showPrintToast } from "@/components/shared/FilterPopover";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, productionBatchApi, qcDashboardApi, salesOrderApi, moldApi } from "@/lib/api";
import { formatRupiah } from "@/data/mockData";

const COLORS = ["#0A6ED1","#107E3E","#E9730C","#0070F2","#B00020","#59687A","#9AA5B1","#0854A1"];

const ChartCard = ({ title, subtitle, children, testId, badge }) => (
  <div data-testid={testId} className="bg-white border border-[#DFE3E8] rounded-md p-4">
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="text-base font-semibold text-[#1C252E] font-display">{title}</div>
        {subtitle && <div className="text-xs text-[#59687A] mt-0.5">{subtitle}</div>}
      </div>
      {badge && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5F0FA] text-[#0A6ED1] border border-[#B3D4F5]">
          LIVE DATA
        </span>
      )}
    </div>
    {children}
  </div>
);

const NoData = ({ message = "Belum ada data untuk periode ini." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
    <div className="w-12 h-12 rounded-full bg-[#F4F6F8] flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-[#9AA5B1]" />
    </div>
    <div className="text-sm font-medium text-[#1C252E]">Tidak ada data</div>
    <div className="text-xs text-[#59687A] max-w-xs">{message}</div>
  </div>
);

const rupiahFormatter = (v) => v != null ? formatRupiah(v) : "–";

const Reports = () => {
  const [tab, setTab] = useState("daily");

  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ["reportsOverview"],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: qcData, isLoading: loadingQc } = useQuery({
    queryKey: ["reportsQcDashboard"],
    queryFn: () => qcDashboardApi.getOverview().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: costData, isLoading: loadingCost } = useQuery({
    queryKey: ["reportsCostDashboard"],
    queryFn: () => productionBatchApi.getCostDashboard().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: soRaw, isLoading: loadingSo } = useQuery({
    queryKey: ["reportsSalesOrders"],
    queryFn: () => salesOrderApi.getAll({ per_page: 500 }).then((r) => r.data),
    staleTime: 60000,
  });

  const { data: moldsRaw, isLoading: loadingMolds } = useQuery({
    queryKey: ["reportsMolds"],
    queryFn: () => moldApi.getAll().then((r) => r.data),
    staleTime: 60000,
  });

  const trend14      = overview?.production?.trend_14_days      || [];
  const monthly6     = overview?.production?.monthly_production || [];
  const costTrend    = overview?.costing?.monthly_cost_trend    || [];
  const hasCostData  = overview?.costing?.has_cost_data;
  const ratesOk      = overview?.costing?.rates_configured;

  const rejectByDefect   = qcData?.defect_summary || [];
  const topCostProducts  = costData?.top_cost_products || [];

  const soList = Array.isArray(soRaw) ? soRaw : (soRaw?.data || []);
  const soByStatus = ["Draft","Submitted","Approved","Planning","Delivered","Completed","Cancelled"]
    .map((s) => {
      const filtered = soList.filter((o) => o.status === s);
      const total = filtered.reduce((sum, o) => sum + (parseFloat(o.nilai) || 0), 0);
      return { status: s, count: filtered.length, total };
    })
    .filter((s) => s.count > 0);

  const moldList = Array.isArray(moldsRaw) ? moldsRaw : (moldsRaw?.data || []);
  const moldUtilData = moldList
    .filter((m) => m.jumlah_total > 0)
    .map((m) => ({
      kode: m.kode,
      nama: m.nama,
      utilisasi: m.utilisasi ?? 0,
      aktif: m.jumlah_aktif ?? 0,
      total: m.jumlah_total ?? 0,
    }));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Production, reject, sales, and costing analytics — live data"
        breadcrumbs={["Home", "Reports"]}
        testId="reports-page-header"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => refetchOverview()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={showPrintToast}>
              <Printer className="w-3.5 h-3.5" />Print
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={() => showExportToast("PDF report")}>
              <Download className="w-3.5 h-3.5" />Export PDF
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto flex-wrap">
            <TabsTrigger value="daily"   className="text-xs h-8">Daily Production</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs h-8">Monthly Production</TabsTrigger>
            <TabsTrigger value="reject"  className="text-xs h-8">Reject Analysis</TabsTrigger>
            <TabsTrigger value="mold"    className="text-xs h-8">Mold Utilization</TabsTrigger>
            <TabsTrigger value="sales"   className="text-xs h-8">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="costing" className="text-xs h-8">Production Cost</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4">
            <ChartCard testId="report-daily" badge title="Daily Production Report" subtitle="Target vs actual last 14 days">
              {loadingOverview ? (
                <div className="h-96 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
              ) : trend14.length === 0 ? (
                <NoData message="Belum ada batch produksi yang tercatat dalam 14 hari terakhir." />
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={trend14} margin={{ left: -10 }}>
                    <defs>
                      <linearGradient id="rep1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0A6ED1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0A6ED1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="realisasi" stroke="#0A6ED1" strokeWidth={2} fill="url(#rep1)" name="Realisasi" />
                    <Line type="monotone" dataKey="target" stroke="#59687A" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Target" />
                    <Line type="monotone" dataKey="reject" stroke="#B00020" strokeWidth={1.5} dot={{ r: 2 }} name="Reject" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <ChartCard testId="report-monthly" badge title="Monthly Production Trend" subtitle="Target vs actual last 6 months">
              {loadingOverview ? (
                <div className="h-80 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
              ) : monthly6.every((m) => m.target === 0 && m.produksi === 0) ? (
                <NoData message="Belum ada data produksi bulanan. Data akan muncul setelah batch produksi dibuat." />
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={monthly6} margin={{ left: -10 }}>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="target" fill="#DFE3E8" radius={[2,2,0,0]} name="Target" />
                    <Bar dataKey="produksi" fill="#0A6ED1" radius={[2,2,0,0]} name="Realisasi" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </TabsContent>

          <TabsContent value="reject" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard testId="report-reject-pie" badge title="Reject by Defect Category" subtitle="From QC inspections">
                {loadingQc ? (
                  <div className="h-72 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
                ) : rejectByDefect.length === 0 ? (
                  <NoData message="Belum ada data defect dari QC inspection." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={rejectByDefect} dataKey="total" nameKey="category"
                        cx="50%" cy="50%" innerRadius={55} outerRadius={105}>
                        {rejectByDefect.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
              <ChartCard testId="report-reject-bar" badge title="Reject Pareto" subtitle="Top defect causes ranked">
                {loadingQc ? (
                  <div className="h-72 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
                ) : rejectByDefect.length === 0 ? (
                  <NoData message="Belum ada data reject. Isi hasil QC inspection terlebih dahulu." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[...rejectByDefect].sort((a, b) => b.total - a.total)} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#1C252E" }} axisLine={false} tickLine={false} width={130} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#B00020" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="mold" className="mt-4">
            <ChartCard testId="report-mold" badge title="Utilisasi Cetakan" subtitle="Per jenis cetakan — dari master data mold">
              {loadingMolds ? (
                <div className="h-80 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
              ) : moldUtilData.length === 0 ? (
                <NoData message="Belum ada data cetakan di master data. Tambahkan mold terlebih dahulu." />
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={moldUtilData} margin={{ left: -10, bottom: 30 }}>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="kode" tick={{ fontSize: 10, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="utilisasi" fill="#0A6ED1" radius={[2,2,0,0]} name="Utilisasi %" />
                    <Bar dataKey="aktif" fill="#107E3E" radius={[2,2,0,0]} name="Aktif" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard testId="report-sales-bar" badge title="Sales Pipeline by Status" subtitle="Nilai kontrak per status SO (IDR Juta)">
                  {loadingSo ? (
                    <div className="h-80 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
                  ) : soByStatus.length === 0 ? (
                    <NoData message="Belum ada Sales Order yang dibuat." />
                  ) : (
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={soByStatus.map((s) => ({ ...s, totalM: s.total / 1000000 }))} margin={{ left: -10 }}>
                        <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} unit="M" />
                        <Tooltip formatter={(v) => `Rp ${v.toFixed(1)} Juta`} />
                        <Bar dataKey="totalM" fill="#0A6ED1" radius={[2,2,0,0]} name="Nilai SO (Juta)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
              <ChartCard testId="report-sales-summary" badge title="Sales Summary" subtitle="Dari Sales Orders aktual">
                {loadingSo ? (
                  <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-12 bg-[#F4F6F8] rounded" />)}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-l-2 border-[#0A6ED1] pl-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Total SO Value</div>
                      <div className="text-lg font-semibold font-mono-num text-[#1C252E]">
                        {formatRupiah(soList.reduce((s, o) => s + (parseFloat(o.nilai) || 0), 0))}
                      </div>
                      <div className="text-[10px] text-[#59687A] italic">*Estimated contract value</div>
                    </div>
                    <div className="border-l-2 border-[#107E3E] pl-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Pipeline (Approved + Planning)</div>
                      <div className="text-lg font-semibold font-mono-num text-[#1C252E]">
                        {formatRupiah(soList.filter((o) => ["Approved","Planning"].includes(o.status)).reduce((s, o) => s + (parseFloat(o.nilai) || 0), 0))}
                      </div>
                    </div>
                    <div className="border-l-2 border-[#E9730C] pl-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Active Orders</div>
                      <div className="text-lg font-semibold font-mono-num text-[#1C252E]">
                        {soList.filter((o) => !["Delivered","Completed","Cancelled"].includes(o.status)).length}
                      </div>
                    </div>
                    <div className="border-l-2 border-[#59687A] pl-3">
                      <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Delivered / Completed</div>
                      <div className="text-lg font-semibold font-mono-num text-[#1C252E]">
                        {soList.filter((o) => ["Delivered","Completed"].includes(o.status)).length} SO
                      </div>
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="costing" className="mt-4">
            {!ratesOk && !loadingOverview && (
              <div className="mb-4 flex items-start gap-3 bg-[#FDF3E7] border border-[#F8C98C] rounded-md p-4">
                <AlertCircle className="w-5 h-5 text-[#E9730C] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[#7A3B00]">Work Center Rates Belum Dikonfigurasi</div>
                  <div className="text-xs text-[#7A3B00] mt-0.5">
                    Labor rate dan overhead rate di Master Data → Work Centers masih 0.
                    Biaya produksi yang ditampilkan hanya mencerminkan biaya material (dari BOM).
                    Isi rate untuk mendapatkan HPP yang lengkap.
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard testId="report-cost-trend" badge title="Monthly Production Cost Trend" subtitle="Biaya produksi aktual 6 bulan terakhir">
                  {loadingOverview ? (
                    <div className="h-72 flex items-center justify-center text-sm text-[#59687A]">Loading…</div>
                  ) : !hasCostData ? (
                    <NoData message="Belum ada data biaya produksi. Data muncul setelah batch mencapai status Casting dan StandardCostingService menghitung HPP." />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={costTrend} margin={{ left: -10 }}>
                        <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v} />
                        <Tooltip formatter={rupiahFormatter} />
                        <Bar dataKey="cost" fill="#0A6ED1" radius={[2,2,0,0]} name="Biaya Produksi" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
              <ChartCard testId="report-top-cost" badge title="Top 5 Cost Products" subtitle="Bulan ini — biaya tertinggi">
                {loadingCost ? (
                  <div className="space-y-3 animate-pulse">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-[#F4F6F8] rounded" />)}</div>
                ) : topCostProducts.length === 0 ? (
                  <NoData message="Belum ada data biaya per produk bulan ini." />
                ) : (
                  <div className="space-y-3">
                    {topCostProducts.map((p, i) => {
                      const max = topCostProducts[0]?.total_cost || 1;
                      const pct = Math.round((p.total_cost / max) * 100);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#1C252E] truncate flex-1">{p.product_name}</span>
                            <span className="text-xs font-semibold text-[#1C252E] font-mono-num ml-2">{formatRupiah(p.total_cost)}</span>
                          </div>
                          <div className="h-1.5 bg-[#F4F6F8] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0A6ED1] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ChartCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
