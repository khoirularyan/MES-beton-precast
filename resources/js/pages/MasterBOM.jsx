import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { productApi, materialApi, bomApi } from "@/lib/api";
import {
  Plus, Trash2, CheckCircle, Package, Scale, Search, Download,
  AlertCircle, Copy, Archive, FileEdit, Check, RefreshCw, Layers
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// ─── Format Helpers ──────────────────────────────────────────────────────────
const formatRupiah = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(val || 0);
};

const formatDecimal = (val, dec = 4) => {
  if (val === undefined || val === null) return "-";
  return parseFloat(val).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
};

// ─── Searchable Material Dialog ──────────────────────────────────────────────
const AddMaterialDialog = ({ open, onOpenChange, materials, onAdd, existingMaterialIds }) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [qty, setQty] = useState("");
  const [waste, setWaste] = useState("0");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaterials = Array.isArray(materials) ? materials.filter(m => {
    if (!m.aktif) return false;
    const q = searchQuery.toLowerCase();
    return m.nama.toLowerCase().includes(q) || (m.kode && m.kode.toLowerCase().includes(q));
  }) : [];

  const handleAdd = () => {
    if (!selectedMaterialId) {
      toast.error("Pilih material terlebih dahulu");
      return;
    }
    const matId = parseInt(selectedMaterialId);
    if (existingMaterialIds.includes(matId)) {
      toast.error("Material sudah terdaftar di dalam BOM ini!");
      return;
    }
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) {
      toast.error("Quantity per unit harus lebih besar dari 0");
      return;
    }
    const w = parseFloat(waste);
    if (isNaN(w) || w < 0) {
      toast.error("Waste % tidak boleh negatif");
      return;
    }

    const material = materials.find(m => m.id === matId);
    onAdd({
      material_id: material.id,
      qty_per_unit: q,
      waste_pct: w,
      catatan: notes || null,
      material: material,
      harga_snapshot: material.harga,
      material_type: material.kategori || 'Raw Material',
    });
    
    // Reset form
    setSelectedMaterialId("");
    setQty("");
    setWaste("0");
    setNotes("");
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="add-material-dialog">
        <div className="px-5 py-4 border-b border-[#DFE3E8] bg-[#F4F6F8]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-[#1C252E]">Tambah Material Master</DialogTitle>
            <DialogDescription className="text-xs text-[#59687A]">Pilih material dari database master (bebas input teks tidak diperbolehkan)</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Cari & Pilih Material</label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
              <Input
                placeholder="Ketik kode/nama material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs border-[#DFE3E8]"
              />
            </div>
            <div className="border border-[#DFE3E8] rounded-md max-h-40 overflow-y-auto bg-white">
              {filteredMaterials.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#59687A]">Tidak ada material aktif ditemukan</div>
              ) : (
                filteredMaterials.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMaterialId(String(m.id))}
                    className={`p-2 border-b border-[#EEF0F2] last:border-0 text-xs cursor-pointer flex justify-between items-center transition-colors ${
                      selectedMaterialId === String(m.id) ? "bg-[#E6F7FF] text-[#0A6ED1] font-semibold" : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span>{m.kode ? `[${m.kode}] ` : ""}{m.nama}</span>
                    <span className="text-[10px] text-[#59687A] bg-[#F4F6F8] px-1.5 py-0.5 rounded font-mono-num">
                      {formatRupiah(m.harga)} / {m.satuan}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Qty per Unit</label>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0.0000"
                className="mt-1 h-8 text-xs border-[#DFE3E8]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Waste (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
                placeholder="0.0"
                className="mt-1 h-8 text-xs border-[#DFE3E8]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Catatan</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Toleransi besi ulir, dll"
              className="mt-1 h-8 text-xs border-[#DFE3E8]"
            />
          </div>
        </div>
        <DialogFooter className="px-5 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2] flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button size="sm" className="text-xs h-8 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleAdd}>Tambah Material</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const MasterBOM = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("master-data.manage");

  // State List
  const [productsList, setProductsList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [bomVersions, setBomVersions] = useState([]);
  const [selectedBom, setSelectedBom] = useState(null);
  const [warnings, setWarnings] = useState([]);
  
  // Workspace editable states (only updated for Draft BOM)
  const [isEditing, setIsEditing] = useState(false);
  const [draftVersion, setDraftVersion] = useState("");
  const [draftOutputQty, setDraftOutputQty] = useState("1");
  const [draftOutputUom, setDraftOutputUom] = useState("PCS");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftItems, setDraftItems] = useState([]);
  const [draftOverhead, setDraftOverhead] = useState("15");

  // Loaders
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBoms, setLoadingBoms] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isAddMatOpen, setIsAddMatOpen] = useState(false);

  // Form states for creation/cloning
  const [newBomVersion, setNewBomVersion] = useState("");
  const [newBomOutputQty, setNewBomOutputQty] = useState("1");
  const [newBomOutputUom, setNewBomOutputUom] = useState("PCS");
  const [newBomOverhead, setNewBomOverhead] = useState("15");
  const [newBomNotes, setNewBomNotes] = useState("");
  const [cloneVersionName, setCloneVersionName] = useState("");

  // Fetch initial master lists
  const fetchMasters = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, matRes] = await Promise.all([
        productApi.getAll({ per_page: 200 }),
        materialApi.getAll({ per_page: 200 })
      ]);
      const prods = prodRes.data?.data || prodRes.data || [];
      setProductsList(prods);
      setMaterialsList(matRes.data?.data || matRes.data || []);
      
      // Auto-select first product if none is selected
      setSelectedProductId((prev) => {
        if (!prev && prods.length > 0) {
          return String(prods[0].id);
        }
        return prev;
      });
    } catch (err) {
      console.error("Gagal memuat master data:", err);
      toast.error("Gagal memuat katalog Produk atau Material master.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  // Fetch BOM versions when product selection changes
  const fetchBoms = useCallback(async (productId) => {
    if (!productId) {
      setBomVersions([]);
      setSelectedBom(null);
      setIsEditing(false);
      return;
    }
    try {
      setLoadingBoms(true);
      const res = await bomApi.getByProduct(productId);
      const list = res.data || [];
      setBomVersions(list);

      // Default to active BOM, if none, default to first available, if none, clear detail
      const active = list.find(b => b.status === "active");
      if (active) {
        loadBomDetail(active.id);
      } else if (list.length > 0) {
        loadBomDetail(list[0].id);
      } else {
        setSelectedBom(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Gagal memuat versi BOM:", err);
      toast.error("Gagal mengambil versi BOM untuk produk selected.");
    } finally {
      setLoadingBoms(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchBoms(selectedProductId);
    }
  }, [selectedProductId, fetchBoms]);

  // Load single BOM detail (items and snapshot prices)
  const loadBomDetail = async (id) => {
    try {
      setLoadingDetail(true);
      setIsEditing(false);
      const res = await bomApi.getOne(id);
      const bomData = res.data?.bom || res.data;
      setSelectedBom(bomData);
      setWarnings(res.data?.warnings || []);

      // Load into draft workspace
      if (bomData) {
        setDraftVersion(bomData.version || "");
        setDraftOutputQty(String(bomData.output_qty || 1));
        setDraftOutputUom(bomData.output_uom || "PCS");
        setDraftNotes(bomData.notes || "");
        setDraftItems(bomData.items || []);
        setDraftOverhead(String(bomData.overhead_pct || 15));
      }
    } catch (err) {
      console.error("Gagal memuat detail BOM:", err);
      toast.error("Gagal memuat detail material BOM.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const selectedProduct = productsList.find(p => p.id === parseInt(selectedProductId));

  // Auto-calculated totals inside draft workspace
  const computedTotals = (() => {
    let materialCost = 0;
    let wasteCost = 0;

    draftItems.forEach(item => {
      const q = parseFloat(item.qty_per_unit) || 0;
      const p = parseFloat(item.harga_snapshot) || 0;
      const w = parseFloat(item.waste_pct) || 0;

      const itemCost = q * p;
      const itemWaste = itemCost * (w / 100);

      materialCost += itemCost;
      wasteCost += itemWaste;
    });

    const totalBOMCost = materialCost + wasteCost;
    const overhead = isEditing ? (parseFloat(draftOverhead) || 0) : (parseFloat(selectedBom?.overhead_pct || 15));
    const estProductionCost = totalBOMCost * (1 + overhead / 100);

    return {
      materialCost,
      wasteCost,
      totalBOMCost,
      estProductionCost
    };
  })();

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleCreateDraft = async () => {
    if (!newBomVersion || !newBomOutputQty || !newBomOutputUom) {
      toast.error("Mohon lengkapi Versi, Output Qty, dan Output UOM.");
      return;
    }
    const overheadVal = parseFloat(newBomOverhead);
    if (isNaN(overheadVal) || overheadVal < 0 || overheadVal > 100) {
      toast.error("Overhead Produksi harus di antara 0 dan 100");
      return;
    }
    try {
      const payload = {
        product_id: parseInt(selectedProductId),
        version: newBomVersion,
        output_qty: parseFloat(newBomOutputQty),
        output_uom: newBomOutputUom,
        overhead_pct: overheadVal,
        notes: newBomNotes || null,
        items: [] // starts empty, materials added via table workspace
      };
      const res = await bomApi.create(payload);
      toast.success(res.data?.message || "Draft BOM berhasil dibuat.");
      setIsCreateOpen(false);
      
      // Reset form
      setNewBomVersion("");
      setNewBomOutputQty("1");
      setNewBomOutputUom("PCS");
      setNewBomOverhead("15");
      setNewBomNotes("");

      // Refresh list and select the newly created BOM
      const refreshedBoms = await bomApi.getByProduct(selectedProductId);
      setBomVersions(refreshedBoms.data || []);
      const newBom = (refreshedBoms.data || []).find(b => b.version === payload.version);
      if (newBom) {
        loadBomDetail(newBom.id);
      }
    } catch (err) {
      console.error("Gagal membuat BOM:", err);
      toast.error(err.response?.data?.message || "Gagal membuat draft BOM.");
    }
  };

  const handleUpdateDraft = async () => {
    if (!selectedBom) return;
    const q = parseFloat(draftOutputQty);
    if (isNaN(q) || q <= 0) {
      toast.error("Output Quantity harus lebih besar dari 0");
      return;
    }
    const overheadVal = parseFloat(draftOverhead);
    if (isNaN(overheadVal) || overheadVal < 0 || overheadVal > 100) {
      toast.error("Overhead Produksi harus di antara 0 dan 100");
      return;
    }

    try {
      const payload = {
        version: draftVersion,
        output_qty: q,
        output_uom: draftOutputUom,
        overhead_pct: overheadVal,
        notes: draftNotes || null,
        items: draftItems.map((item, idx) => ({
          material_id: item.material_id,
          qty_per_unit: parseFloat(item.qty_per_unit),
          waste_pct: parseFloat(item.waste_pct),
          urutan: item.urutan || (idx + 1),
          catatan: item.catatan || null
        }))
      };

      const res = await bomApi.update(selectedBom.id, payload);
      toast.success(res.data?.message || "BOM berhasil disimpan.");
      setIsEditing(false);
      loadBomDetail(selectedBom.id);
    } catch (err) {
      console.error("Gagal menyimpan BOM:", err);
      toast.error(err.response?.data?.message || "Gagal menyimpan perubahan.");
    }
  };

  const handleActivate = async () => {
    if (!selectedBom) return;
    try {
      const res = await bomApi.activate(selectedBom.id);
      toast.success(res.data?.message || "BOM berhasil diaktifkan.");
      fetchBoms(selectedProductId);
    } catch (err) {
      console.error("Gagal mengaktifkan BOM:", err);
      toast.error(err.response?.data?.message || "Gagal mengaktifkan BOM.");
    }
  };

  const handleArchive = async () => {
    if (!selectedBom) return;
    try {
      const res = await bomApi.archive(selectedBom.id);
      toast.success(res.data?.message || "BOM berhasil diarsipkan.");
      fetchBoms(selectedProductId);
    } catch (err) {
      console.error("Gagal mengarsipkan BOM:", err);
      toast.error(err.response?.data?.message || "Gagal mengarsipkan BOM.");
    }
  };

  const handleUnarchive = async () => {
    if (!selectedBom) return;
    try {
      const res = await bomApi.unarchive(selectedBom.id);
      toast.success(res.data?.message || "BOM berhasil dikembalikan ke Draft.");
      
      const currentId = selectedBom.id;
      const refreshedBoms = await bomApi.getByProduct(selectedProductId);
      setBomVersions(refreshedBoms.data || []);
      loadBomDetail(currentId);
    } catch (err) {
      console.error("Gagal mengembalikan BOM ke Draft:", err);
      toast.error(err.response?.data?.message || "Gagal mengembalikan BOM ke Draft.");
    }
  };

  const handleClone = async () => {
    if (!selectedBom) return;
    if (!cloneVersionName) {
      toast.error("Masukkan versi baru untuk BOM kloningan.");
      return;
    }
    try {
      const res = await bomApi.clone(selectedBom.id, { version: cloneVersionName });
      toast.success(res.data?.message || "BOM berhasil dikloning.");
      setIsCloneOpen(false);
      setCloneVersionName("");

      // Refresh and load new draft
      const refreshedBoms = await bomApi.getByProduct(selectedProductId);
      setBomVersions(refreshedBoms.data || []);
      const cloned = (refreshedBoms.data || []).find(b => b.version === cloneVersionName);
      if (cloned) {
        loadBomDetail(cloned.id);
      } else {
        fetchBoms(selectedProductId);
      }
    } catch (err) {
      console.error("Gagal mengklon BOM:", err);
      toast.error(err.response?.data?.message || "Gagal mengklon BOM.");
    }
  };

  const handleDeleteDraft = async () => {
    if (!selectedBom) return;
    if (!window.confirm("Yakin ingin menghapus Draft BOM ini? Tindakan tidak dapat dibatalkan.")) return;
    try {
      const res = await bomApi.delete(selectedBom.id);
      toast.success(res.data?.message || "Draft BOM berhasil dihapus.");
      fetchBoms(selectedProductId);
    } catch (err) {
      console.error("Gagal menghapus BOM:", err);
      toast.error(err.response?.data?.message || "Gagal menghapus Draft BOM.");
    }
  };

  // Inline inputs edit helpers (trigger recalculations in local state)
  const handleItemChange = (index, key, val) => {
    setDraftItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = (newMat) => {
    setDraftItems(prev => [...prev, newMat]);
  };

  // Options lists for select fields
  const productOptions = productsList.map(p => ({
    value: String(p.id),
    label: `${p.kode} - ${p.nama}`
  }));

  const activeBomVersion = bomVersions.find(b => b.status === "active")?.version || "Tidak ada BOM Aktif";

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F8]">
      <PageHeader
        title="Master BOM (Bill of Materials)"
        subtitle="Kelola formula material beton precast, kontrol versi, snapshot biaya material, dan baseline MRP"
        breadcrumbs={["Beranda", "Master Data", "BOM"]}
        testId="master-bom-header"
      />

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
        
        {/* ── PANEL KIRI: DETAIL PRODUK MASTER ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#DFE3E8] rounded-md shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#59687A] uppercase tracking-wider mb-3">Pilih Produk</h3>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-full text-xs h-9 border-[#DFE3E8] bg-white">
                <SelectValue placeholder="Pilih Produk Precast..." />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct ? (
            <div className="bg-white border border-[#DFE3E8] rounded-md shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#DFE3E8] bg-gradient-to-r from-[#F8FAFC] to-white flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1C252E] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#0A6ED1]" /> Ringkasan Produk
                </h3>
                {selectedProduct.aktif ? (
                  <span className="text-[10px] bg-[#E6F5EC] text-[#107E3E] px-2 py-0.5 rounded-full font-semibold">Aktif</span>
                ) : (
                  <span className="text-[10px] bg-[#FFF0F1] text-[#B00020] px-2 py-0.5 rounded-full font-semibold">Nonaktif</span>
                )}
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <div className="text-[10px] font-mono-num text-[#0A6ED1] font-semibold">{selectedProduct.kode}</div>
                  <div className="font-semibold text-sm text-[#1C252E] mt-0.5">{selectedProduct.nama}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F4F6F8]">
                  <div>
                    <div className="text-[#59687A] text-[10px]">Kategori</div>
                    <div className="font-semibold text-[#1C252E] mt-0.5">{selectedProduct.kategori || "-"}</div>
                  </div>
                  <div>
                    <div className="text-[#59687A] text-[10px]">Mutu Beton</div>
                    <div className="font-semibold text-[#1C252E] mt-0.5">
                      {selectedProduct.grade ? <span className="bg-[#E6F7FF] text-[#0A6ED1] px-1.5 py-0.5 rounded font-mono font-semibold">{selectedProduct.grade}</span> : "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F4F6F8]">
                  <div>
                    <div className="text-[#59687A] text-[10px]">Volume Produk</div>
                    <div className="font-semibold text-[#1C252E] font-mono-num mt-0.5">{selectedProduct.volume_m3 ? `${formatDecimal(selectedProduct.volume_m3, 3)} m³` : "-"}</div>
                  </div>
                  <div>
                    <div className="text-[#59687A] text-[10px]">Berat per Unit</div>
                    <div className="font-semibold text-[#1C252E] font-mono-num mt-0.5">{selectedProduct.berat ? `${formatDecimal(selectedProduct.berat, 2)} kg` : "-"}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F4F6F8]">
                  <div className="text-[#59687A] text-[10px]">Versi BOM Aktif</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      activeBomVersion !== "Tidak ada BOM Aktif" ? "bg-[#E6F5EC] text-[#107E3E]" : "bg-[#F4F6F8] text-[#59687A]"
                    }`}>
                      {activeBomVersion}
                    </span>
                  </div>
                </div>

                {/* Warning Card Banners */}
                {(!selectedProduct.aktif || warnings.length > 0) && (
                  <div className="pt-3 border-t border-[#F4F6F8] space-y-2">
                    {!selectedProduct.aktif && (
                      <div className="bg-[#FFF0F1] border border-[#FFD2D6] rounded p-2.5 text-[#B00020] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Produk Tidak Aktif</div>
                          <div className="text-[10px] mt-0.5">BOM tidak dapat diaktifkan sebelum status produk diaktifkan kembali.</div>
                        </div>
                      </div>
                    )}
                    {warnings.map((w, idx) => (
                      <div key={idx} className="bg-[#FFF8E6] border border-[#FFEBAA] rounded p-2.5 text-[#B25E00] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Peringatan Material</div>
                          <div className="text-[10px] mt-0.5">{w}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] border border-dashed border-[#DFE3E8] rounded-md p-8 text-center text-xs text-[#59687A]">
              Pilih produk precast untuk memuat ringkasan spesifikasi teknis dan daftar BOM.
            </div>
          )}
        </div>

        {/* ── PANEL KANAN: BOM WORKSPACE ── */}
        <div className="lg:col-span-3 space-y-6">
          {selectedProductId ? (
            <div className="bg-white border border-[#DFE3E8] rounded-md shadow-sm overflow-hidden">
              
              {/* Header Tab Pilihan Versi BOM */}
              <div className="px-4 py-3 border-b border-[#DFE3E8] bg-[#F4F6F8] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0A6ED1]" />
                  <span className="text-sm font-semibold text-[#1C252E]">Versi BOM</span>
                  <div className="flex items-center gap-1 ml-2">
                    {loadingBoms ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A6ED1]" />
                    ) : bomVersions.length === 0 ? (
                      <span className="text-xs text-[#59687A]">(Belum ada versi)</span>
                    ) : (
                      bomVersions.map(b => (
                        <button
                          key={b.id}
                          onClick={() => loadBomDetail(b.id)}
                          className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                            selectedBom?.id === b.id
                              ? "bg-white text-[#0A6ED1] border border-[#DFE3E8] shadow-xs"
                              : "text-[#59687A] hover:bg-[#EEF0F2]"
                          }`}
                        >
                          {b.version}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    className="text-xs h-7.5 bg-[#0A6ED1] hover:bg-[#0854A1] flex items-center gap-1"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Draft
                  </Button>
                )}
              </div>

              {loadingDetail ? (
                <div className="p-12 text-center text-xs text-[#59687A] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0A6ED1]" /> Memuat formula material BOM...
                </div>
              ) : selectedBom ? (
                <div>
                  
                  {/* Status Bar & Action Buttons */}
                  <div className="px-4 py-3 border-b border-[#DFE3E8] bg-white flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#59687A]">Status BOM:</span>
                      <StatusBadge status={selectedBom.status} />
                      <span className="text-[11px] font-mono-num text-[#59687A] ml-2">
                        Dibuat oleh: {selectedBom.dibuat_oleh || "-"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {canManage && selectedBom.status === "draft" && !isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-[#0A6ED1] border-[#0A6ED1] hover:bg-[#F0F7FF]"
                          onClick={() => setIsEditing(true)}
                        >
                          <FileEdit className="w-3.5 h-3.5 mr-1" /> Edit Formula
                        </Button>
                      )}

                      {canManage && selectedBom.status === "draft" && isEditing && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 border-[#DFE3E8]"
                            onClick={() => {
                              setIsEditing(false);
                              loadBomDetail(selectedBom.id); // Re-load original state
                            }}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-[#107E3E] hover:bg-[#0E6A34] text-white"
                            onClick={handleUpdateDraft}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Simpan
                          </Button>
                        </>
                      )}

                      {canManage && selectedBom.status === "draft" && !isEditing && (
                        <>
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-[#107E3E] hover:bg-[#0E6A34] text-white"
                            disabled={!selectedProduct.aktif}
                            onClick={handleActivate}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aktifkan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 text-[#B00020] border-[#B00020] hover:bg-[#FFF0F1]"
                            onClick={handleDeleteDraft}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus Draft
                          </Button>
                        </>
                      )}

                      {canManage && selectedBom.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-[#B25E00] border-[#B25E00] hover:bg-[#FFF8E6]"
                          onClick={handleArchive}
                        >
                          <Archive className="w-3.5 h-3.5 mr-1" /> Arsipkan
                        </Button>
                      )}

                      {canManage && selectedBom.status === "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-[#0A6ED1] border-[#0A6ED1] hover:bg-[#F0F7FF]"
                          onClick={handleUnarchive}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kembalikan ke Draft
                        </Button>
                      )}

                      {canManage && !isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-[#59687A] border-[#DFE3E8] hover:bg-[#F4F6F8]"
                          onClick={() => setIsCloneOpen(true)}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Kloning Draft
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Header parameters form */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 bg-[#F8FAFC] border-b border-[#DFE3E8] text-xs">
                    <div>
                      <span className="text-[#59687A] block font-semibold">Versi Kode</span>
                      {isEditing ? (
                        <Input
                          value={draftVersion}
                          onChange={(e) => setDraftVersion(e.target.value)}
                          className="h-8 text-xs bg-white mt-1 border-[#DFE3E8]"
                        />
                      ) : (
                        <span className="font-semibold text-sm text-[#1C252E] mt-1 block font-mono-num">{selectedBom.version}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#59687A] block font-semibold">Output Yield (Qty)</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={draftOutputQty}
                          onChange={(e) => setDraftOutputQty(e.target.value)}
                          className="h-8 text-xs bg-white mt-1 border-[#DFE3E8]"
                        />
                      ) : (
                        <span className="font-semibold text-sm text-[#1C252E] mt-1 block font-mono-num">{formatDecimal(selectedBom.output_qty, 4)}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#59687A] block font-semibold">Satuan Output (UOM)</span>
                      {isEditing ? (
                        <Input
                          value={draftOutputUom}
                          onChange={(e) => setDraftOutputUom(e.target.value)}
                          className="h-8 text-xs bg-white mt-1 border-[#DFE3E8]"
                        />
                      ) : (
                        <span className="font-semibold text-sm text-[#1C252E] mt-1 block">{selectedBom.output_uom}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#59687A] block font-semibold">Overhead Produksi (%)</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={draftOverhead}
                          onChange={(e) => setDraftOverhead(e.target.value)}
                          className="h-8 text-xs bg-white mt-1 border-[#DFE3E8]"
                        />
                      ) : (
                        <span className="font-semibold text-sm text-[#1C252E] mt-1 block font-mono-num">{formatDecimal(selectedBom.overhead_pct, 2)}%</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#59687A] block font-semibold">Catatan / Deskripsi</span>
                      {isEditing ? (
                        <Input
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          className="h-8 text-xs bg-white mt-1 border-[#DFE3E8]"
                          placeholder="Tambahkan catatan khusus..."
                        />
                      ) : (
                        <span className="text-xs text-[#1C252E] mt-1 block italic">{selectedBom.notes || "Tidak ada catatan."}</span>
                      )}
                    </div>
                  </div>

                  {/* Material Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse mes-table">
                      <thead>
                        <tr className="bg-[#F4F6F8] border-b border-[#DFE3E8] text-[#59687A]">
                          <th className="px-4 py-2 text-center w-12">No</th>
                          <th className="px-4 py-2">Material</th>
                          <th className="px-4 py-2 w-28">Kategori Tipe</th>
                          <th className="px-4 py-2 text-center w-20">Unit</th>
                          <th className="px-4 py-2 text-right w-28">Qty / Unit</th>
                          <th className="px-4 py-2 text-right w-24">Waste %</th>
                          <th className="px-4 py-2 text-right w-32">Harga Snapshot</th>
                          <th className="px-4 py-2 text-right w-32">Estimasi Biaya</th>
                          {isEditing && <th className="px-4 py-2 text-center w-16">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draftItems.length === 0 ? (
                          <tr>
                            <td colSpan={isEditing ? 9 : 8} className="text-center py-8 text-[#59687A] italic">
                              Formula material kosong. Klik "Edit Formula" lalu "Tambah Material" untuk mengisi komponen BOM.
                            </td>
                          </tr>
                        ) : (
                          draftItems.map((item, idx) => {
                            const qty = parseFloat(item.qty_per_unit) || 0;
                            const price = parseFloat(item.harga_snapshot) || 0;
                            const waste = parseFloat(item.waste_pct) || 0;
                            
                            // Cost formulas
                            const itemMaterialCost = qty * price;
                            const itemWasteCost = itemMaterialCost * (waste / 100);
                            const itemTotalCost = itemMaterialCost + itemWasteCost;

                            const isMaterialActive = item.material ? item.material.aktif : true;

                            return (
                              <tr key={idx} className={`border-b border-[#EEF0F2] ${!isMaterialActive ? "bg-[#FFF8E6]" : "hover:bg-[#F8FAFC]"}`}>
                                <td className="px-4 py-2.5 text-center font-semibold text-[#59687A]">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="font-semibold text-[#1C252E] flex items-center gap-1.5">
                                    {item.material?.kode ? `[${item.material.kode}] ` : ""}
                                    {item.material?.nama || "Material ID: " + item.material_id}
                                    {!isMaterialActive && (
                                      <span className="text-[9px] bg-[#FFF2E8] border border-[#FFEAA5] text-[#D48806] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                        ⚠️ Nonaktif
                                      </span>
                                    )}
                                  </div>
                                  {item.catatan && <div className="text-[10px] text-[#59687A] italic mt-0.5">{item.catatan}</div>}
                                </td>
                                <td className="px-4 py-2.5 text-[#59687A]">
                                  {item.material_type || item.material?.kategori || "Raw Material"}
                                </td>
                                <td className="px-4 py-2.5 text-center text-[#59687A]">
                                  {item.material?.satuan || "pcs"}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.0001"
                                      min="0.0001"
                                      value={item.qty_per_unit}
                                      onChange={(e) => handleItemChange(idx, "qty_per_unit", e.target.value)}
                                      className="h-7 w-20 text-xs text-right border-[#DFE3E8] inline-block"
                                    />
                                  ) : (
                                    formatDecimal(item.qty_per_unit, 4)
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num text-[#59687A]">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={item.waste_pct}
                                      onChange={(e) => handleItemChange(idx, "waste_pct", e.target.value)}
                                      className="h-7 w-16 text-xs text-right border-[#DFE3E8] inline-block"
                                    />
                                  ) : (
                                    `${formatDecimal(item.waste_pct, 1)}%`
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num text-[#59687A]">
                                  {formatRupiah(item.harga_snapshot)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num font-semibold text-[#1C252E]">
                                  {formatRupiah(itemTotalCost)}
                                </td>
                                {isEditing && (
                                  <td className="px-4 py-2.5 text-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-[#B00020] hover:text-[#8B0016] hover:bg-[#FFF0F1]"
                                      onClick={() => handleRemoveItem(idx)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add item triggers for drafts */}
                  {isEditing && (
                    <div className="p-3 bg-[#F8FAFC] border-t border-[#DFE3E8] flex justify-start">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 text-[#0A6ED1] border-[#0A6ED1] hover:bg-[#F0F7FF]"
                        onClick={() => setIsAddMatOpen(true)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Komponen Material
                      </Button>
                    </div>
                  )}

                  {/* Summary & Estimator Panel */}
                  <div className="p-5 border-t border-[#DFE3E8] bg-gradient-to-br from-white to-[#F8FAFC] grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    
                    <div className="border-r border-[#EEF0F2] pr-4">
                      <span className="text-[#59687A] block">Total Material Cost (M):</span>
                      <span className="text-base font-bold text-[#1C252E] font-mono-num mt-1 block">
                        {formatRupiah(computedTotals.materialCost)}
                      </span>
                      <span className="text-[10px] text-[#59687A] mt-0.5 block">
                        Kebutuhan bahan baku netto
                      </span>
                    </div>

                    <div className="border-r border-[#EEF0F2] pr-4">
                      <span className="text-[#59687A] block">Total Waste Cost (W):</span>
                      <span className="text-base font-bold text-[#B25E00] font-mono-num mt-1 block">
                        {formatRupiah(computedTotals.wasteCost)}
                      </span>
                      <span className="text-[10px] text-[#59687A] mt-0.5 block">
                        Biaya susut / waste material
                      </span>
                    </div>

                    <div className="border-r border-[#EEF0F2] pr-4">
                      <span className="text-[#59687A] block">Total Biaya BOM (M + W):</span>
                      <span className="text-lg font-extrabold text-[#0A6ED1] font-mono-num mt-0.5 block">
                        {formatRupiah(computedTotals.totalBOMCost)}
                      </span>
                      <span className="text-[10px] text-[#59687A] mt-0.5 block">
                        Biaya material kotor per unit
                      </span>
                    </div>

                    <div>
                      <span className="text-[#59687A] block flex items-center gap-1">
                        Est. Cost Produksi (+{isEditing ? draftOverhead : (selectedBom.overhead_pct || 15)}%):
                      </span>
                      <span className="text-lg font-extrabold text-[#107E3E] font-mono-num mt-0.5 block">
                        {formatRupiah(computedTotals.estProductionCost)}
                      </span>
                      <span className="text-[10px] text-[#59687A] mt-0.5 block">
                        Termasuk overhead produksi pabrik
                      </span>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#59687A] bg-[#F8FAFC]">
                  Belum ada versi BOM yang dibuat untuk produk precast ini. Klik tombol "Buat Draft" untuk mulai menyusun formula.
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#F8FAFC] border border-dashed border-[#DFE3E8] rounded-md p-12 text-center text-xs text-[#59687A]">
              Pilih salah satu produk precast dari panel kiri untuk membuka workspace Bill of Material.
            </div>
          )}
        </div>

      </div>

      {/* ── DIALOG: BUAT DRAFT BARU ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="create-bom-dialog">
          <div className="px-5 py-4 border-b border-[#DFE3E8] bg-[#F4F6F8]">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-[#1C252E]">Buat Draft BOM Baru</DialogTitle>
              <DialogDescription className="text-xs text-[#59687A]">Inisiasi formula material baru untuk produk precast terpilih</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Produk Terpilih</label>
              <Input
                value={selectedProduct ? `${selectedProduct.kode} - ${selectedProduct.nama}` : ""}
                disabled
                className="mt-1 h-8 text-xs bg-[#F4F6F8] border-[#DFE3E8]"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Versi BOM</label>
                <Input
                  value={newBomVersion}
                  onChange={(e) => setNewBomVersion(e.target.value)}
                  placeholder="e.g. V1.0"
                  className="mt-1 h-8 text-xs border-[#DFE3E8]"
                  data-testid="create-bom-version"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Output Qty</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={newBomOutputQty}
                  onChange={(e) => setNewBomOutputQty(e.target.value)}
                  placeholder="1.0000"
                  className="mt-1 h-8 text-xs border-[#DFE3E8]"
                  data-testid="create-bom-qty"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Output UOM</label>
                <Input
                  value={newBomOutputUom}
                  onChange={(e) => setNewBomOutputUom(e.target.value)}
                  placeholder="PCS"
                  className="mt-1 h-8 text-xs border-[#DFE3E8]"
                  data-testid="create-bom-uom"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Overhead (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newBomOverhead}
                  onChange={(e) => setNewBomOverhead(e.target.value)}
                  placeholder="15"
                  className="mt-1 h-8 text-xs border-[#DFE3E8]"
                  data-testid="create-bom-overhead"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Catatan</label>
              <Input
                value={newBomNotes}
                onChange={(e) => setNewBomNotes(e.target.value)}
                placeholder="Misal: Standar SNI 2026, Proyek Wika, dll"
                className="mt-1 h-8 text-xs border-[#DFE3E8]"
                data-testid="create-bom-notes"
              />
            </div>
          </div>
          <DialogFooter className="px-5 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2] flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setIsCreateOpen(false)}>Batal</Button>
            <Button size="sm" className="text-xs h-8 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleCreateDraft}>Simpan Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: KLONING DRAFT ── */}
      <Dialog open={isCloneOpen} onOpenChange={setIsCloneOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="clone-bom-dialog">
          <div className="px-5 py-4 border-b border-[#DFE3E8] bg-[#F4F6F8]">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-[#1C252E]">Kloning BOM sebagai Draft</DialogTitle>
              <DialogDescription className="text-xs text-[#59687A]">Salin formula BOM terpilih dengan mengambil snapshot harga material terbaru</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">BOM Sumber</label>
              <Input
                value={selectedBom ? `${selectedBom.version} - ${selectedProduct?.nama}` : ""}
                disabled
                className="mt-1 h-8 text-xs bg-[#F4F6F8] border-[#DFE3E8]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Kode Versi Baru</label>
              <Input
                value={cloneVersionName}
                onChange={(e) => setCloneVersionName(e.target.value)}
                placeholder="e.g. V1.1 (Jangan duplikat)"
                className="mt-1 h-8 text-xs border-[#DFE3E8]"
                data-testid="clone-bom-version"
              />
            </div>
          </div>
          <DialogFooter className="px-5 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2] flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setIsCloneOpen(false)}>Batal</Button>
            <Button size="sm" className="text-xs h-8 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleClone}>Kloning Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Searchable Add Material Modal Dialog */}
      <AddMaterialDialog
        open={isAddMatOpen}
        onOpenChange={setIsAddMatOpen}
        materials={materialsList}
        onAdd={handleAddItem}
        existingMaterialIds={draftItems.map(item => item.material_id)}
      />

    </div>
  );
};

export default MasterBOM;
