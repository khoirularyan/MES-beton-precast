// Master Proses — Visual workflow builder for production process stages.
// Frontend-only configurable: add/edit/delete/reorder/toggle process steps.

import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowDown, GripVertical, Pencil, Trash2, ChevronUp, ChevronDown, Power, Clock } from "lucide-react";
import { processDefinitions as initialProcesses } from "@/data/mockData";
import { toast } from "sonner";
import {
  Wrench, Boxes, Droplet, Thermometer, Unlock, Search, Hammer, ShieldCheck, Tag, Package,
} from "lucide-react";

const ICONS = { Wrench, Boxes, Droplet, Thermometer, Unlock, Search, Hammer, ShieldCheck, Tag, Package };
const ICON_OPTIONS = Object.keys(ICONS);
const COLOR_OPTIONS = ["#0A6ED1", "#0070F2", "#E9730C", "#FBC36C", "#107E3E", "#5DCB7E", "#9C4F00", "#B00020", "#59687A"];

const ProcessCard = ({ p, index, total, onMove, onEdit, onDelete, onToggle }) => {
  const Icon = ICONS[p.icon] || Wrench;
  return (
    <div
      data-testid={`process-card-${p.id}`}
      className={`relative bg-white border rounded-md p-4 transition-all hover:shadow-sm group ${
        p.aktif ? "border-[#DFE3E8]" : "border-[#EEF0F2] opacity-60"
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: p.warna }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <button
            data-testid={`process-move-up-${p.id}`}
            disabled={index === 0}
            onClick={() => onMove(p.id, -1)}
            className="w-5 h-5 text-[#59687A] hover:text-[#0A6ED1] disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <GripVertical className="w-3.5 h-3.5 text-[#DFE3E8]" />
          <button
            data-testid={`process-move-down-${p.id}`}
            disabled={index === total - 1}
            onClick={() => onMove(p.id, 1)}
            className="w-5 h-5 text-[#59687A] hover:text-[#0A6ED1] disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div
          className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: p.warna + "22", color: p.warna }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold font-mono-num">
              Tahap {p.urutan}
            </span>
            <span className="text-[10px] text-[#59687A] font-mono-num">{p.id}</span>
            {!p.aktif && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F4F6F8] text-[#59687A] rounded">
                Nonaktif
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-[#1C252E] font-display">{p.nama}</div>
          <div className="text-xs text-[#59687A] mt-0.5 line-clamp-2">{p.deskripsi}</div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#59687A]">
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{p.durasi} menit</span>
            <span className="inline-flex items-center gap-1 font-mono-num">{p.icon}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={p.aktif}
            onCheckedChange={() => onToggle(p.id)}
            data-testid={`process-toggle-${p.id}`}
          />
          <Button
            data-testid={`process-edit-${p.id}`}
            variant="ghost" size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(p)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            data-testid={`process-delete-${p.id}`}
            variant="ghost" size="sm"
            className="h-7 w-7 p-0 text-[#B00020] hover:text-[#B00020] hover:bg-[#FBE6E9]"
            onClick={() => onDelete(p.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProcessForm = ({ open, onOpenChange, initial, onSave }) => {
  const [form, setForm] = useState(initial || { nama: "", icon: "Wrench", warna: "#0A6ED1", deskripsi: "", durasi: 30, aktif: true });
  const isEdit = Boolean(initial);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o && initial) setForm(initial); else if (o) setForm({ nama: "", icon: "Wrench", warna: "#0A6ED1", deskripsi: "", durasi: 30, aktif: true }); }}>
      <DialogContent className="max-w-lg" data-testid="process-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? "Edit Tahap Proses" : "Tambah Tahap Proses"}</DialogTitle>
          <DialogDescription className="text-xs">Definisikan tahap proses produksi yang dapat dipakai di seluruh aplikasi.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Nama Tahap</label>
            <Input data-testid="process-form-name" value={form.nama} onChange={(e) => update("nama", e.target.value)} className="h-9 text-sm mt-1" />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Deskripsi</label>
            <Textarea data-testid="process-form-desc" rows={2} value={form.deskripsi} onChange={(e) => update("deskripsi", e.target.value)} className="text-sm mt-1" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Ikon</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ICON_OPTIONS.map((iconName) => {
                const I = ICONS[iconName];
                const selected = form.icon === iconName;
                return (
                  <button
                    key={iconName}
                    data-testid={`process-form-icon-${iconName}`}
                    onClick={() => update("icon", iconName)}
                    className={`w-9 h-9 rounded flex items-center justify-center border transition-all ${
                      selected ? "border-[#0A6ED1] bg-[#E5F0FA] text-[#0A6ED1]" : "border-[#DFE3E8] text-[#59687A] hover:border-[#0A6ED1]"
                    }`}
                  >
                    <I className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Warna</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  data-testid={`process-form-color-${c.slice(1)}`}
                  onClick={() => update("warna", c)}
                  className={`w-7 h-7 rounded transition-all ${form.warna === c ? "ring-2 ring-offset-2 ring-[#0A6ED1]" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Durasi (menit)</label>
            <Input type="number" data-testid="process-form-duration" value={form.durasi} onChange={(e) => update("durasi", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono-num" />
          </div>
          <div className="flex items-end gap-2">
            <Switch checked={form.aktif} onCheckedChange={(v) => update("aktif", v)} data-testid="process-form-active" />
            <span className="text-xs text-[#59687A] pb-1">Aktif</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            data-testid="process-form-save"
            size="sm" className="bg-[#0A6ED1] hover:bg-[#0854A1]"
            onClick={() => { if (!form.nama) { toast.error("Nama wajib diisi"); return; } onSave(form); }}
          >
            {isEdit ? "Simpan Perubahan" : "Tambah Tahap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MasterProcess = () => {
  const [processes, setProcesses] = useState(initialProcesses);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const resequence = (list) => list.map((p, i) => ({ ...p, urutan: i + 1 }));

  const handleMove = (id, delta) => {
    setProcesses((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return resequence(next);
    });
  };
  const handleToggle = (id) => {
    setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, aktif: !p.aktif } : p)));
    toast.success("Status tahap diperbarui");
  };
  const handleDelete = (id) => {
    setProcesses((prev) => resequence(prev.filter((p) => p.id !== id)));
    toast.success("Tahap dihapus");
  };
  const handleSave = (form) => {
    if (editing) {
      setProcesses((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)));
      toast.success("Tahap diperbarui");
    } else {
      const id = `P${String(processes.length + 1).padStart(2, "0")}`;
      setProcesses((prev) => resequence([...prev, { id, ...form }]));
      toast.success("Tahap baru ditambahkan");
    }
    setFormOpen(false);
    setEditing(null);
  };

  const activeCount = processes.filter((p) => p.aktif).length;
  const totalDuration = processes.filter((p) => p.aktif).reduce((s, p) => s + p.durasi, 0);

  return (
    <div>
      <PageHeader
        title="Master Proses Produksi"
        subtitle="Definisi tahap-tahap proses produksi yang dapat dikonfigurasi"
        breadcrumbs={["Beranda", "Master Proses"]}
        testId="master-process-header"
        actions={
          <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" data-testid="add-process-btn">
                <Plus className="w-3.5 h-3.5" /> Tambah Tahap
              </Button>
            </DialogTrigger>
            <ProcessForm
              open={formOpen}
              onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
              initial={editing}
              onSave={handleSave}
            />
          </Dialog>
        }
      />
      <div className="p-6 space-y-6">
        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Total Tahap</div>
            <div className="text-2xl font-semibold text-[#1C252E] font-mono-num mt-1">{processes.length}</div>
          </div>
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Tahap Aktif</div>
            <div className="text-2xl font-semibold text-[#107E3E] font-mono-num mt-1">{activeCount}</div>
          </div>
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Total Durasi Siklus</div>
            <div className="text-2xl font-semibold text-[#0A6ED1] font-mono-num mt-1">
              {totalDuration} <span className="text-xs text-[#59687A] font-sans">menit</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">≈ Estimasi</div>
            <div className="text-2xl font-semibold text-[#E9730C] font-mono-num mt-1">
              {(totalDuration / 60).toFixed(1)} <span className="text-xs text-[#59687A] font-sans">jam</span>
            </div>
          </div>
        </div>

        {/* Visual workflow */}
        <div className="bg-white border border-[#DFE3E8] rounded-md p-5" data-testid="workflow-visual">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Alur Visual Workflow</div>
              <div className="text-base font-display font-semibold text-[#1C252E]">Konfigurasi Tahap Saat Ini</div>
            </div>
            <div className="text-[11px] text-[#59687A]">
              Hanya menampilkan tahap aktif · Klik kartu di bawah untuk mengubah
            </div>
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {processes.filter((p) => p.aktif).map((p, i, arr) => {
              const Icon = ICONS[p.icon] || Wrench;
              return (
                <div key={p.id} className="flex items-stretch flex-shrink-0">
                  <div
                    className="w-36 rounded-md p-3 flex flex-col items-center text-center"
                    style={{ background: `linear-gradient(135deg, ${p.warna}10 0%, #FFFFFF 60%)`, border: `1px solid ${p.warna}33` }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: p.warna, color: "white" }}>
                      <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#59687A] mt-2 font-semibold font-mono-num">Tahap {p.urutan}</div>
                    <div className="text-xs font-semibold text-[#1C252E] mt-0.5 leading-tight">{p.nama}</div>
                    <div className="text-[10px] text-[#59687A] mt-1 font-mono-num">{p.durasi} menit</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex items-center px-1 text-[#DFE3E8]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* List builder */}
        <div className="bg-white border border-[#DFE3E8] rounded-md p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Daftar Tahap</div>
              <div className="text-base font-display font-semibold text-[#1C252E]">Builder — Urutkan, Edit, atau Tambah</div>
            </div>
          </div>
          <div className="space-y-2" data-testid="process-list">
            {processes.map((p, i) => (
              <div key={p.id}>
                <ProcessCard
                  p={p}
                  index={i}
                  total={processes.length}
                  onMove={handleMove}
                  onEdit={(proc) => { setEditing(proc); setFormOpen(true); }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
                {i < processes.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-3.5 h-3.5 text-[#DFE3E8]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterProcess;
