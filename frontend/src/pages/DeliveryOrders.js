import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { deliveryOrders, customers } from "@/data/mockData";
import { Truck, MapPin, Clock, CheckCircle2, Plus, Package, Warehouse, ShieldCheck } from "lucide-react";
import FormDialog from "@/components/shared/FormDialog";
import { TruckIllustration } from "@/components/visuals/IndustrialVisuals";

// Helper: status → truck illustration variant
const statusToVariant = (status) => {
  if (status === "Dalam Perjalanan") return "route";
  if (status === "Selesai") return "done";
  return "ready";
};

// Step keys per status
const timelineSteps = [
  { key: "prep", label: "Disiapkan", icon: Package },
  { key: "load", label: "Dimuat", icon: Warehouse },
  { key: "verify", label: "Diverifikasi", icon: ShieldCheck },
  { key: "depart", label: "Berangkat", icon: Truck },
  { key: "delivered", label: "Diterima", icon: CheckCircle2 },
];

const stepIndexByStatus = (status) => {
  switch (status) {
    case "Disiapkan": return 0;
    case "Siap Berangkat": return 2;
    case "Dalam Perjalanan": return 3;
    case "Selesai": return 5;
    default: return 1;
  }
};

const DeliveryTimeline = ({ status }) => {
  const idx = stepIndexByStatus(status);
  return (
    <div className="flex items-center gap-1">
      {timelineSteps.map((s, i) => {
        const Icon = s.icon;
        const done = i < idx;
        const current = i === idx - 1 || (status === "Selesai" && i === timelineSteps.length - 1);
        const color = done ? "#107E3E" : current ? "#0A6ED1" : "#C7CCD3";
        return (
          <div key={s.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: done || current ? color + "1A" : "#F4F6F8", color, border: `1.5px solid ${color}` }}>
                <Icon className="w-3 h-3" strokeWidth={2.5} />
              </div>
              <div className="text-[9px] mt-0.5 text-[#59687A] font-medium hidden xl:block">{s.label}</div>
            </div>
            {i < timelineSteps.length - 1 && (
              <div className="flex-1 h-0.5 mx-0.5" style={{ backgroundColor: i < idx - 1 ? "#107E3E" : "#EEF0F2" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const DeliveryOrders = () => {
  return (
    <div>
      <PageHeader
        title="Pengiriman"
        subtitle="Manajemen delivery order dan pengiriman produk ke customer"
        breadcrumbs={["Beranda", "Pengiriman"]}
        testId="delivery-page-header"
        actions={
          <FormDialog
            testId="do-create"
            title="Delivery Order Baru"
            description="Buat surat jalan pengiriman ke customer"
            submitLabel="Buat DO"
            successMessage="Delivery Order berhasil dibuat"
            fields={[
              { name: "so", label: "Sales Order", type: "select", required: true, options: [
                { value: "SO-2026-0095", label: "SO-2026-0095 — PT Adhi Karya" },
                { value: "SO-2026-0096", label: "SO-2026-0096 — Dinas PU Surabaya" },
                { value: "SO-2026-0097", label: "SO-2026-0097 — PT Hutama Karya" },
              ]},
              { name: "customer", label: "Customer", type: "select", required: true, options: customers.map(c => ({ value: c.kode, label: c.nama })) },
              { name: "muatan", label: "Muatan", type: "text", span: 2, placeholder: "Mis. 80 U-Ditch 500 + 160 Cover" },
              { name: "truk", label: "Nomor Polisi Truk", type: "text", placeholder: "Mis. B-9012-AB" },
              { name: "driver", label: "Driver", type: "text", placeholder: "Nama driver" },
              { name: "tglKirim", label: "Tanggal Kirim", type: "date", required: true },
              { name: "tujuan", label: "Tujuan", type: "text" },
              { name: "catatan", label: "Catatan Pengiriman", type: "textarea", span: 2 },
            ]}
            trigger={<Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />DO Baru</Button>}
          />
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="do-kpi-active" label="Pengiriman Aktif" value="2" unit="DO" icon={Truck} accent="warning" />
          <KPICard testId="do-kpi-route" label="Dalam Perjalanan" value="1" unit="DO" icon={MapPin} accent="default" />
          <KPICard testId="do-kpi-ready" label="Siap Berangkat" value="1" unit="DO" icon={Clock} accent="default" />
          <KPICard testId="do-kpi-done" label="Selesai Minggu Ini" value="12" unit="DO" icon={CheckCircle2} accent="success" trend="up" trendValue="+25%" />
        </div>

        {/* Active fleet snapshot */}
        <div className="bg-white border border-[#DFE3E8] rounded-md p-5" data-testid="fleet-snapshot">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-base font-semibold text-[#1C252E] font-display">Status Armada Hari Ini</div>
              <div className="text-xs text-[#59687A]">Pemantauan visual armada pengiriman aktif</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliveryOrders.slice(0, 3).map((d, i) => {
              const variant = statusToVariant(d.status);
              const variantColor = variant === "route" ? "#E9730C" : variant === "done" ? "#107E3E" : "#0A6ED1";
              return (
                <div key={d.no} data-testid={`fleet-card-${i}`} className="border rounded-md overflow-hidden" style={{ borderColor: variantColor + "33", background: `linear-gradient(180deg, ${variantColor}06 0%, #FFFFFF 60%)` }}>
                  <div className="p-3 border-b" style={{ borderColor: variantColor + "22" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{d.no}</div>
                        <div className="text-sm font-semibold text-[#1C252E] truncate">{d.customer}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <div className="px-3">
                    <TruckIllustration status={variant} />
                  </div>
                  <div className="p-3 pt-1">
                    <div className="text-[11px] text-[#59687A] truncate mb-2">{d.qty}</div>
                    <DeliveryTimeline status={d.status} />
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#59687A] font-mono-num">
                      <span>🚛 {d.truk}</span>
                      <span>{d.tglKirim}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Daftar Delivery Order</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">No. DO</th>
                <th className="px-4 py-2 text-left">SO Terkait</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Muatan</th>
                <th className="px-4 py-2 text-left">Truk</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left w-48">Linimasa</th>
                <th className="px-4 py-2 text-left">Tgl Kirim</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders.map((d, i) => (
                <tr key={d.no} data-testid={`do-row-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{d.no}</td>
                  <td className="px-4 font-mono-num text-[#59687A]">{d.so}</td>
                  <td className="px-4 font-medium">{d.customer}</td>
                  <td className="px-4">{d.qty}</td>
                  <td className="px-4 font-mono-num">{d.truk}</td>
                  <td className="px-4 text-[#59687A]">{d.driver}</td>
                  <td className="px-4"><DeliveryTimeline status={d.status} /></td>
                  <td className="px-4 font-mono-num">{d.tglKirim}</td>
                  <td className="px-4"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrders;
