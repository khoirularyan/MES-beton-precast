import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { materials, finishedGoods, stockMovements, materialConsumption, warehouses, formatNumber, formatRupiah } from "@/data/mockData";
import { Package, Boxes, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CementSilo, AggregateStockpile, WarehouseFill } from "@/components/visuals/IndustrialVisuals";
import ProductIcon from "@/components/visuals/ProductIcon";

// Visual storage indicators (cement silos & aggregate stockpiles)
const StorageStrip = () => (
  <div className="bg-white border border-[#DFE3E8] rounded-md p-5" data-testid="storage-strip">
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="text-base font-semibold text-[#1C252E] font-display">Penyimpanan Material Curah</div>
        <div className="text-xs text-[#59687A]">Silo semen & stockpile agregat — pemantauan level real-time</div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-[#59687A]">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0A6ED1]" />Aman</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E9730C]" />Sedang</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B00020]" />Kritis</span>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
      <CementSilo label="Silo Semen 1" level={82} capacity="200 ton" />
      <CementSilo label="Silo Semen 2" level={64} capacity="200 ton" />
      <CementSilo label="Silo Semen 3" level={28} capacity="150 ton" />
      <AggregateStockpile label="Pasir Lumajang" level={76} capacity="1.280 m³" color="#9C4F00" />
      <AggregateStockpile label="Batu Split 1-2" level={58} capacity="980 m³" color="#5A5A5A" />
      <AggregateStockpile label="Batu Split 2-3" level={44} capacity="720 m³" color="#6E6E6E" />
    </div>
  </div>
);

const Inventory = () => {
  const [tab, setTab] = useState("finished");

  return (
    <div>
      <PageHeader
        title="Persediaan"
        subtitle="Manajemen stok bahan baku, work-in-progress, dan produk jadi"
        breadcrumbs={["Beranda", "Persediaan"]}
        testId="inventory-page-header"
      />
      <div className="p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="inv-kpi-fg" label="Total Stok Produk Jadi" value={formatNumber(1842)} unit="unit" icon={Package} accent="success" />
          <KPICard testId="inv-kpi-rm" label="Total Bahan Baku" value="184.5" unit="ton" icon={Boxes} accent="default" />
          <KPICard testId="inv-kpi-in" label="Penerimaan Hari Ini" value="3" unit="transaksi" icon={ArrowDownToLine} accent="warning" />
          <KPICard testId="inv-kpi-out" label="Pengeluaran Hari Ini" value="5" unit="transaksi" icon={ArrowUpFromLine} accent="neutral" />
        </div>

        {/* Storage visuals */}
        <StorageStrip />

        {/* Warehouse utilization 3D */}
        <div>
          <div className="text-base font-semibold text-[#1C252E] font-display mb-3">Utilisasi Gudang</div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {warehouses.map((w, i) => (
              <WarehouseFill key={w.kode} code={w.kode} label={w.nama} level={w.utilisasi} capacity={w.kapasitas} />
            ))}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto">
            <TabsTrigger value="finished" className="text-xs h-8">Produk Jadi</TabsTrigger>
            <TabsTrigger value="raw" className="text-xs h-8">Bahan Baku</TabsTrigger>
            <TabsTrigger value="movement" className="text-xs h-8">Mutasi Stok</TabsTrigger>
            <TabsTrigger value="consumption" className="text-xs h-8">Pemakaian Material</TabsTrigger>
          </TabsList>

          <TabsContent value="finished" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Kode</th>
                    <th className="px-4 py-2 text-left">Produk</th>
                    <th className="px-4 py-2 text-right">Total Stok</th>
                    <th className="px-4 py-2 text-right">Reserved</th>
                    <th className="px-4 py-2 text-right">Available</th>
                    <th className="px-4 py-2 text-left">Gudang</th>
                    <th className="px-4 py-2 text-left">Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {finishedGoods.map((f, i) => (
                    <tr key={f.kode} data-testid={`fg-row-${i}`}>
                      <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{f.kode}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <ProductIcon name={f.nama} size="sm" />
                          <span className="font-medium">{f.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 text-right font-mono-num font-semibold">{formatNumber(f.stok)}</td>
                      <td className="px-4 text-right font-mono-num text-[#E9730C]">{formatNumber(f.reserved)}</td>
                      <td className="px-4 text-right font-mono-num text-[#107E3E] font-semibold">{formatNumber(f.available)}</td>
                      <td className="px-4">{f.gudang}</td>
                      <td className="px-4 text-[#59687A]">{f.lokasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Kode</th>
                    <th className="px-4 py-2 text-left">Material</th>
                    <th className="px-4 py-2 text-left">Satuan</th>
                    <th className="px-4 py-2 text-right">Stok Saat Ini</th>
                    <th className="px-4 py-2 text-right">Min Stok</th>
                    <th className="px-4 py-2 text-left w-40">Level</th>
                    <th className="px-4 py-2 text-right">Nilai Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => {
                    const ratio = (m.stok / (m.minStok * 4)) * 100;
                    const isLow = m.stok <= m.minStok * 1.5;
                    return (
                      <tr key={m.kode} data-testid={`rm-row-${i}`}>
                        <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{m.kode}</td>
                        <td className="px-4 font-medium">{m.nama}</td>
                        <td className="px-4 text-[#59687A]">{m.satuan}</td>
                        <td className="px-4 text-right font-mono-num font-semibold">{formatNumber(m.stok)}</td>
                        <td className="px-4 text-right font-mono-num text-[#59687A]">{formatNumber(m.minStok)}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(ratio, 100)} className="h-1.5 flex-1" />
                            {isLow && <StatusBadge status="Rendah" variant="error" />}
                          </div>
                        </td>
                        <td className="px-4 text-right font-mono-num">{formatRupiah(m.stok * m.harga)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="movement" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">No. Mutasi</th>
                    <th className="px-4 py-2 text-left">Tipe</th>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-left">Referensi</th>
                    <th className="px-4 py-2 text-left">Tanggal</th>
                    <th className="px-4 py-2 text-left">Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.map((m, i) => (
                    <tr key={m.no} data-testid={`mov-row-${i}`}>
                      <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{m.no}</td>
                      <td className="px-4"><StatusBadge status={m.tipe} /></td>
                      <td className="px-4 font-medium">{m.item}</td>
                      <td className="px-4 text-right font-mono-num font-semibold">{m.qty}</td>
                      <td className="px-4 font-mono-num text-[#59687A]">{m.referensi}</td>
                      <td className="px-4 font-mono-num text-[#59687A]">{m.tanggal}</td>
                      <td className="px-4">{m.lokasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="consumption" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
              <div className="text-base font-semibold text-[#1C252E] font-display mb-1">Pemakaian Material 7 Hari Terakhir</div>
              <div className="text-xs text-[#59687A] mb-4">Konsumsi semen, agregat, dan besi tulangan dalam ton</div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={materialConsumption} margin={{ left: -10 }}>
                  <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={{ stroke: "#DFE3E8" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="semen" stroke="#0A6ED1" strokeWidth={2} name="Semen (ton)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="agregat" stroke="#E9730C" strokeWidth={2} name="Agregat (ton)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="besi" stroke="#107E3E" strokeWidth={2} name="Besi (ton)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inventory;
