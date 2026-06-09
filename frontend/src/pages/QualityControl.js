import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { qcInspections, rejects as initialRejects, rejectByReason, defectCategories, productionOrders } from "@/data/mockData";
import { ShieldCheck, AlertTriangle, Activity, Plus, Pencil, XCircle, Camera } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import FormDialog from "@/components/shared/FormDialog";
import { DefectIcon, QualityStamp, defectList, reasonToDefectKey } from "@/components/visuals/ProcessIcons";
import ProductIcon from "@/components/visuals/ProductIcon";
import { toast } from "sonner";

const COLORS = ["#0A6ED1", "#E9730C", "#107E3E", "#0070F2", "#B00020", "#59687A"];
const DISPOSISI_OPTIONS = ["Hancurkan", "Rework", "Downgrade", "Repair"];

const SEVERITY_STYLE = {
  Kritis: { bg: "#FBE6E9", color: "#B00020", border: "#B00020" },
  Mayor:  { bg: "#FDF3E7", color: "#E9730C", border: "#E9730C" },
  Minor:  { bg: "#FFF6E0", color: "#9C4F00", border: "#FBC36C" },
};

const RejectReasonBody = ({ record, onSave, onCancel }) => {
  const isEdit = Boolean(record?.no);
  const initialSelected = (() => {
    if (!record) return [];
    const seedAlasan = record.alasanList || (record.alasan ? [record.alasan] : []);
    return defectCategories
      .filter((d) => seedAlasan.some((a) =>
        d.nama.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(d.nama.toLowerCase())
      ))
      .map((d) => d.kode);
  })();

  const [selected, setSelected] = useState(initialSelected);
  const [produk, setProduk] = useState(record?.produk || "");
  const [qty, setQty] = useState(record?.qty || 1);
  const [po, setPo] = useState(record?.po || "");
  const [disposisi, setDisposisi] = useState(record?.disposisi || "Rework");
  const [catatan, setCatatan] = useState(record?.catatan || "");

  const toggle = (kode) => {
    setSelected((prev) => prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]);
  };

  const selectedDefects = defectCategories.filter((d) => selected.includes(d.kode));
  const highestLevel = selectedDefects.some((d) => d.tingkat === "Kritis") ? "Kritis"
                      : selectedDefects.some((d) => d.tingkat === "Mayor") ? "Mayor"
                      : selectedDefects.some((d) => d.tingkat === "Minor") ? "Minor" : null;
  const suggestedDisposisi = highestLevel === "Kritis" ? "Hancurkan" : highestLevel === "Mayor" ? "Rework" : highestLevel === "Minor" ? "Downgrade" : null;

  return (
    <>
      <div className="px-6 py-4 bg-gradient-to-r from-[#B00020] to-[#8A0019] text-white">
        <DialogHeader>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 font-semibold">
            {isEdit ? "Edit Alasan Reject" : "Tandai Produk Reject"}
          </div>
          <DialogTitle className="text-base font-display text-white">
            {isEdit ? record.no : "Reject Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/85">
            Pilih satu atau lebih kategori cacat sesuai standar SNI 7833:2012
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">PO Asal</label>
              <select
                value={po} onChange={(e) => setPo(e.target.value)}
                data-testid="reject-po-select"
                className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#B00020]/30 focus:border-[#B00020]"
              >
                <option value="">Pilih PO…</option>
                {productionOrders.map((o) => (
                  <option key={o.no} value={o.no}>{o.no} — {o.produk}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Produk</label>
              <input
                type="text" value={produk} onChange={(e) => setProduk(e.target.value)}
                data-testid="reject-produk-input"
                className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded focus:outline-none focus:ring-2 focus:ring-[#B00020]/30"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Jumlah Reject</label>
              <input
                type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                data-testid="reject-qty-input"
                className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded font-mono-num focus:outline-none focus:ring-2 focus:ring-[#B00020]/30"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">
              Alasan Reject <span className="text-[#B00020]">*</span>
            </label>
            <span className="text-[10px] text-[#59687A]" data-testid="reject-count">
              {selected.length} dipilih
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="reject-reason-grid">
            {defectCategories.filter((d) => d.aktif).map((d) => {
              const isSel = selected.includes(d.kode);
              const sev = SEVERITY_STYLE[d.tingkat] || SEVERITY_STYLE.Minor;
              return (
                <button
                  key={d.kode}
                  onClick={() => toggle(d.kode)}
                  data-testid={`reject-reason-${d.kode}`}
                  className={`text-left p-2.5 rounded border transition-all flex items-start gap-2.5 ${
                    isSel ? "border-[#B00020] bg-[#FBE6E9]/30 shadow-sm" : "border-[#DFE3E8] hover:border-[#B00020]/50 bg-white"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSel ? "bg-[#B00020] border-[#B00020]" : "border-[#A6B0BE]"
                    }`}
                  >
                    {isSel && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12"><path d="M2 6 L5 9 L10 3" stroke="currentColor" strokeWidth="2" fill="none" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-[#1C252E] truncate">{d.nama}</span>
                      <span
                        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                        style={{ backgroundColor: sev.bg, color: sev.color }}
                      >
                        {d.tingkat}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#59687A] line-clamp-1">{d.penyebabUmum}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {highestLevel && (
          <div
            className="p-3 rounded border flex items-start gap-2.5"
            style={{ backgroundColor: SEVERITY_STYLE[highestLevel].bg, borderColor: SEVERITY_STYLE[highestLevel].border + "55" }}
            data-testid="reject-severity-preview"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: SEVERITY_STYLE[highestLevel].color }} />
            <div className="flex-1 text-xs">
              <div className="font-semibold" style={{ color: SEVERITY_STYLE[highestLevel].color }}>
                Tingkat tertinggi: {highestLevel}
              </div>
              <div className="text-[#1C252E] opacity-80 mt-0.5">
                Disposisi yang disarankan: <span className="font-semibold">{suggestedDisposisi}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Disposisi</label>
            <select
              value={disposisi} onChange={(e) => setDisposisi(e.target.value)}
              data-testid="reject-disposisi-select"
              className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#B00020]/30"
            >
              {DISPOSISI_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Foto Bukti (opsional)</label>
            <button
              type="button"
              className="w-full mt-1 h-9 px-2.5 text-sm border border-dashed border-[#DFE3E8] rounded bg-[#F8FAFC] text-[#59687A] hover:border-[#0A6ED1] hover:text-[#0A6ED1] inline-flex items-center justify-center gap-1.5"
              data-testid="reject-photo-btn"
            >
              <Camera className="w-3.5 h-3.5" /> Unggah Foto
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Catatan QC (opsional)</label>
          <textarea
            rows={2}
            value={catatan} onChange={(e) => setCatatan(e.target.value)}
            data-testid="reject-catatan-input"
            placeholder="Catatan tambahan untuk tindak lanjut tim produksi…"
            className="w-full mt-1 px-2.5 py-2 text-sm border border-[#DFE3E8] rounded focus:outline-none focus:ring-2 focus:ring-[#B00020]/30 focus:border-[#B00020] resize-none"
          />
        </div>

        <div className="text-[10px] text-[#59687A] border-t border-[#EEF0F2] pt-2">
          Daftar alasan reject dapat dikonfigurasi lewat <a href="/master-data" className="text-[#0A6ED1] hover:underline">Master Data → Kategori Defect</a>
        </div>
      </div>

      <DialogFooter className="px-6 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="reject-cancel">Batal</Button>
        <Button
          size="sm"
          className="bg-[#B00020] hover:bg-[#8A0019] text-white"
          data-testid="reject-save"
          onClick={() => {
            if (selected.length === 0) { toast.error("Minimal pilih 1 alasan reject"); return; }
            if (!isEdit && !po) { toast.error("PO asal wajib dipilih"); return; }
            const alasanNames = defectCategories.filter((d) => selected.includes(d.kode)).map((d) => d.nama);
            onSave({
              alasanList: alasanNames,
              alasan: alasanNames[0],
              disposisi, catatan,
              tingkat: highestLevel,
              ...(isEdit ? {} : { produk, qty, po }),
            });
          }}
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" /> {isEdit ? "Simpan Alasan" : "Tandai Reject"}
        </Button>
      </DialogFooter>
    </>
  );
};

const RejectReasonDialog = ({ open, onOpenChange, record, onSave }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="reject-reason-dialog">
      {open && (
        <RejectReasonBody
          key={record?.no || "new"}
          record={record}
          onSave={(data) => { onSave(data); onOpenChange(false); }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

const QualityControl = () => {
  const [tab, setTab] = useState("inspections");
  const [rejects, setRejects] = useState(initialRejects);
  const [rejectDialog, setRejectDialog] = useState({ open: false, record: null });

  const openNewReject = () => setRejectDialog({ open: true, record: null });
  const openEditReject = (rec) => setRejectDialog({ open: true, record: rec });
  const closeRejectDialog = () => setRejectDialog({ open: false, record: null });

  const handleSaveReject = (data) => {
    if (rejectDialog.record) {
      setRejects((prev) => prev.map((r) => r.no === rejectDialog.record.no ? { ...r, ...data } : r));
      toast.success(`${rejectDialog.record.no} diperbarui`, { description: `${data.alasanList.length} alasan · ${data.disposisi}` });
    } else {
      const nextNum = String(rejects.length + 19).padStart(3, "0");
      const newRec = {
        no: `REJ-2026-${nextNum}`,
        tanggal: new Date().toISOString().slice(0, 10),
        ...data,
      };
      setRejects((prev) => [newRec, ...prev]);
      toast.success(`Reject ${newRec.no} dibuat`, { description: `${data.alasanList.length} alasan · ${data.disposisi}` });
    }
  };

  return (
    <div>
      <PageHeader
        title="Quality Control"
        subtitle="Inspeksi mutu beton, dimensi, dan manajemen produk reject"
        breadcrumbs={["Beranda", "Quality Control"]}
        testId="qc-page-header"
        actions={
          <FormDialog
            testId="qc-create"
            title="Inspeksi QC Baru"
            description="Catat hasil inspeksi quality control untuk batch produk"
            submitLabel="Simpan Inspeksi"
            successMessage="Inspeksi QC berhasil disimpan"
            fields={[
              { name: "po", label: "PO / Batch", type: "select", required: true, options: [
                { value: "PO-2026-0241", label: "PO-2026-0241 — U-Ditch 500" },
                { value: "PO-2026-0242", label: "PO-2026-0242 — U-Ditch 800" },
                { value: "PO-2026-0243", label: "PO-2026-0243 — Box Culvert 1500" },
              ]},
              { name: "jenis", label: "Jenis Inspeksi", type: "select", required: true, options: [
                { value: "dimensi", label: "Inspeksi Dimensi" },
                { value: "visual", label: "Inspeksi Visual" },
                { value: "full", label: "Inspeksi Lengkap" },
              ]},
              { name: "qty", label: "Jumlah Diinspeksi", type: "number", required: true },
              { name: "lulus", label: "Jumlah Lulus", type: "number" },
              { name: "inspektur", label: "Inspektur", type: "select", required: true, options: [
                { value: "Rina Kusumawati", label: "Rina Kusumawati" },
                { value: "Hendra Gunawan", label: "Hendra Gunawan" },
              ]},
              { name: "hasil", label: "Hasil", type: "select", options: [
                { value: "Lulus", label: "Lulus" },
                { value: "Lulus Bersyarat", label: "Lulus Bersyarat" },
                { value: "Reject", label: "Reject" },
              ]},
              { name: "catatan", label: "Catatan Inspeksi", type: "textarea", span: 2 },
            ]}
            trigger={
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />Inspeksi Baru</Button>
            }
          />
        }
      />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KPICard testId="qc-kpi-lulus" label="Lulus QC Hari Ini" value="42" unit="unit" icon={ShieldCheck} accent="success" trend="up" trendValue="+12%" />
          <KPICard testId="qc-kpi-reject" label="Reject Hari Ini" value="6" unit="unit" icon={AlertTriangle} accent="error" trend="up" trendValue="+2 unit" />
          <KPICard testId="qc-kpi-rate" label="Reject Rate" value="2.1%" icon={Activity} accent="warning" trend="up" trendValue="+0.4%" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto">
            <TabsTrigger value="inspections" className="text-xs h-8">Inspeksi Produk</TabsTrigger>
            <TabsTrigger value="rejects" className="text-xs h-8">Reject Management</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs h-8">Analisis Reject</TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">No. QC</th>
                    <th className="px-4 py-2 text-left">PO</th>
                    <th className="px-4 py-2 text-left">Produk</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Dimensi OK</th>
                    <th className="px-4 py-2 text-right">Reject</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Inspektur</th>
                    <th className="px-4 py-2 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {qcInspections.map((q, i) => (
                    <tr key={q.no} data-testid={`qc-row-${i}`}>
                      <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{q.no}</td>
                      <td className="px-4 font-mono-num">{q.po}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <ProductIcon name={q.produk} size="sm" />
                          <span className="font-medium">{q.produk}</span>
                        </div>
                      </td>
                      <td className="px-4 text-right font-mono-num">{q.qty}</td>
                      <td className="px-4 text-right font-mono-num text-[#107E3E]">{q.dimensiOK}</td>
                      <td className="px-4 text-right font-mono-num text-[#B00020]">{q.dimensiReject}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={q.status} />
                          {(q.status === "Lulus" || q.status === "Lulus Bersyarat") && <QualityStamp type="pass" />}
                          {q.status === "Reject" && <QualityStamp type="reject" />}
                        </div>
                      </td>
                      <td className="px-4 text-[#59687A]">{q.inspektur}</td>
                      <td className="px-4 font-mono-num text-[#59687A]">{q.tanggal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rejects" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8]">
                <div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Reject Management</div>
                  <div className="text-xs text-[#59687A]">Total {rejects.length} reject tercatat · Klik <span className="text-[#0A6ED1] font-medium">Edit Alasan</span> untuk mengubah alasan reject</div>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-[#B00020] hover:bg-[#8A0019] text-white"
                  onClick={openNewReject}
                  data-testid="reject-new-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Tandai Reject
                </Button>
              </div>
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">No. Reject</th>
                    <th className="px-4 py-2 text-left">Visual</th>
                    <th className="px-4 py-2 text-left">Produk</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-left">Alasan</th>
                    <th className="px-4 py-2 text-left">PO Asal</th>
                    <th className="px-4 py-2 text-left">Tanggal</th>
                    <th className="px-4 py-2 text-left">Disposisi</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rejects.map((r, i) => {
                    const reasons = r.alasanList || (r.alasan ? [r.alasan] : []);
                    return (
                      <tr key={r.no} data-testid={`reject-row-${i}`}>
                        <td className="px-4 font-mono-num text-[#B00020] font-medium">{r.no}</td>
                        <td className="px-4">
                          <DefectIcon type={reasonToDefectKey(reasons[0] || "")} className="w-12 h-9" />
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <ProductIcon name={r.produk} size="sm" />
                            <span className="font-medium">{r.produk}</span>
                          </div>
                        </td>
                        <td className="px-4 text-right font-mono-num">{r.qty}</td>
                        <td className="px-4">
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {reasons.slice(0, 2).map((a, idx) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#FBE6E9] text-[#B00020] font-medium">
                                {a}
                              </span>
                            ))}
                            {reasons.length > 2 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F6F8] text-[#59687A] font-medium">
                                +{reasons.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 font-mono-num text-[#59687A]">{r.po}</td>
                        <td className="px-4 font-mono-num text-[#59687A]">{r.tanggal}</td>
                        <td className="px-4"><StatusBadge status={r.disposisi} variant="warning" /></td>
                        <td className="px-4"><QualityStamp type="reject" /></td>
                        <td className="px-4 text-right">
                          <Button
                            data-testid={`btn-edit-reject-${i}`}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 hover:bg-[#FBE6E9] hover:border-[#B00020] hover:text-[#B00020]"
                            onClick={() => openEditReject(r)}
                          >
                            <Pencil className="w-3 h-3" /> Edit Alasan
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            {/* Defect Reference Gallery */}
            <div className="bg-white border border-[#DFE3E8] rounded-md p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Galeri Cacat Referensi</div>
                  <div className="text-xs text-[#59687A]">Standar visual untuk identifikasi defect mengacu SNI 7833:2012</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {defectList.map((d) => (
                  <div key={d.key} data-testid={`defect-card-${d.key}`} className="border border-[#DFE3E8] rounded-md overflow-hidden">
                    <DefectIcon type={d.key} className="w-full !h-24 !rounded-none !border-0 border-b" />
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-semibold text-[#1C252E]">{d.label}</div>
                        <QualityStamp type="reject" className="!text-[9px] !py-0 !px-1.5" />
                      </div>
                      <div className="text-[11px] text-[#59687A]">{d.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
                <div className="text-base font-semibold text-[#1C252E] font-display mb-4">Distribusi Penyebab Reject</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={rejectByReason} dataKey="jumlah" nameKey="alasan" cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                      {rejectByReason.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {rejectByReason.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[#59687A] flex-1">{r.alasan}</span>
                      <span className="font-mono-num font-medium">{r.jumlah}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
                <div className="text-base font-semibold text-[#1C252E] font-display mb-4">Jumlah Reject per Kategori</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rejectByReason} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="alasan" tick={{ fontSize: 11, fill: "#1C252E" }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#B00020" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <RejectReasonDialog
          open={rejectDialog.open}
          onOpenChange={(o) => { if (!o) closeRejectDialog(); }}
          record={rejectDialog.record}
          onSave={handleSaveReject}
        />
      </div>
    </div>
  );
};

export default QualityControl;
