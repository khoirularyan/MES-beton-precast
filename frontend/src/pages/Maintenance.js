import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { maintenanceLog, machines } from "@/data/mockData";
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, Cog, Activity, Pause } from "lucide-react";
import FormDialog from "@/components/shared/FormDialog";

// Deterministic OEE/utilization computed from machine code so visuals are realistic & stable
const machineMetrics = (kode) => {
  const seed = kode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const oee = 55 + (seed % 38); // 55-92
  const util = 50 + ((seed * 3) % 45); // 50-94
  const mtbf = 120 + (seed % 80); // hours
  return { oee, util, mtbf };
};

// Map status → visual config
const machineVisual = {
  "Running":      { color: "#107E3E", bg: "#E6F5EC", icon: Activity,   label: "Running" },
  "Idle":         { color: "#0A6ED1", bg: "#E5F0FA", icon: Pause,      label: "Idle" },
  "Maintenance":  { color: "#E9730C", bg: "#FDF3E7", icon: Wrench,     label: "Maintenance" },
  "Breakdown":    { color: "#B00020", bg: "#FBE6E9", icon: AlertTriangle, label: "Breakdown" },
};

// Machine equipment SVG by type
const MachineEquip = ({ tipe, color = "#0A6ED1" }) => {
  if (tipe === "Mixer") return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="14" y="20" width="52" height="22" rx="2" fill={color} opacity="0.85" />
      <polygon points="14,20 66,20 56,8 24,8" fill={color} />
      <rect x="22" y="42" width="6" height="14" fill="#1C252E" />
      <rect x="52" y="42" width="6" height="14" fill="#1C252E" />
      <line x1="40" y1="20" x2="40" y2="8" stroke="#FBC36C" strokeWidth="2" />
      <circle cx="40" cy="8" r="3" fill="#FBC36C" />
    </svg>
  );
  if (tipe === "Material Handling") return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="6" y="14" width="68" height="3" fill="#59687A" />
      <line x1="14" y1="6" x2="14" y2="14" stroke="#59687A" strokeWidth="2" />
      <line x1="66" y1="6" x2="66" y2="14" stroke="#59687A" strokeWidth="2" />
      <rect x="34" y="17" width="14" height="8" fill={color} />
      <line x1="41" y1="25" x2="41" y2="36" stroke="#1C252E" strokeWidth="1.5" />
      <rect x="32" y="36" width="18" height="14" fill="#C7CCD3" stroke="#1C252E" strokeWidth="0.6" />
      <rect x="32" y="36" width="18" height="2" fill={color} />
    </svg>
  );
  if (tipe === "Casting") return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="10" y="32" width="60" height="14" fill={color} opacity="0.85" stroke="#1C252E" strokeWidth="0.6" />
      {[14, 24, 34, 44, 54, 64].map((x, i) => <line key={i} x1={x} y1="32" x2={x} y2="46" stroke="#1C252E" strokeWidth="0.4" opacity="0.5" />)}
      <rect x="10" y="46" width="60" height="6" fill="#1C252E" />
      <line x1="20" y1="52" x2="20" y2="56" stroke="#59687A" strokeWidth="2" />
      <line x1="60" y1="52" x2="60" y2="56" stroke="#59687A" strokeWidth="2" />
      {/* Vibration waves */}
      <path d="M 20 26 Q 24 22 28 26 Q 32 30 36 26" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M 44 26 Q 48 22 52 26 Q 56 30 60 26" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
    </svg>
  );
  if (tipe === "Curing") return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="10" y="22" width="60" height="30" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <rect x="10" y="22" width="60" height="6" fill={color} opacity="0.2" />
      <path d="M 22 18 Q 20 12 24 8" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M 36 18 Q 34 10 38 4" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M 50 18 Q 48 12 52 8" fill="none" stroke={color} strokeWidth="1.5" />
      {/* Thermometer inside */}
      <line x1="40" y1="32" x2="40" y2="42" stroke={color} strokeWidth="2" />
      <circle cx="40" cy="44" r="3" fill={color} />
    </svg>
  );
  if (tipe === "QC Lab") return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="14" y="14" width="32" height="40" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <rect x="22" y="10" width="16" height="8" rx="1" fill={color} opacity="0.85" />
      <path d="M 19 28 L 22 31 L 28 25" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="32" y1="28" x2="42" y2="28" stroke={color} strokeWidth="1.2" />
      <path d="M 19 38 L 22 41 L 28 35" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="32" y1="38" x2="42" y2="38" stroke={color} strokeWidth="1.2" />
      <circle cx="58" cy="42" r="6" fill="white" stroke={color} strokeWidth="2" />
      <line x1="62" y1="46" x2="68" y2="52" stroke={color} strokeWidth="2" />
    </svg>
  );
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="14" y="14" width="52" height="40" fill={color} opacity="0.6" />
      <Cog />
    </svg>
  );
};

const MachineCard = ({ m, i }) => {
  const v = machineVisual[m.status] || machineVisual.Running;
  const { oee, util, mtbf } = machineMetrics(m.kode);
  const Icon = v.icon;
  return (
    <div data-testid={`mach-card-${i}`} className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden hover:border-[#0A6ED1] hover:shadow-sm transition-all">
      {/* Equipment visual header */}
      <div className="aspect-[16/9] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${v.bg} 0%, white 65%)` }}>
        <div className="absolute inset-3">
          <MachineEquip tipe={m.tipe} color={v.color} />
        </div>
        {/* Status badge top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white shadow-sm border" style={{ borderColor: v.color + "40" }}>
          <span className={`w-1.5 h-1.5 rounded-full ${m.status === "Running" ? "animate-pulse" : ""}`} style={{ backgroundColor: v.color }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: v.color }}>{v.label}</span>
        </div>
        {/* Icon top-left */}
        <div className="absolute top-2 left-2 w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" style={{ color: v.color }} />
        </div>
      </div>
      <div className="p-3 border-t border-[#DFE3E8]">
        <div className="text-[10px] font-mono-num text-[#0A6ED1] font-medium">{m.kode}</div>
        <div className="text-sm font-semibold text-[#1C252E] truncate" title={m.nama}>{m.nama}</div>
        <div className="text-[11px] text-[#59687A] mb-3">{m.tipe} • {m.line}</div>
        {/* OEE bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-[#59687A] uppercase tracking-wider font-semibold">OEE</span>
            <span className="font-mono-num font-semibold" style={{ color: oee >= 75 ? "#107E3E" : oee >= 60 ? "#0A6ED1" : "#E9730C" }}>{oee}%</span>
          </div>
          <div className="h-1 bg-[#EEF0F2] rounded-full overflow-hidden">
            <div className="h-full" style={{ width: `${oee}%`, backgroundColor: oee >= 75 ? "#107E3E" : oee >= 60 ? "#0A6ED1" : "#E9730C" }} />
          </div>
        </div>
        {/* Utilisasi bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-[#59687A] uppercase tracking-wider font-semibold">Utilisasi</span>
            <span className="font-mono-num font-semibold text-[#1C252E]">{util}%</span>
          </div>
          <div className="h-1 bg-[#EEF0F2] rounded-full overflow-hidden">
            <div className="h-full bg-[#0A6ED1]" style={{ width: `${util}%` }} />
          </div>
        </div>
        {/* MTBF + Next */}
        <div className="mt-3 pt-2 border-t border-[#EEF0F2] flex items-center justify-between text-[10px]">
          <div>
            <div className="text-[#59687A] uppercase tracking-wider font-semibold">MTBF</div>
            <div className="font-mono-num font-semibold text-[#1C252E]">{mtbf}h</div>
          </div>
          <div className="text-right">
            <div className="text-[#59687A] uppercase tracking-wider font-semibold">Next PM</div>
            <div className="font-mono-num font-semibold text-[#1C252E]">{m.nextMaintenance}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Maintenance = () => {
  // Count machines by status (with synthetic Idle/Breakdown additions for visual richness)
  const statusCount = {
    Running: machines.filter(m => m.status === "Running").length,
    Idle: 1,
    Maintenance: machines.filter(m => m.status === "Maintenance").length,
    Breakdown: 0,
  };

  return (
    <div>
      <PageHeader
        title="Pemeliharaan"
        subtitle="Manajemen preventive & corrective maintenance mesin produksi"
        breadcrumbs={["Beranda", "Pemeliharaan"]}
        testId="maint-page-header"
        actions={
          <FormDialog
            testId="wo-create"
            title="Work Order Maintenance Baru"
            description="Buat work order pemeliharaan mesin"
            submitLabel="Buat Work Order"
            successMessage="Work Order maintenance berhasil dibuat"
            fields={[
              { name: "mesin", label: "Mesin", type: "select", required: true, options: machines.map(m => ({ value: m.kode, label: `${m.kode} — ${m.nama}` })) },
              { name: "tipe", label: "Tipe Maintenance", type: "select", required: true, options: [
                { value: "Preventif", label: "Preventif" },
                { value: "Korektif", label: "Korektif" },
                { value: "Prediktif", label: "Prediktif" },
              ]},
              { name: "prioritas", label: "Prioritas", type: "select", options: [
                { value: "Tinggi", label: "Tinggi" },
                { value: "Sedang", label: "Sedang" },
                { value: "Rendah", label: "Rendah" },
              ]},
              { name: "teknisi", label: "Teknisi", type: "select", options: [
                { value: "Tim Mekanik A", label: "Tim Mekanik A" },
                { value: "Tim Mekanik B", label: "Tim Mekanik B" },
                { value: "PT Mitra Servis", label: "PT Mitra Servis (Vendor)" },
              ]},
              { name: "tglMulai", label: "Tanggal Mulai", type: "date", required: true },
              { name: "estimasi", label: "Estimasi Selesai", type: "date" },
              { name: "masalah", label: "Masalah / Pekerjaan", type: "textarea", span: 2, required: true, placeholder: "Deskripsi masalah atau jenis pekerjaan maintenance" },
            ]}
            trigger={<Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />Work Order Baru</Button>}
          />
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="mt-kpi-active" label="Maintenance Berlangsung" value="1" unit="WO" icon={Wrench} accent="warning" />
          <KPICard testId="mt-kpi-due" label="Jatuh Tempo 7 Hari" value="2" unit="mesin" icon={AlertTriangle} accent="error" />
          <KPICard testId="mt-kpi-done" label="Selesai Bulan Ini" value="4" unit="WO" icon={CheckCircle2} accent="success" />
          <KPICard testId="mt-kpi-uptime" label="Uptime Mesin" value="96.8%" icon={Clock} accent="success" trend="up" trendValue="+1.2%" />
        </div>

        {/* Machine Monitoring (Asset Cards) */}
        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden" data-testid="machine-monitoring">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#0A6ED1] font-semibold">Asset Management</div>
              <div className="text-base font-display font-semibold text-[#1C252E]">Machine Monitoring</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#59687A]">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#107E3E]" />Running ({statusCount.Running})</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0A6ED1]" />Idle ({statusCount.Idle})</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E9730C]" />Maintenance ({statusCount.Maintenance})</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B00020]" />Breakdown ({statusCount.Breakdown})</span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {machines.map((m, i) => <MachineCard key={m.kode} m={m} i={i} />)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* WO Log */}
          <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DFE3E8]">
              <div className="text-base font-semibold text-[#1C252E] font-display">Riwayat Work Order</div>
            </div>
            <table className="w-full mes-table">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">No.</th>
                  <th className="px-4 py-2 text-left">Mesin</th>
                  <th className="px-4 py-2 text-left">Tipe</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLog.map((m, i) => (
                  <tr key={m.no} data-testid={`mt-row-${i}`}>
                    <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{m.no}</td>
                    <td className="px-4">
                      <div className="font-medium text-[13px]">{m.nama}</div>
                      <div className="text-[11px] text-[#59687A] font-mono-num">{m.mesin}</div>
                    </td>
                    <td className="px-4">{m.tipe}</td>
                    <td className="px-4"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PM Schedule */}
          <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DFE3E8]">
              <div className="text-base font-semibold text-[#1C252E] font-display">Jadwal Preventive Maintenance</div>
            </div>
            <div className="divide-y divide-[#EEF0F2]">
              {machines.map((m, i) => (
                <div key={m.kode} data-testid={`mach-row-${i}`} className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-[12px] text-[#0A6ED1] font-medium">{m.kode}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="text-sm font-medium text-[#1C252E] mt-0.5">{m.nama}</div>
                    <div className="text-[11px] text-[#59687A]">{m.tipe} • {m.line}</div>
                  </div>
                  <div className="text-right text-[11px] text-[#59687A] flex-shrink-0">
                    <div>Next: <span className="font-mono-num text-[#1C252E]">{m.nextMaintenance}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full WO details */}
        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Detail Work Order</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">No. WO</th>
                <th className="px-4 py-2 text-left">Mesin</th>
                <th className="px-4 py-2 text-left">Masalah / Pekerjaan</th>
                <th className="px-4 py-2 text-left">Teknisi</th>
                <th className="px-4 py-2 text-left">Mulai</th>
                <th className="px-4 py-2 text-left">Estimasi Selesai</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLog.map((m, i) => (
                <tr key={m.no} data-testid={`mt-detail-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{m.no}</td>
                  <td className="px-4 font-medium">{m.nama}</td>
                  <td className="px-4">{m.masalah}</td>
                  <td className="px-4 text-[#59687A]">{m.teknisi}</td>
                  <td className="px-4 font-mono-num text-[#59687A]">{m.mulai}</td>
                  <td className="px-4 font-mono-num">{m.estimasi}</td>
                  <td className="px-4"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
