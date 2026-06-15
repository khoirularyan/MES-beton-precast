import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, AlertTriangle, Activity, Plus, Pencil, XCircle, Camera, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import FormDialog from "@/components/shared/FormDialog";
import { DefectIcon, QualityStamp, defectList, reasonToDefectKey } from "@/components/visuals/ProcessIcons";
import ProductIcon from "@/components/visuals/ProductIcon";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qcInspectionApi, qcDashboardApi, qcParameterApi, defectCategoryApi, productionBatchApi } from "@/lib/api";

const COLORS = ["#0A6ED1", "#E9730C", "#107E3E", "#0070F2", "#B00020", "#59687A"];
const DISPOSISI_OPTIONS = ["Destroy", "Rework", "Downgrade", "Repair"];

const SEVERITY_STYLE = {
  Critical: { bg: "#FBE6E9", color: "#B00020", border: "#B00020" },
  Major:  { bg: "#FDF3E7", color: "#E9730C", border: "#E9730C" },
  Minor:  { bg: "#FFF6E0", color: "#9C4F00", border: "#FBC36C" },
};

const RejectReasonBody = ({ record, onSave, onCancel, defectCategories, activeBatches }) => {
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
  const [produk, setProduk] = useState(record?.produk || (record?.product?.nama || ""));
  const [qty, setQty] = useState(record?.qty || (record?.qty_rejected || 1));
  const [po, setPo] = useState(record?.production_batch_id || "");
  const [disposisi, setDisposisi] = useState(record?.disposisi || "Rework");
  const [catatan, setCatatan] = useState(record?.catatan || record?.notes || "");

  const toggle = (kode) => {
    setSelected((prev) => prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]);
  };

  const selectedDefects = defectCategories.filter((d) => selected.includes(d.kode));
  const highestLevel = selectedDefects.some((d) => d.tingkat === "Critical" || d.tingkat === "Kritis") ? "Critical"
                      : selectedDefects.some((d) => d.tingkat === "Major" || d.tingkat === "Mayor") ? "Major"
                      : selectedDefects.some((d) => d.tingkat === "Minor") ? "Minor" : null;
  const suggestedDisposisi = highestLevel === "Critical" ? "Destroy" : highestLevel === "Major" ? "Rework" : highestLevel === "Minor" ? "Downgrade" : null;

  return (
    <>
      <div className="px-6 py-4 bg-gradient-to-r from-[#B00020] to-[#8A0019] text-white">
        <DialogHeader>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 font-semibold">
            {isEdit ? "Edit Reject Reason" : "Mark Product as Reject"}
          </div>
          <DialogTitle className="text-base font-display text-white">
            {isEdit ? record.no : "New Reject"}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/85">
            Select one or more defect categories according to SNI 7833:2012 standard
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Source Batch</label>
              <select
                value={po} 
                onChange={(e) => {
                  const val = e.target.value;
                  setPo(val);
                  const selectedBatch = activeBatches.find(b => String(b.id) === val);
                  if (selectedBatch) {
                    setProduk(selectedBatch.product?.nama || selectedBatch.product_id);
                  }
                }}
                data-testid="reject-po-select"
                className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#B00020]/30 focus:border-[#B00020]"
              >
                <option value="">Select Batch…</option>
                {activeBatches.map((b) => (
                  <option key={b.id} value={b.id}>{b.batch_number} — {b.product?.nama || b.product_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Product</label>
              <input
                type="text" 
                readOnly
                value={produk} 
                data-testid="reject-produk-input"
                className="w-full mt-1 h-9 px-2.5 text-sm border border-[#DFE3E8] rounded bg-[#F8FAFC] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Reject Quantity</label>
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
              Reject Reason <span className="text-[#B00020]">*</span>
            </label>
            <span className="text-[10px] text-[#59687A]" data-testid="reject-count">
              {selected.length} selected
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="reject-reason-grid">
            {defectCategories.filter((d) => d.aktif).map((d) => {
              const isSel = selected.includes(d.kode);
              const mapTingkat = d.tingkat === "Kritis" ? "Critical" : (d.tingkat === "Mayor" ? "Major" : "Minor");
              const sev = SEVERITY_STYLE[mapTingkat] || SEVERITY_STYLE.Minor;
              return (
                <button
                  key={d.kode}
                  type="button"
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
                    <div className="text-[10px] text-[#59687A] line-clamp-1">{d.penyebab_umum || d.penyebabUmum}</div>
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
            placeholder="Additional notes for production team follow-up…"
            className="w-full mt-1 px-2.5 py-2 text-sm border border-[#DFE3E8] rounded focus:outline-none focus:ring-2 focus:ring-[#B00020]/30 focus:border-[#B00020] resize-none"
          />
        </div>

        <div className="text-[10px] text-[#59687A] border-t border-[#EEF0F2] pt-2">
          Daftar alasan reject dapat dikonfigurasi lewat <a href="/master-data" className="text-[#0A6ED1] hover:underline">Master Data → Kategori Defect</a>
        </div>
      </div>

      <DialogFooter className="px-6 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="reject-cancel">Cancel</Button>
        <Button
          size="sm"
          className="bg-[#B00020] hover:bg-[#8A0019] text-white"
          data-testid="reject-save"
          onClick={() => {
            if (selected.length === 0) { toast.error("Minimal pilih 1 alasan reject"); return; }
            if (!isEdit && !po) { toast.error("Source Batch wajib dipilih"); return; }
            const selectedDefectObjects = defectCategories.filter((d) => selected.includes(d.kode));
            onSave({
              selectedDefects: selectedDefectObjects,
              alasanList: selectedDefectObjects.map(d => d.nama),
              alasan: selectedDefectObjects[0]?.nama,
              disposisi, 
              catatan,
              tingkat: highestLevel,
              ...(isEdit ? {} : { produk, qty, production_batch_id: po }),
            });
          }}
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" /> {isEdit ? "Save Reason" : "Mark Reject"}
        </Button>
      </DialogFooter>
    </>
  );
};

const RejectReasonDialog = ({ open, onOpenChange, record, onSave, defectCategories, activeBatches }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="reject-reason-dialog">
      {open && (
        <RejectReasonBody
          key={record?.id || "new"}
          record={record}
          onSave={(data) => { onSave(data); onOpenChange(false); }}
          onCancel={() => onOpenChange(false)}
          defectCategories={defectCategories}
          activeBatches={activeBatches}
        />
      )}
    </DialogContent>
  </Dialog>
);

const QualityControl = () => {
  const [tab, setTab] = useState("inspections");
  const [rejectDialog, setRejectDialog] = useState({ open: false, record: null });

  const queryClient = useQueryClient();

  // Queries
  const { data: inspectionsData, isLoading: isLoadingInspections } = useQuery({
    queryKey: ["qc-inspections"],
    queryFn: () => qcInspectionApi.getAll().then(res => res.data.data || res.data)
  });

  const { data: dashboardData = {}, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["qc-dashboard"],
    queryFn: () => qcDashboardApi.getOverview().then(res => res.data)
  });

  const { data: activeParameters = [] } = useQuery({
    queryKey: ["qc-parameters"],
    queryFn: () => qcParameterApi.getAll().then(res => res.data.data || res.data)
  });

  const { data: defectCategories = [] } = useQuery({
    queryKey: ["defect-categories"],
    queryFn: () => defectCategoryApi.getAll({ per_page: 100 }).then(res => res.data.data || res.data)
  });

  const { data: activeBatches = [] } = useQuery({
    queryKey: ["production-batches", "qc-eligible"],
    queryFn: () => productionBatchApi.getAll({ per_page: 100, qc_eligible: true }).then(res => res.data.data || res.data)
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData) => qcInspectionApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["qc-dashboard"] });
      toast.success("QC inspection saved successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      const errors = err.response?.data?.errors;
      const detail = errors ? Object.values(errors).flat().join(", ") : "";
      toast.error("Gagal menyimpan QC inspection", { description: detail || msg });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => qcInspectionApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["qc-dashboard"] });
      toast.success("QC inspection updated successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      toast.error("Gagal memperbarui QC inspection", { description: msg });
    }
  });

  const openNewReject = () => setRejectDialog({ open: true, record: null });
  const openEditReject = (rec) => setRejectDialog({ open: true, record: rec });
  const closeRejectDialog = () => setRejectDialog({ open: false, record: null });

  const handleSaveReject = (data) => {
    if (rejectDialog.record) {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // spoofing PUT
      formData.append('production_batch_id', rejectDialog.record.production_batch_id);
      formData.append('inspection_date', rejectDialog.record.inspection_date || rejectDialog.record.tanggal);
      formData.append('qty_inspected', rejectDialog.record.qty_inspected || rejectDialog.record.qty);
      formData.append('qty_passed', rejectDialog.record.qty_passed || 0);
      formData.append('qty_rejected', rejectDialog.record.qty_rejected || rejectDialog.record.qty);
      formData.append('notes', data.catatan || '');

      data.selectedDefects.forEach((d, idx) => {
        formData.append(`defects[${idx}][defect_category_id]`, d.id);
        formData.append(`defects[${idx}][qty]`, rejectDialog.record.qty_rejected || rejectDialog.record.qty);
      });

      updateMutation.mutate({ id: rejectDialog.record.id, formData });
    } else {
      const formData = new FormData();
      formData.append('production_batch_id', data.production_batch_id);
      formData.append('inspection_date', new Date().toISOString().split('T')[0]);
      formData.append('qty_inspected', data.qty);
      formData.append('qty_passed', 0);
      formData.append('qty_rejected', data.qty);
      formData.append('notes', data.catatan || '');

      data.selectedDefects.forEach((d, idx) => {
        formData.append(`defects[${idx}][defect_category_id]`, d.id);
        formData.append(`defects[${idx}][qty]`, data.qty);
      });

      createMutation.mutate(formData);
    }
  };

  const handleCreateInspectionSubmit = async (values) => {
    const formData = new FormData();
    formData.append('production_batch_id', values.production_batch_id);
    formData.append('inspection_date', values.inspection_date);
    formData.append('qty_inspected', values.qty_inspected);
    formData.append('qty_passed', values.qty_passed);
    formData.append('qty_rejected', values.qty_rejected);
    if (values.notes) formData.append('notes', values.notes);
    if (values.photo) formData.append('photo', values.photo);

    // Dynamic Parameter Values
    let paramIdx = 0;
    activeParameters.forEach((p) => {
      const valKey = `param_val_${p.id}`;
      const passKey = `param_pass_${p.id}`;
      if (values[valKey] !== undefined) {
        formData.append(`parameters[${paramIdx}][qc_parameter_id]`, p.id);
        formData.append(`parameters[${paramIdx}][value]`, values[valKey]);
        formData.append(`parameters[${paramIdx}][is_passed]`, values[passKey] ? '1' : '0');
        paramIdx++;
      }
    });

    await createMutation.mutateAsync(formData);
  };

  // Map Inspections data safe arrays
  const qcInspections = Array.isArray(inspectionsData) ? inspectionsData : [];
  
  // Filter reject inspections (qty_rejected > 0)
  const rejects = qcInspections.filter((q) => q.qty_rejected > 0).map((r) => {
    const reasons = r.defects?.map(d => d.category?.nama).filter(Boolean) || [];
    return {
      id: r.id,
      no: r.no,
      produk: r.product?.nama || 'Unknown',
      qty: r.qty_rejected,
      alasanList: reasons,
      alasan: reasons[0] || 'Defect',
      po: r.batch?.batch_number || '-',
      production_batch_id: r.production_batch_id,
      tanggal: r.inspection_date || r.tanggal,
      disposisi: r.defects?.[0]?.category?.disposisi || 'Rework',
      catatan: r.notes || r.catatan
    };
  });

  const rejectByReason = Array.isArray(dashboardData.top_defect_categories) ? dashboardData.top_defect_categories : [];
  const defectTrend = Array.isArray(dashboardData.defect_trend) ? dashboardData.defect_trend : [];

  // Form Fields mapping
  const formFields = [
    {
      name: "production_batch_id",
      label: "Batch Produksi",
      type: "select",
      required: true,
      options: activeBatches.map((b) => ({ value: b.id, label: `${b.batch_number} — ${b.product?.nama || b.product_id}` }))
    },
    {
      name: "inspection_date",
      label: "Tanggal Inspeksi",
      type: "date",
      required: true,
    },
    {
      name: "qty_inspected",
      label: "Quantity Inspected",
      type: "number",
      required: true,
    },
    {
      name: "qty_passed",
      label: "Passed Quantity (Qty OK)",
      type: "number",
      required: true,
    },
    {
      name: "qty_rejected",
      label: "Rejected Quantity (Qty Reject)",
      type: "number",
      required: true,
    },
    {
      name: "photo",
      label: "Foto Bukti (optional)",
      type: "file",
    },
    {
      name: "notes",
      label: "Catatan Inspeksi",
      type: "textarea",
      span: 2,
    },
    // Dynamic parameters
    ...activeParameters.map((p) => [
      {
        name: `param_val_${p.id}`,
        label: `${p.parameter} (${p.satuan || ''})`,
        type: "text",
        placeholder: `Target: ${p.target || '-'}`
      },
      {
        name: `param_pass_${p.id}`,
        label: `${p.parameter} Status`,
        type: "select",
        options: [
          { value: true, label: "Lulus (Passed)" },
          { value: false, label: "Gagal (Failed)" }
        ]
      }
    ]).flat()
  ];

  return (
    <div>
      <PageHeader
        title="Quality Control"
        subtitle="Concrete quality inspection, dimensions, and reject management"
        breadcrumbs={["Home", "Quality Control"]}
        testId="qc-page-header"
        actions={
          <FormDialog
            testId="qc-create"
            title="New QC Inspection"
            description="Record quality control inspection results for product batch"
            submitLabel="Save Inspection"
            successMessage="QC inspection saved successfully"
            fields={formFields}
            onSubmit={handleCreateInspectionSubmit}
            initialValues={{
              inspection_date: new Date().toISOString().split('T')[0]
            }}
            trigger={
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />New Inspection</Button>
            }
          />
        }
      />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KPICard testId="qc-kpi-lulus" label="Passed QC Today" value={dashboardData.passed_today ?? 0} unit="units" icon={ShieldCheck} accent="success" />
          <KPICard testId="qc-kpi-reject" label="Rejected Today" value={dashboardData.rejected_today ?? 0} unit="units" icon={AlertTriangle} accent="error" />
          <KPICard testId="qc-kpi-rate" label="Reject Rate Today" value={`${dashboardData.reject_rate ?? 0.0}%`} icon={Activity} accent="warning" />
          <KPICard testId="qc-kpi-waiting" label="Waiting QC" value={dashboardData.batches_waiting_qc ?? 0} unit="batches" icon={Clock} accent="info" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto">
            <TabsTrigger value="inspections" className="text-xs h-8">Product Inspections</TabsTrigger>
            <TabsTrigger value="rejects" className="text-xs h-8">Reject Management</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs h-8">Reject Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">QC Number</th>
                    <th className="px-4 py-2 text-left">Batch</th>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Dimension OK</th>
                    <th className="px-4 py-2 text-right">Reject</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Inspector</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingInspections ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-xs text-[#59687A]">Loading QC Inspections...</td>
                    </tr>
                  ) : qcInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-xs text-[#59687A]">No QC Inspections recorded.</td>
                    </tr>
                  ) : qcInspections.map((q, i) => {
                    const statusClass = q.qc_status === "PASS" ? "Lulus" : (q.qc_status === "PARTIAL_PASS" ? "Lulus Bersyarat" : "Reject");
                    return (
                      <tr key={q.no || q.id} data-testid={`qc-row-${i}`}>
                        <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{q.no}</td>
                        <td className="px-4 font-mono-num">{q.batch?.batch_number || q.production_order_id}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <ProductIcon name={q.product?.nama} size="sm" />
                            <span className="font-medium">{q.product?.nama}</span>
                          </div>
                        </td>
                        <td className="px-4 text-right font-mono-num">{q.qty_inspected}</td>
                        <td className="px-4 text-right font-mono-num text-[#107E3E]">{q.qty_passed}</td>
                        <td className="px-4 text-right font-mono-num text-[#B00020]">{q.qty_rejected}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={statusClass} />
                            {(statusClass === "Lulus" || statusClass === "Lulus Bersyarat") && <QualityStamp type="pass" />}
                            {statusClass === "Reject" && <QualityStamp type="reject" />}
                          </div>
                        </td>
                        <td className="px-4 text-[#59687A]">{q.inspector?.name || q.inspektur}</td>
                        <td className="px-4 font-mono-num text-[#59687A]">{q.inspection_date || q.tanggal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rejects" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8]">
                <div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Reject Management</div>
                  <div className="text-xs text-[#59687A]">Total {rejects.length} rejects recorded · Click <span className="text-[#0A6ED1] font-medium">Edit Reason</span> to modify reject reasons</div>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-[#B00020] hover:bg-[#8A0019] text-white"
                  onClick={openNewReject}
                  data-testid="reject-new-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Mark Reject
                </Button>
              </div>
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Reject No.</th>
                    <th className="px-4 py-2 text-left">Visual</th>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Source Batch</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Disposition</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rejects.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-6 text-xs text-[#59687A]">No rejects logged.</td>
                    </tr>
                  ) : rejects.map((r, i) => (
                    <tr key={r.no || r.id} data-testid={`reject-row-${i}`}>
                      <td className="px-4 font-mono-num text-[#B00020] font-medium">{r.no}</td>
                      <td className="px-4">
                        <DefectIcon type={reasonToDefectKey(r.alasanList[0] || "")} className="w-12 h-9" />
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
                          {r.alasanList.slice(0, 2).map((a, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#FBE6E9] text-[#B00020] font-medium">
                              {a}
                            </span>
                          ))}
                          {r.alasanList.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F6F8] text-[#59687A] font-medium">
                              +{r.alasanList.length - 2}
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
                          <Pencil className="w-3 h-3" /> Edit Reason
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            {/* Defect Reference Gallery */}
            <div className="bg-white border border-[#DFE3E8] rounded-md p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">Defect Reference Gallery</div>
                  <div className="text-xs text-[#59687A]">Visual standards for defect identification per SNI 7833:2012</div>
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
                <div className="text-base font-semibold text-[#1C252E] font-display mb-4">Reject Cause Distribution</div>
                {rejectByReason.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-xs text-[#59687A]">No reject data available.</div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
                <div className="text-base font-semibold text-[#1C252E] font-display mb-4">Reject Count by Category</div>
                {rejectByReason.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-xs text-[#59687A]">No reject data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rejectByReason} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#59687A" }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="alasan" type="category" tick={{ fontSize: 11, fill: "#1C252E" }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip />
                      <Bar dataKey="jumlah" fill="#B00020" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <RejectReasonDialog
          open={rejectDialog.open}
          onOpenChange={(o) => { if (!o) closeRejectDialog(); }}
          record={rejectDialog.record}
          onSave={handleSaveReject}
          defectCategories={defectCategories}
          activeBatches={activeBatches}
        />
      </div>
    </div>
  );
};

export default QualityControl;
