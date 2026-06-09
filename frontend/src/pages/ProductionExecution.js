import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { productionOrders, productionLines, productionStatuses, processDefinitions } from "@/data/mockData";
import { ArrowRight, Pencil, ArrowUpRight, Clock } from "lucide-react";
import { ProcessIcon } from "@/components/visuals/ProcessIcons";
import ProductIcon from "@/components/visuals/ProductIcon";
import { toast } from "sonner";

const stages = [
  { id: "casting",    label: "Casting",         color: "#0A6ED1" },
  { id: "curing",     label: "Curing",          color: "#E9730C" },
  { id: "demoulding", label: "Demoulding",      color: "#0070F2" },
  { id: "qc",         label: "Quality Control", color: "#107E3E" },
];

// Stage choices derived from configurable production statuses (Master Data).
const stageOptions = productionStatuses.filter((s) => s.aktif && s.status !== "Direncanakan");

const StageEditBody = ({ order, onSave, onCancel }) => {
  const [newStage, setNewStage] = useState(order.status);
  const [progress, setProgress] = useState(order.progress);
  const [note, setNote] = useState("");

  return (
    <>
      <div className="px-6 py-4 bg-gradient-to-r from-[#0A6ED1] to-[#0854A1] text-white">
        <DialogHeader>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 font-semibold">Edit Tahap Produksi</div>
          <DialogTitle className="text-base font-display text-white">{order.no}</DialogTitle>
          <DialogDescription className="text-xs text-white/85">
            {order.produk} · {order.qty} unit · Line {order.line}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Tahap Saat Ini</div>
            <div className="mt-1.5"><StatusBadge status={order.status} /></div>
          </div>
          <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Progress Sekarang</div>
            <div className="text-xl font-semibold font-mono-num text-[#1C252E] mt-1">{order.progress}%</div>
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Pilih Tahap Baru</label>
          <div className="grid grid-cols-2 gap-2 mt-2" data-testid="stage-picker">
            {stageOptions.map((s) => {
              const selected = newStage === s.status;
              return (
                <button
                  key={s.kode}
                  data-testid={`stage-option-${s.status.replace(/\s/g, "-")}`}
                  onClick={() => setNewStage(s.status)}
                  className={`text-left p-2.5 rounded border transition-all ${
                    selected ? "border-[#0A6ED1] bg-[#E5F0FA]" : "border-[#DFE3E8] hover:border-[#0A6ED1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.warna }} />
                    <span className="text-xs font-semibold text-[#1C252E]">{s.status}</span>
                  </div>
                  <div className="text-[10px] text-[#59687A] mt-0.5 line-clamp-1">{s.deskripsi}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Progress (%)</label>
            <span className="text-sm font-mono-num font-semibold text-[#0A6ED1]" data-testid="stage-progress-value">{progress}%</span>
          </div>
          <input
            type="range"
            min={0} max={100} step={1}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full mt-2 accent-[#0A6ED1]"
            data-testid="stage-progress-slider"
          />
          <div className="flex items-center justify-between text-[10px] text-[#59687A] font-mono-num mt-1">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Catatan Operator (opsional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mis. Selesai casting, masuk chamber B"
            data-testid="stage-note-input"
            className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded focus:outline-none focus:ring-2 focus:ring-[#0A6ED1]/30 focus:border-[#0A6ED1]"
          />
        </div>

        <div className="text-[10px] text-[#59687A] flex items-center gap-1.5 border-t border-[#EEF0F2] pt-2">
          <Clock className="w-3 h-3" />
          Tahap dapat dikonfigurasi lewat <a href="/master-process" className="text-[#0A6ED1] hover:underline">Master Proses</a> ({processDefinitions.filter((p) => p.aktif).length} tahap aktif)
        </div>
      </div>

      <DialogFooter className="px-6 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="stage-edit-cancel">Batal</Button>
        <Button
          size="sm" className="bg-[#0A6ED1] hover:bg-[#0854A1]"
          data-testid="stage-edit-save"
          onClick={() => onSave({ status: newStage, progress, note })}
        >
          Simpan Perubahan
        </Button>
      </DialogFooter>
    </>
  );
};

const StageEditDialog = ({ open, onOpenChange, order, onSave }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="stage-edit-dialog">
      {order && (
        <StageEditBody
          key={order.no}
          order={order}
          onSave={(data) => { onSave(data); onOpenChange(false); }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

const ProductionExecution = () => {
  const [orders, setOrders] = useState(productionOrders);
  const [editOrder, setEditOrder] = useState(null);
  const active = orders.filter((o) => o.status !== "Selesai" && o.status !== "Direncanakan");

  const handleSaveStage = ({ status, progress, note }) => {
    setOrders((prev) =>
      prev.map((o) => (o.no === editOrder.no ? { ...o, status, progress } : o))
    );
    toast.success(
      `${editOrder.no} → ${status}`,
      { description: `Progress ${progress}%${note ? ` · ${note}` : ""}` }
    );
  };

  return (
    <div>
      <PageHeader
        title="Eksekusi Produksi"
        subtitle="Pemantauan real-time proses casting, curing, demoulding & QC"
        breadcrumbs={["Beranda", "Eksekusi Produksi"]}
        testId="exec-page-header"
      />
      <div className="p-6 space-y-6">
        {/* Global Process Status — 5-stage live pipeline */}
        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden" data-testid="global-process-status">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8] bg-gradient-to-r from-[#F8FAFC] to-white">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#0A6ED1] font-semibold">Live Pipeline</div>
              <div className="text-base font-display font-semibold text-[#1C252E]">Global Process Status</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#59687A]">
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#5DCB7E] animate-pulse" />Real-time · Auto-refresh 5s</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5">
            {[
              { id: "batching",  label: "Batching",   color: "#0A6ED1", inQ: 18, outQ: 16, wait: 4, util: 88 },
              { id: "casting",   label: "Casting",    color: "#0070F2", inQ: 16, outQ: 14, wait: 8, util: 72 },
              { id: "curing",    label: "Curing",     color: "#E9730C", inQ: 14, outQ: 0,  wait: 248, util: 95 },
              { id: "finishing", label: "Finishing",  color: "#107E3E", inQ: 22, outQ: 20, wait: 12, util: 64 },
              { id: "storage",   label: "Storage",    color: "#59687A", inQ: 20, outQ: 18, wait: 0,  util: 92 },
            ].map((s, i, arr) => (
              <div key={s.id} data-testid={`pipeline-${s.id}`} className="relative px-4 py-4 border-r border-[#EEF0F2] last:border-r-0 group hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: s.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#1C252E]">{s.label}</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-[#59687A] mb-1">
                    <span>Utilisasi</span>
                    <span className="font-mono-num font-semibold" style={{ color: s.color }}>{s.util}%</span>
                  </div>
                  <div className="h-1.5 bg-[#EEF0F2] rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${s.util}%`, backgroundColor: s.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">In</div>
                    <div className="text-sm font-mono-num font-semibold text-[#1C252E]">{s.inQ}</div>
                  </div>
                  <div className="border-l border-r border-[#EEF0F2]">
                    <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Out</div>
                    <div className="text-sm font-mono-num font-semibold text-[#107E3E]">{s.outQ}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#59687A] font-semibold">Wait</div>
                    <div className="text-sm font-mono-num font-semibold text-[#E9730C]">{s.wait}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:flex absolute right-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 items-center justify-center bg-white border border-[#DFE3E8] rounded-full z-10">
                    <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1 L 5 4 L 1 7" stroke="#59687A" strokeWidth="1.4" fill="none" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-1 bg-gradient-to-r from-[#0A6ED1] via-[#0070F2] via-30% via-[#E9730C] via-60% via-[#107E3E] via-85% to-[#59687A]" />
        </div>

        {/* Lines status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {productionLines.map((l, i) => (
            <div key={l.kode} data-testid={`line-card-${i}`} className="bg-white border border-[#DFE3E8] rounded-md p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{l.kode}</div>
                  <div className="text-sm font-semibold text-[#1C252E] font-display">{l.nama}</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
              <div className="text-xs text-[#59687A] mb-2">{l.produk}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-semibold font-mono-num text-[#1C252E]">{l.output}</span>
                <span className="text-xs text-[#59687A]">/ {l.kapasitas} unit</span>
              </div>
              <Progress value={(l.output / l.kapasitas) * 100} className="h-1.5" />
              <div className="mt-3 text-xs text-[#59687A]">Supervisor: <span className="text-[#1C252E] font-medium">{l.supervisor}</span></div>
            </div>
          ))}
        </div>

        {/* Stage pipeline */}
        <div className="bg-white border border-[#DFE3E8] rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-base font-semibold text-[#1C252E] font-display">Alur Proses Produksi</div>
              <div className="text-xs text-[#59687A]">Casting → Curing → Demoulding → Quality Control</div>
            </div>
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto">
            {stages.map((s, i) => {
              const count = active.filter((o) => o.status.toLowerCase() === s.label.toLowerCase() || (s.id === "qc" && o.status === "QC")).length;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="relative border rounded-md p-4 min-w-[210px] overflow-hidden"
                    style={{ borderColor: s.color + "33", background: `linear-gradient(135deg, ${s.color}08 0%, #FFFFFF 60%)` }}
                    data-testid={`stage-${s.id}`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + "12" }}>
                        <ProcessIcon stage={s.id} color={s.color} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Tahap {i + 1}</div>
                        <div className="text-sm font-semibold text-[#1C252E]">{s.label}</div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold font-mono-num" style={{ color: s.color }}>{count}</span>
                      <span className="text-xs text-[#59687A]">order aktif</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: s.color }} />
                  </div>
                  {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-[#59687A] flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Order Sedang Berjalan</div>
            <div className="text-xs text-[#59687A]">Total {active.length} order aktif di lantai produksi · Klik <span className="font-medium text-[#0A6ED1]">Edit Tahap</span> untuk mengubah tahap & progress</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">No. PO</th>
                <th className="px-4 py-2 text-left">Produk</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-left">Line</th>
                <th className="px-4 py-2 text-left">Tahap Saat Ini</th>
                <th className="px-4 py-2 text-left w-56">Progress</th>
                <th className="px-4 py-2 text-left">Target Selesai</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {active.map((o, i) => (
                <tr key={o.no} data-testid={`exec-row-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{o.no}</td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <ProductIcon name={o.produk} size="sm" />
                      <span className="font-medium">{o.produk}</span>
                    </div>
                  </td>
                  <td className="px-4 text-right font-mono-num">{o.qty}</td>
                  <td className="px-4">{o.line}</td>
                  <td className="px-4"><StatusBadge status={o.status} /></td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <Progress value={o.progress} className="h-1.5 flex-1" />
                      <span className="font-mono-num text-xs w-9 text-right">{o.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 font-mono-num text-[#59687A]">{o.tglSelesai}</td>
                  <td className="px-4 text-right">
                    <Button
                      data-testid={`btn-edit-stage-${i}`}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1 hover:bg-[#E5F0FA] hover:border-[#0A6ED1] hover:text-[#0A6ED1]"
                      onClick={() => setEditOrder(o)}
                    >
                      <Pencil className="w-3 h-3" /> Edit Tahap
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <StageEditDialog
          open={Boolean(editOrder)}
          onOpenChange={(o) => { if (!o) setEditOrder(null); }}
          order={editOrder}
          onSave={handleSaveStage}
        />
      </div>
    </div>
  );
};

export default ProductionExecution;
