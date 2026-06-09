// Business Flow — End-to-end visual explanation of how products move through the factory.
// Sales Order → Production Order → Production Process → QC → Finished Goods → Delivery

import PageHeader from "@/components/shared/PageHeader";
import { businessFlow, processDefinitions } from "@/data/mockData";
import {
  ShoppingCart, ClipboardList, Factory, ShieldCheck, Package, Truck,
  ArrowRight, ChevronRight, ArrowDown, FileText, Database, GitBranch, Layers,
} from "lucide-react";

const ICONS = { ShoppingCart, ClipboardList, Factory, ShieldCheck, Package, Truck };

const FlowNode = ({ step, i }) => {
  const Icon = ICONS[step.icon] || Factory;
  return (
    <div
      data-testid={`flow-node-${step.id}`}
      className="relative bg-white border border-[#DFE3E8] rounded-md p-5 hover:border-[#0A6ED1] hover:shadow-md transition-all cursor-default group"
      style={{ borderTopWidth: 4, borderTopColor: step.warna }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${step.warna} 0%, ${step.warna}cc 100%)`, color: "white" }}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold font-mono-num">Tahap {i + 1}</span>
            <span className="text-[10px] text-[#59687A] font-mono-num">{step.id}</span>
          </div>
          <div className="text-base font-display font-semibold text-[#1C252E]">{step.nama}</div>
        </div>
      </div>
      <p className="text-xs text-[#59687A] mt-3 leading-relaxed">{step.deskripsi}</p>
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#EEF0F2]">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Input</div>
          <div className="text-[11px] text-[#1C252E] font-medium mt-0.5">{step.input}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Output</div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: step.warna }}>{step.output}</div>
        </div>
      </div>
    </div>
  );
};

const KeyMetric = ({ label, value, accent }) => (
  <div className="bg-white border border-[#DFE3E8] rounded-md p-3 text-center">
    <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{label}</div>
    <div className="text-xl font-semibold font-mono-num mt-1" style={{ color: accent }}>{value}</div>
  </div>
);

const BusinessFlow = () => {
  const activeStages = processDefinitions.filter((p) => p.aktif);

  return (
    <div>
      <PageHeader
        title="Alur Bisnis Pabrik"
        subtitle="Bagaimana produk bergerak dari order customer hingga diterima di lapangan"
        breadcrumbs={["Beranda", "Alur Bisnis"]}
        testId="business-flow-header"
      />
      <div className="p-6 space-y-6">
        {/* Hero strip */}
        <div className="relative bg-gradient-to-r from-[#0A2540] via-[#0854A1] to-[#0A6ED1] rounded-md p-6 overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diag)" />
            </svg>
          </div>
          <div className="relative flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#9DD8FF] font-semibold">End-to-End Process</div>
              <div className="text-2xl font-display font-semibold mt-1">Dari Order Customer Hingga Diterima di Lapangan</div>
              <div className="text-xs text-[#B9DCFF] mt-1.5 max-w-2xl">
                Setiap produk melewati 6 fase bisnis utama. Klik tiap tahap untuk memahami input, output, dan data yang terlibat.
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#9DD8FF]">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5DCB7E] animate-pulse" /> Live Demo Flow
              </span>
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <KeyMetric label="Fase Bisnis" value={businessFlow.length} accent="#0A6ED1" />
          <KeyMetric label="Tahap Produksi" value={activeStages.length} accent="#E9730C" />
          <KeyMetric label="Master Data" value="19" accent="#107E3E" />
          <KeyMetric label="KPI Dashboard" value="12" accent="#9C4F00" />
          <KeyMetric label="Parameter QC" value="8" accent="#107E3E" />
          <KeyMetric label="Status Custom" value="13" accent="#59687A" />
        </div>

        {/* Main Flow */}
        <div className="bg-white border border-[#DFE3E8] rounded-md p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Alur Utama</div>
              <div className="text-base font-display font-semibold text-[#1C252E]">6 Fase Bisnis Pabrik Precast</div>
            </div>
            <div className="text-[11px] text-[#59687A]">Order → Produksi → QC → Pengiriman</div>
          </div>

          {/* Horizontal flow connectors (desktop) */}
          <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-center gap-2">
            {businessFlow.map((step, i) => (
              <div key={step.id} className="contents">
                <FlowNode step={step} i={i} />
                {i < businessFlow.length - 1 && (
                  <div className="flex items-center justify-center px-1">
                    <div className="w-8 h-8 rounded-full bg-[#E5F0FA] flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-[#0A6ED1]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stacked flow (mobile/tablet) */}
          <div className="xl:hidden space-y-3">
            {businessFlow.map((step, i) => (
              <div key={step.id}>
                <FlowNode step={step} i={i} />
                {i < businessFlow.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-8 h-8 rounded-full bg-[#E5F0FA] flex items-center justify-center">
                      <ArrowDown className="w-4 h-4 text-[#0A6ED1]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail of production stage */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Detail Tahap 3</div>
                <div className="text-base font-display font-semibold text-[#1C252E]">Proses Produksi · {activeStages.length} Sub-Tahap</div>
              </div>
              <a href="/master-process" className="text-[11px] text-[#0A6ED1] hover:underline inline-flex items-center gap-1">
                Kelola Tahap <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {activeStages.map((p, i, arr) => (
                <div key={p.id} className="flex items-center flex-shrink-0">
                  <div
                    className="px-3 py-2 rounded text-[11px] font-semibold text-center min-w-[110px]"
                    style={{ backgroundColor: p.warna + "1A", color: p.warna, border: `1px solid ${p.warna}40` }}
                  >
                    <div className="text-[9px] font-mono-num opacity-70">#{p.urutan}</div>
                    <div className="leading-tight">{p.nama}</div>
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-[#DFE3E8] mx-0.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-[#59687A]">
              Konfigurasi tahap dapat diubah lewat <a href="/master-process" className="text-[#0A6ED1] hover:underline">Master Proses</a> tanpa coding.
            </div>
          </div>

          {/* Data sources panel */}
          <div className="bg-white border border-[#DFE3E8] rounded-md p-5">
            <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Pondasi Master Data</div>
            <div className="text-sm font-display font-semibold text-[#1C252E] mb-3">Sumber Konfigurasi</div>
            <div className="space-y-2">
              {[
                { icon: Database, label: "Master Produk & Kategori", count: "14 produk · 7 kategori", color: "#0A6ED1" },
                { icon: Layers, label: "Tipe & Spesifikasi", count: "10 tipe · 8 spec", color: "#0070F2" },
                { icon: GitBranch, label: "Proses Produksi", count: `${activeStages.length} tahap aktif`, color: "#E9730C" },
                { icon: ShieldCheck, label: "Parameter QC & Defect", count: "8 parameter · 7 defect", color: "#107E3E" },
                { icon: FileText, label: "Status Produksi & Pengiriman", count: "7 + 6 status", color: "#59687A" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: s.color + "22", color: s.color }}>
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#1C252E] truncate">{s.label}</div>
                    <div className="text-[10px] text-[#59687A] font-mono-num">{s.count}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="/master-data"
              className="mt-3 block text-center text-[11px] text-[#0A6ED1] hover:underline border-t border-[#EEF0F2] pt-3"
            >
              Buka Master Data →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessFlow;
