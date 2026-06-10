import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { bomItems, bomVersionHistory, products, formatRupiah } from "@/data/mockData";
import {
  Plus, Trash2, History, CheckCircle, ChevronDown,
  Package, Scale, TrendingUp, Search, Download,
  AlertCircle, BarChart2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const PRODUCT_KEYS = Object.keys(bomItems);

const ChangeLogDialog = ({ open, onOpenChange, versions }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="changelog-dialog">
      <div className="px-5 py-4 border-b border-[#DFE3E8] bg-gradient-to-r from-[#F8FAFC] to-white">
        <DialogHeader>
          <DialogTitle className="text-sm font-display font-semibold text-[#1C252E]">BOM Change Log</DialogTitle>
          <DialogDescription className="text-xs text-[#59687A]">Version history for this Bill of Material</DialogDescription>
        </DialogHeader>
      </div>
      <div className="py-2">
        {versions.map((v, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-[#EEF0F2] last:border-0 hover:bg-[#F8FAFC]">
            <div className={`w-14 text-center px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
              v.status === "Active" ? "bg-[#E6F5EC] text-[#107E3E]" : "bg-[#F4F6F8] text-[#59687A]"
            }`}>
              {v.version}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1C252E]">{v.catatan}</span>
                <span className={`text-[10px] font-semibold ${v.status === "Active" ? "text-[#107E3E]" : "text-[#59687A]"}`}>{v.status}</span>
              </div>
              <div className="text-[11px] text-[#59687A] mt-0.5 font-mono-num">{v.tanggal} · {v.author}</div>
            </div>
          </div>
        ))}
      </div>
      <DialogFooter className="px-5 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
        <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const AddMaterialDialog = ({ open, onOpenChange, onAdd }) => {
  const [form, setForm] = useState({ kode: "", nama: "", satuan: "KG", qty: "", waste: "0.0", harga: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.kode || !form.nama || !form.qty) {
      toast.error("Lengkapi Material Code, Name, dan Qty Per Unit");
      return;
    }
    onAdd({ ...form, qtyPerUnit: parseFloat(form.qty), wastePct: parseFloat(form.waste), hargaPerUnit: parseInt(form.harga) || 0, cost: parseFloat(form.qty) * (parseInt(form.harga) || 0) });
    onOpenChange(false);
    setForm({ kode: "", nama: "", satuan: "KG", qty: "", waste: "0.0", harga: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="add-material-dialog">
        <div className="px-5 py-4 border-b border-[#DFE3E8]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-[#1C252E]">Add New Material</DialogTitle>
            <DialogDescription className="text-xs text-[#59687A]">Inject component from master database</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Material Code</label>
              <Input value={form.kode} onChange={(e) => set("kode", e.target.value)} placeholder="MAT-XXX-0000" className="mt-1 h-8 text-xs" data-testid="add-mat-code" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Material Name</label>
              <Input value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="e.g. Portland Cement Type I" className="mt-1 h-8 text-xs" data-testid="add-mat-name" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Unit</label>
              <Select value={form.satuan} onValueChange={(v) => set("satuan", v)}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["KG", "TON", "M3", "LTR", "Lembar", "PCS"].map((u) => (
                    <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Qty Per Unit</label>
              <Input type="number" value={form.qty} onChange={(e) => set("qty", e.target.value)} placeholder="0.00" className="mt-1 h-8 text-xs" data-testid="add-mat-qty" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Waste %</label>
              <Input type="number" value={form.waste} onChange={(e) => set("waste", e.target.value)} placeholder="0.0" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">Cost (IDR/unit)</label>
              <Input type="number" value={form.harga} onChange={(e) => set("harga", e.target.value)} placeholder="0" className="mt-1 h-8 text-xs" />
            </div>
          </div>
        </div>
        <DialogFooter className="px-5 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleAdd} data-testid="confirm-add-material">
            Add Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MasterBOM = () => {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_KEYS[0]);
  const [showMore, setShowMore] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [localComponents, setLocalComponents] = useState(null);
  const [search, setSearch] = useState("");

  const bom = bomItems[selectedProduct];
  const components = localComponents || bom.components;
  const visibleComponents = showMore ? components : components.slice(0, 4);

  const handleDeleteComponent = (kode) => {
    setLocalComponents((components || bom.components).filter((c) => c.kode !== kode));
    toast.info("Component removed from BOM");
  };

  const handleAddComponent = (newItem) => {
    setLocalComponents([...(localComponents || bom.components), { ...newItem }]);
    toast.success(`${newItem.nama} added to BOM`);
  };

  const handleProductChange = (val) => {
    setSelectedProduct(val);
    setLocalComponents(null);
    setShowMore(false);
  };

  const handleFinalize = () => {
    toast.success("BOM Finalized", {
      description: `${bom.productName} ${bom.activeVersion} is now active in production`,
    });
  };

  const totalCost = (localComponents || bom.components).reduce((s, c) => s + (c.cost || 0), 0);

  return (
    <div>
      <PageHeader
        title="Master BOM"
        subtitle="Define assembly components and material overhead for batch production units."
        breadcrumbs={["Master Data", "Master BOM"]}
        testId="bom-page-header"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5 border-[#DFE3E8]"
              onClick={() => setShowChangelog(true)}
              data-testid="btn-changelog"
            >
              <History className="w-3.5 h-3.5" /> Change Log
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs gap-1.5 bg-[#1C252E] hover:bg-[#2D3748] text-white"
              onClick={handleFinalize}
              data-testid="btn-finalize-bom"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Finalize BOM
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-3">
              TARGET PRODUCT
            </div>
            <Select value={selectedProduct} onValueChange={handleProductChange}>
              <SelectTrigger className="h-10 text-xs border-[#DFE3E8] font-semibold" data-testid="bom-product-select">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#59687A]" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_KEYS.map((kode) => (
                  <SelectItem key={kode} value={kode} className="text-xs">{kode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#59687A]">
              <AlertCircle className="w-3 h-3" />
              Standard Unit: {bom.standardUnit}
            </div>
          </div>

          <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">BOM VERSION</div>
              <span className="text-[10px] font-bold bg-[#0A6ED1] text-white px-2 py-0.5 rounded">LATEST</span>
            </div>
            <button
              className="w-full h-10 border border-[#DFE3E8] rounded flex items-center gap-2 px-3 hover:border-[#0A6ED1] transition-colors text-xs font-semibold text-[#1C252E] bg-white"
              onClick={() => setShowChangelog(true)}
              data-testid="bom-version-btn"
            >
              <div className="w-6 h-6 rounded-full bg-[#E5F0FA] flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-[#0A6ED1]">V</span>
              </div>
              {bom.versionLabel}
              <ChevronDown className="w-3 h-3 ml-auto text-[#59687A]" />
            </button>
            <div className="mt-3 text-[11px] text-[#59687A]">
              Last updated: {bom.lastUpdated} by {bom.lastUpdatedBy}
            </div>
          </div>

          <div className="bg-white border border-[#DFE3E8] rounded-md p-4 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-[#F4F6F8] border-2 border-dashed border-[#DFE3E8] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#59687A]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1C252E]">Add New Material</div>
              <div className="text-[11px] text-[#59687A]">Inject components from master database</div>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs bg-[#1C252E] hover:bg-[#2D3748] text-white mt-1 w-full"
              onClick={() => setShowAddMaterial(true)}
              data-testid="btn-add-material"
            >
              Add Material
            </Button>
          </div>
        </div>

        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8] gap-3">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-[#F4F6F8] border-[#DFE3E8]"
                data-testid="bom-search"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-[#DFE3E8]"
                onClick={() => toast.info("Exporting BOM...")}
                data-testid="btn-export-bom"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
          </div>

          <table className="w-full mes-table" data-testid="bom-table">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left">MATERIAL CODE</th>
                <th className="px-4 py-2.5 text-left">MATERIAL NAME</th>
                <th className="px-4 py-2.5 text-left">UNIT</th>
                <th className="px-4 py-2.5 text-right">QTY PER UNIT</th>
                <th className="px-4 py-2.5 text-right">WASTE %</th>
                <th className="px-4 py-2.5 text-right">COST (IDR)</th>
                <th className="px-4 py-2.5 text-center w-12">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {visibleComponents
                .filter((c) =>
                  !search ||
                  c.kode.toLowerCase().includes(search.toLowerCase()) ||
                  c.nama.toLowerCase().includes(search.toLowerCase())
                )
                .map((comp, i) => (
                  <tr key={comp.kode} data-testid={`bom-row-${i}`}>
                    <td className="px-4 font-mono-num text-[#0A6ED1] font-semibold text-xs">
                      {comp.kode}
                    </td>
                    <td className="px-4 text-sm font-medium text-[#1C252E]">{comp.nama}</td>
                    <td className="px-4 text-xs text-[#59687A] font-semibold">{comp.satuan}</td>
                    <td className="px-4 text-right font-mono-num text-sm text-[#1C252E]">
                      {comp.qtyPerUnit.toFixed(comp.qtyPerUnit < 1 ? 3 : 2)}
                    </td>
                    <td className="px-4 text-right">
                      <span className={`text-xs font-semibold font-mono-num ${comp.wastePct > 3 ? "text-[#E9730C]" : "text-[#59687A]"}`}>
                        {comp.wastePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 text-right font-mono-num text-sm text-[#1C252E]">
                      {formatRupiah(comp.cost)}
                    </td>
                    <td className="px-4 text-center">
                      <button
                        className="w-7 h-7 inline-flex items-center justify-center text-[#DFE3E8] hover:text-[#B00020] transition-colors"
                        onClick={() => handleDeleteComponent(comp.kode)}
                        data-testid={`bom-delete-${i}`}
                        title="Remove component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {components.length > 4 && (
            <div className="border-t border-[#EEF0F2] px-4 py-3 text-center">
              <button
                className="text-xs text-[#0A6ED1] hover:text-[#0854A1] flex items-center gap-1.5 mx-auto font-medium transition-colors"
                onClick={() => setShowMore(!showMore)}
                data-testid="btn-load-more"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
                {showMore ? "Show Less" : `Load More Materials (${components.length - 4} more)`}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#DFE3E8] rounded-md p-5">
            <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-4">
              PRODUCTION INSIGHT
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#1C252E]">
                    <BarChart2 className="w-4 h-4 text-[#0A6ED1]" />
                    BOM Efficiency
                  </div>
                  <span className="text-sm font-bold font-mono-num text-[#1C252E]">{bom.bomEfficiency}%</span>
                </div>
                <Progress
                  value={bom.bomEfficiency}
                  className="h-2"
                />
                <div className="mt-2 text-[11px] text-[#59687A]">
                  {bom.bomEfficiency >= 95
                    ? "Excellent — BOM is highly optimized"
                    : bom.bomEfficiency >= 90
                      ? "Good — Minor waste reduction possible"
                      : "Review — Waste factors above target"}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#1C252E] mb-2">
                  <Scale className="w-4 h-4 text-[#E9730C]" />
                  Calculated Weight
                </div>
                <div className="text-3xl font-bold text-[#1C252E] font-mono-num tracking-tight">
                  {bom.calculatedWeight} <span className="text-base font-medium text-[#59687A]">Tons</span>
                </div>
                <div className="mt-2 text-[11px] text-[#59687A]">
                  Per unit · includes all components + waste allowance
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-2">
                  Component Cost Breakdown
                </div>
                <div className="space-y-2">
                  {(localComponents || bom.components).map((c, i) => {
                    const pct = totalCost > 0 ? Math.round((c.cost / totalCost) * 100) : 0;
                    const barColors = ["#0A6ED1", "#E9730C", "#107E3E", "#59687A", "#0070F2"];
                    return (
                      <div key={c.kode} className="flex items-center gap-3">
                        <div className="text-[11px] text-[#59687A] w-40 truncate">{c.nama}</div>
                        <div className="flex-1 h-1.5 bg-[#EEF0F2] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: barColors[i % barColors.length] }}
                          />
                        </div>
                        <div className="text-[11px] font-mono-num text-[#1C252E] w-12 text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1C252E] rounded-md p-5 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                TOTAL MATERIAL COST
              </div>
              <div className="text-3xl font-bold text-white tracking-tight font-mono-num">
                {formatRupiah(totalCost)}
              </div>
              <div className="mt-1 text-[11px] text-white/50 font-mono-num">
                Across {(localComponents || bom.components).length} components
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                ESTIMATED PRODUCTION COST
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono-num">
                {formatRupiah(bom.estimatedProductionCost)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/40">
                <TrendingUp className="w-3 h-3" />
                Includes Labor &amp; Overhead ({bom.overheadPct}%)
              </div>
            </div>

            <div className="mt-5">
              <Button
                size="sm"
                className="w-full h-9 text-xs bg-[#0A6ED1] hover:bg-[#0854A1] text-white"
                onClick={() => toast.info("Membuka analisis biaya lengkap...")}
                data-testid="btn-cost-analysis"
              >
                <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Full Cost Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChangeLogDialog
        open={showChangelog}
        onOpenChange={setShowChangelog}
        versions={bomVersionHistory}
      />
      <AddMaterialDialog
        open={showAddMaterial}
        onOpenChange={setShowAddMaterial}
        onAdd={handleAddComponent}
      />
    </div>
  );
};

export default MasterBOM;
