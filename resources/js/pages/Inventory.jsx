import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatNumber, formatRupiah } from "@/data/mockData";
import { Package, Boxes, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CementSilo, AggregateStockpile, WarehouseFill } from "@/components/visuals/IndustrialVisuals";
import ProductIcon from "@/components/visuals/ProductIcon";
import { materialInventoryApi, inventoryApi } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Visual storage indicators (cement silos & aggregate stockpiles)
const StorageStrip = ({ materialsList = [] }) => {
  // Find real levels or fallback to 0
  const getLevel = (kode) => {
    const mat = materialsList.find(m => m.kode === kode);
    if (!mat) return 0;
    const qty = mat.qty_on_hand;
    const minStok = mat.min_stock;
    const maxStok = minStok * 5; // Assume max capacity is 5x min stock
    return Math.min(Math.round((qty / maxStok) * 100), 100);
  };

  const getCapacityText = (kode) => {
    const mat = materialsList.find(m => m.kode === kode);
    if (!mat) return "0";
    return `${formatNumber(mat.qty_on_hand)} ${mat.satuan}`;
  };

  return (
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
        <CementSilo label="Silo Semen 1" level={getLevel("MAT-SEM-OPC")} capacity={getCapacityText("MAT-SEM-OPC")} />
        <CementSilo label="Silo Semen 2" level={getLevel("MAT-SEM-PPC")} capacity={getCapacityText("MAT-SEM-PPC")} />
        <CementSilo label="Silo Semen 3" level={getLevel("MAT-SEM-SRC")} capacity={getCapacityText("MAT-SEM-SRC")} />
        <AggregateStockpile label="Pasir Lumajang" level={getLevel("MAT-AGR-PASIR05")} capacity={getCapacityText("MAT-AGR-PASIR05")} color="#9C4F00" />
        <AggregateStockpile label="Batu Split 1-2" level={getLevel("MAT-AGR-SPLIT10")} capacity={getCapacityText("MAT-AGR-SPLIT10")} color="#5A5A5A" />
        <AggregateStockpile label="Batu Split 2-3" level={getLevel("MAT-AGR-SPLIT20")} capacity={getCapacityText("MAT-AGR-SPLIT20")} color="#6E6E6E" />
      </div>
    </div>
  );
};

const Inventory = () => {
  const [tab, setTab] = useState("finished");
  const queryClient = useQueryClient();

  // Stock Adjustment Modal states
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjType, setAdjType] = useState("add");
  const [adjNotes, setAdjNotes] = useState("");

  // TanStack Queries
  const { data: materialsList = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await materialInventoryApi.getAll();
      return res.data || [];
    }
  });

  const { data: stats = {
    total_material: 0,
    low_stock: 0,
    critical_stock: 0,
    total_inventory_value: 0,
    total_weight_tons: 0,
    material_consumption: []
  }, isLoading: isLoadingStats } = useQuery({
    queryKey: ["inventoryDashboard"],
    queryFn: async () => {
      const res = await materialInventoryApi.getDashboard();
      return res.data || {};
    }
  });

  const { data: overview = {
    finished_goods: [],
    warehouses: [],
    storage: {},
    stock_movements: [],
    total_fg_qty: 0,
    receipts_today: 0,
    issues_today: 0
  }, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["inventoryOverview"],
    queryFn: async () => {
      const res = await inventoryApi.getOverview();
      return res.data || {};
    }
  });

  const loading = isLoadingMaterials || isLoadingStats || isLoadingOverview;

  // Mutation for Stock Adjustment
  const { mutateAsync: adjustStock, isPending: submitting } = useMutation({
    mutationFn: (data) => materialInventoryApi.adjust(data),
    onSuccess: () => {
      toast.success("Stok material berhasil disesuaikan");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryOverview"] });
      setAdjQty("");
      setAdjNotes("");
      setShowAdjModal(false);
    },
    onError: (err) => {
      console.error("Adjustment failed", err);
      toast.error(err.response?.data?.message || "Gagal menyesuaikan stok");
    }
  });

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !adjQty || parseFloat(adjQty) <= 0) {
      toast.warning("Masukkan jumlah penyesuaian yang valid.");
      return;
    }

    await adjustStock({
      material_id: selectedMaterial.id,
      qty: parseFloat(adjQty),
      type: adjType,
      notes: adjNotes
    });
  };

  const finishedGoodsList = overview.finished_goods || [];
  const warehousesList = overview.warehouses || [];
  const stockMovementsList = overview.stock_movements || [];
  const consumptionData = stats.material_consumption || [];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Raw materials, work-in-progress, and finished goods stock management"
        breadcrumbs={["Home", "Inventory"]}
        testId="inventory-page-header"
      />
      <div className="p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="inv-kpi-fg" label="Total Finished Goods Inventory" value={loading ? "..." : formatNumber(overview.total_fg_qty)} unit="units" icon={Package} accent="success" />
          <KPICard testId="inv-kpi-rm" label="Total Material Inventory" value={loading ? "..." : formatNumber(stats.total_weight_tons)} unit="tons" icon={Boxes} accent="default" />
          <KPICard testId="inv-kpi-in" label="Receipts Today" value={loading ? "..." : formatNumber(overview.receipts_today)} unit="transactions" icon={ArrowDownToLine} accent="warning" />
          <KPICard testId="inv-kpi-out" label="Issues Today" value={loading ? "..." : formatNumber(overview.issues_today)} unit="transactions" icon={ArrowUpFromLine} accent="neutral" />
        </div>

        {/* Storage visuals */}
        <StorageStrip materialsList={materialsList} />

        {/* Warehouse utilization 3D */}
        <div>
          <div className="text-base font-semibold text-[#1C252E] font-display mb-3">Warehouse Utilization</div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {warehousesList.map((w, i) => (
              <WarehouseFill key={w.kode} code={w.kode} label={w.nama} level={w.utilisasi} capacity={w.kapasitas} />
            ))}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto">
            <TabsTrigger value="finished" className="text-xs h-8">Finished Goods Inventory</TabsTrigger>
            <TabsTrigger value="raw" className="text-xs h-8">Material Inventory</TabsTrigger>
            <TabsTrigger value="movement" className="text-xs h-8">Stock Movement</TabsTrigger>
            <TabsTrigger value="consumption" className="text-xs h-8">Material Consumption</TabsTrigger>
          </TabsList>

          <TabsContent value="finished" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Total Stock</th>
                    <th className="px-4 py-2 text-right">Reserved</th>
                    <th className="px-4 py-2 text-right">Available</th>
                    <th className="px-4 py-2 text-left">Warehouse</th>
                    <th className="px-4 py-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {finishedGoodsList.map((f, i) => (
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
                  {!loading && finishedGoodsList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-xs text-[#59687A]">Tidak ada data finished goods.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Material</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-right">Current Stock</th>
                    <th className="px-4 py-2 text-right">Min Stock</th>
                    <th className="px-4 py-2 text-left w-40">Level</th>
                    <th className="px-4 py-2 text-right">Stock Value</th>
                    <th className="px-4 py-2 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {materialsList.map((m, i) => {
                    const qty = m.qty_on_hand;
                    const minStockVal = m.min_stock;
                    const ratio = minStockVal > 0 ? (qty / (minStockVal * 4)) * 100 : 100;
                    
                    let badgeStatus = "Normal";
                    let badgeVariant = "success";
                    if (qty <= 0.5 * minStockVal) {
                      badgeStatus = "Critical";
                      badgeVariant = "error";
                    } else if (qty <= minStockVal) {
                      badgeStatus = "Low Stock";
                      badgeVariant = "warning";
                    }

                    return (
                      <tr key={m.kode} data-testid={`rm-row-${i}`}>
                        <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{m.kode}</td>
                        <td className="px-4 font-medium">{m.nama}</td>
                        <td className="px-4 text-[#59687A]">{m.satuan}</td>
                        <td className="px-4 text-right font-mono-num font-semibold">{formatNumber(qty)}</td>
                        <td className="px-4 text-right font-mono-num text-[#59687A]">{formatNumber(minStockVal)}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(ratio, 100)} className="h-1.5 flex-1" />
                            <StatusBadge status={badgeStatus} variant={badgeVariant} />
                          </div>
                        </td>
                        <td className="px-4 text-right font-mono-num">{formatRupiah(qty * m.harga)}</td>
                        <td className="px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedMaterial(m);
                              setAdjType("add");
                              setAdjQty("");
                              setAdjNotes("");
                              setShowAdjModal(true);
                            }}
                            className="text-xs text-[#0A6ED1] hover:underline font-medium"
                          >
                            Sesuaikan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && materialsList.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-xs text-[#59687A]">Tidak ada data material.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="movement" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
              <table className="w-full mes-table">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Movement No.</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-left">Reference</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovementsList.map((m, i) => (
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
                  {!loading && stockMovementsList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-xs text-[#59687A]">Tidak ada data pergerakan stok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="consumption" className="mt-4">
            <div className="bg-white border border-[#DFE3E8] rounded-md p-4">
              <div className="text-base font-semibold text-[#1C252E] font-display mb-1">Material Consumption Last 7 Days</div>
              <div className="text-xs text-[#59687A] mb-4">Cement, aggregate, and rebar consumption in tons</div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={consumptionData} margin={{ left: -10 }}>
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

      {/* Direct Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-6 w-full max-w-md shadow-lg">
            <h3 className="text-base font-semibold text-[#1C252E] mb-4 font-display">Penyesuaian Stok Material</h3>
            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#59687A] block mb-1">Material</label>
                <input
                  type="text"
                  className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm bg-gray-50 text-gray-500 font-medium"
                  value={selectedMaterial?.nama || ""}
                  disabled
                />
              </div>
              
              <div>
                <label className="text-xs text-[#59687A] block mb-1">Tipe Penyesuaian</label>
                <div className="flex gap-6 mt-1">
                  <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="adjType"
                      value="add"
                      checked={adjType === "add"}
                      onChange={(e) => setAdjType(e.target.value)}
                      className="text-[#0A6ED1] focus:ring-[#0A6ED1]"
                    />
                    Tambah (+)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="adjType"
                      value="subtract"
                      checked={adjType === "subtract"}
                      onChange={(e) => setAdjType(e.target.value)}
                      className="text-[#0A6ED1] focus:ring-[#0A6ED1]"
                    />
                    Kurangi (-)
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[#59687A] block mb-1">Jumlah ({selectedMaterial?.satuan})</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                  placeholder={`Masukkan jumlah dalam ${selectedMaterial?.satuan}`}
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#59687A] block mb-1">Catatan</label>
                <textarea
                  className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                  rows="3"
                  placeholder="Alasan penyesuaian..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-[#DFE3E8] rounded text-xs hover:bg-gray-50 transition-colors"
                  onClick={() => setShowAdjModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6ED1] hover:bg-[#0854A1] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
