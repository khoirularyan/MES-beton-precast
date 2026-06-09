import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import {
  productionTrend, monthlyProduction, materialConsumption, monthlyByProduct,
  rejectByReason, efficiencyByLine, molds, salesOrders, formatRupiah
} from "@/data/mockData";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts";
import { showExportToast, showPrintToast } from "@/components/shared/FilterPopover";

import { OEEGauge } from "@/components/visuals/IndustrialVisuals";

const COLORS = ["#0A6ED1", "#107E3E", "#E9730C", "#0070F2", "#B00020", "#59687A", "#9AA5B1", "#0854A1"];

const ChartCard = ({ title, subtitle, children, testId }) => (
  <div data-testid={testId} className="bg-white border border-[#DFE3E8] rounded-md p-4">
    <div className="mb-3">
      <div className="text-base font-semibold text-[#1C252E] font-display">{title}</div>
      {subtitle && <div className="text-xs text-[#59687A]">{subtitle}</div>}
    </div>
    {children}
  </div>
);

const Reports = () => {
  const [tab, setTab] = useState("daily");

  return (
    <div>
      <PageHeader
        title="Laporan"
        subtitle="Analitik produksi, material, reject, dan penjualan"
        breadcrumbs={["Beranda", "Laporan"]}
        testId="reports-page-header"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={showPrintToast}><Printer className="w-3.5 h-3.5" />Cetak</Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={() => showExportToast("laporan PDF")}><Download className="w-3.5 h-3.5" />Ekspor PDF</Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto flex-wrap">
            <TabsTrigger value="daily" className="text-xs h-8">Produksi Harian</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs h-8">Produksi Bulanan</TabsTrigger>
            <TabsTrigger value="material" className="text-xs h-8">Pemakaian Material</TabsTrigger>
            <TabsTrigger value="reject" className="text-xs h-8">Analisis Reject</TabsTrigger>
            <TabsTrigger value="mold" className="text-xs h-8">Utilisasi Cetakan</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs h-8">Penjualan</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4">
            <ChartCard testId="report-daily" title="Laporan Produksi Harian" subtitle="Target vs realisasi 14 hari terakhir">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={productionTrend} margin={{ left: -10 }}>
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
                  <Line type="monotone" dataKey="reject" stroke="#B00020" strokeWidth={1.5} name="Reject" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard testId="report-monthly-trend" title="Tren Produksi Bulanan" subtitle="Realisasi vs target 6 bulan terakhir">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyProduction} margin={{ left: -10 }}>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="target" fill="#DFE3E8" radius={[2,2,0,0]} name="Target" />
                    <Bar dataKey="produksi" fill="#0A6ED1" radius={[2,2,0,0]} name="Produksi" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard testId="report-by-product" title="Produksi per Kategori Produk" subtitle="Distribusi bulan ini">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={monthlyByProduct} dataKey="produksi" nameKey="produk" cx="50%" cy="50%" outerRadius={110} label={(e) => `${e.persen}%`} labelLine={false}>
                      {monthlyByProduct.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="material" className="mt-4">
            <ChartCard testId="report-material" title="Pemakaian Material" subtitle="Konsumsi semen, agregat, besi tulangan dalam ton (7 hari)">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={materialConsumption} margin={{ left: -10 }}>
                  <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="semen" stroke="#0A6ED1" strokeWidth={2.5} name="Semen" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="agregat" stroke="#E9730C" strokeWidth={2.5} name="Agregat" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="besi" stroke="#107E3E" strokeWidth={2.5} name="Besi" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="reject" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard testId="report-reject-pie" title="Distribusi Reject" subtitle="Berdasarkan penyebab">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={rejectByReason} dataKey="jumlah" nameKey="alasan" cx="50%" cy="50%" innerRadius={60} outerRadius={110}>
                      {rejectByReason.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard testId="report-reject-bar" title="Pareto Reject" subtitle="Top penyebab reject">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={rejectByReason} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="alasan" tick={{ fontSize: 11, fill: "#1C252E" }} axisLine={false} tickLine={false} width={150} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#B00020" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="mold" className="mt-4">
            <ChartCard testId="report-mold" title="Utilisasi Cetakan" subtitle="Persentase pemakaian harian per jenis cetakan">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={molds} margin={{ left: -10 }}>
                  <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="kode" tick={{ fontSize: 10, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip />
                  <Bar dataKey="utilisasi" fill="#0A6ED1" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard testId="report-sales-bar" title="Penjualan per Customer" subtitle="Nilai sales order">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={salesOrders.map(s => ({ customer: s.customer.replace("(Persero) Tbk", "").replace("PT ", "").substring(0, 18), nilai: s.nilai / 1000000 }))} margin={{ left: -10 }}>
                      <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="customer" tick={{ fontSize: 10, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} angle={-20} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} unit="M" />
                      <Tooltip formatter={(v) => `Rp ${v} Juta`} />
                      <Bar dataKey="nilai" fill="#107E3E" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard testId="report-sales-summary" title="Ringkasan Sales" subtitle="Bulan ini">
                <div className="space-y-3">
                  <div className="border-l-2 border-[#0A6ED1] pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Total Nilai SO</div>
                    <div className="text-xl font-semibold font-mono-num text-[#1C252E]">{formatRupiah(salesOrders.reduce((s, o) => s + o.nilai, 0))}</div>
                  </div>
                  <div className="border-l-2 border-[#107E3E] pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Rata-rata per Order</div>
                    <div className="text-xl font-semibold font-mono-num text-[#1C252E]">{formatRupiah(Math.round(salesOrders.reduce((s, o) => s + o.nilai, 0) / salesOrders.length))}</div>
                  </div>
                  <div className="border-l-2 border-[#E9730C] pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Order Aktif</div>
                    <div className="text-xl font-semibold font-mono-num text-[#1C252E]">{salesOrders.filter(s => s.status !== "Selesai").length}</div>
                  </div>
                  <div className="border-l-2 border-[#59687A] pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Total Customer</div>
                    <div className="text-xl font-semibold font-mono-num text-[#1C252E]">{new Set(salesOrders.map(s => s.customer)).size}</div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </TabsContent>
        </Tabs>

        {/* Executive OEE Gauges */}
        <ChartCard testId="report-line-efficiency" title="Executive OEE Dashboard" subtitle="Overall Equipment Effectiveness — Availability × Performance × Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {efficiencyByLine.map((l, i) => (
              <div key={l.line} data-testid={`oee-gauge-${i}`} className="flex flex-col items-center bg-gradient-to-br from-[#F8FAFC] to-white border border-[#DFE3E8] rounded-md p-4">
                <OEEGauge value={l.oee} label={l.line} subLabel="OEE %" size={150} />
                <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EEF0F2]">
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Utilisasi</div>
                    <div className="font-mono-num text-sm font-semibold text-[#0A6ED1]">{l.utilisasi}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Quality</div>
                    <div className="font-mono-num text-sm font-semibold text-[#107E3E]">{l.output}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Benchmark band */}
          <div className="border-t border-[#EEF0F2] pt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#59687A] font-medium">Benchmark OEE Industri Manufaktur (World Class: ≥85%)</span>
              <span className="font-mono-num text-[#1C252E] font-semibold">
                Rata-rata: {(efficiencyByLine.reduce((s, l) => s + l.oee, 0) / efficiencyByLine.length).toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 bg-gradient-to-r from-[#B00020] via-[#E9730C] to-[#107E3E] rounded-full overflow-hidden">
              {efficiencyByLine.map((l) => (
                <div
                  key={l.line}
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: `${l.oee}%`, boxShadow: "0 0 0 1px #1C252E" }}
                  title={`${l.line}: ${l.oee}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#59687A] mt-1 font-mono-num">
              <span>0% Poor</span>
              <span>40% Low</span>
              <span>60% Avg</span>
              <span>85% World Class</span>
              <span>100%</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Reports;
