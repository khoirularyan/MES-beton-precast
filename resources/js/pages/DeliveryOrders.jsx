import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Clock, CheckCircle2, Plus, Package, Warehouse, ShieldCheck } from "lucide-react";
import { TruckIllustration } from "@/components/visuals/IndustrialVisuals";
import { formatNumber } from "@/data/mockData";
import { deliveryOrderApi, salesOrderApi, customerApi, productApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    case "Disiapkan": return 1;
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
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSO, setSelectedSO] = useState("");
  const [selectedCust, setSelectedCust] = useState("");
  const [qty, setQty] = useState("");
  const [truk, setTruk] = useState("");
  const [driver, setDriver] = useState("");
  const [tglKirim, setTglKirim] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fifoWarning, setFifoWarning] = useState(null);
  const [availableStock, setAvailableStock] = useState(0);
  const [soItemDetails, setSoItemDetails] = useState(null);

  // Queries
  const { data: deliveryOrdersList = [], isLoading: isLoadingDOs } = useQuery({
    queryKey: ["deliveryOrders"],
    queryFn: async () => {
      const res = await deliveryOrderApi.getAll();
      return res.data || [];
    }
  });

  const { data: salesOrdersData } = useQuery({
    queryKey: ["salesOrdersApproved"],
    queryFn: async () => {
      // Fetch sales orders with approved status
      const res = await salesOrderApi.getAll({ per_page: 100, status: "Approved" });
      return res.data?.data || res.data || [];
    }
  });

  const { data: customersData } = useQuery({
    queryKey: ["customersList"],
    queryFn: async () => {
      const res = await customerApi.getAll({ per_page: 100 });
      return res.data?.data || res.data || [];
    }
  });

  // Check FIFO Warning and load stock details
  const handleSOChange = async (soId) => {
    setSelectedSO(soId);
    setFifoWarning(null);
    setSoItemDetails(null);
    setAvailableStock(0);

    if (!soId) {
      setSelectedCust("");
      setQty("");
      return;
    }

    const so = salesOrdersData.find(s => s.id === parseInt(soId));
    if (so) {
      setSelectedCust(so.customer_id || "");
      
      const item = so.items?.find(i => i.product_id === so.product_id);
      if (item) {
        const remaining = Number(item.qty_ordered || 0) - Number(item.qty_delivered || 0);
        setSoItemDetails({
          qty_ordered: Number(item.qty_ordered || 0),
          qty_delivered: Number(item.qty_delivered || 0),
          remaining: remaining
        });
        setQty(remaining > 0 ? remaining.toString() : "");
      } else {
        setQty(so.qty || "");
      }

      // Fetch product details to get available_stock
      try {
        const prodRes = await productApi.getOne(so.product_id);
        if (prodRes.data) {
          setAvailableStock(Number(prodRes.data.available_stock || 0));
        }
      } catch (err) {
        console.error("Failed to load product available stock", err);
      }
    }

    try {
      const res = await deliveryOrderApi.checkFifo(soId);
      if (res.data && res.data.has_warning) {
        setFifoWarning(res.data);
        toast.warning("Peringatan FIFO: Terdapat lot/batch yang lebih tua di gudang!");
      }
    } catch (err) {
      console.error("Failed to check FIFO", err);
    }
  };

  // Mutation for creation
  const { mutateAsync: createDO, isPending: submitting } = useMutation({
    mutationFn: (data) => deliveryOrderApi.create(data),
    onSuccess: () => {
      toast.success("Delivery Order berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      setShowCreateModal(false);
      // reset form
      setSelectedSO("");
      setSelectedCust("");
      setQty("");
      setTruk("");
      setDriver("");
      setTglKirim("");
      setCatatan("");
      setFifoWarning(null);
      setSoItemDetails(null);
      setAvailableStock(0);
    },
    onError: (err) => {
      console.error("Create DO failed", err);
      toast.error(err.response?.data?.message || "Gagal membuat Delivery Order");
    }
  });

  // Mutation for updating status transitions
  const { mutateAsync: updateDOStatus } = useMutation({
    mutationFn: ({ id, status }) => deliveryOrderApi.update(id, { status }),
    onSuccess: () => {
      toast.success("Status pengiriman berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
    },
    onError: (err) => {
      console.error("Update status failed", err);
      toast.error(err.response?.data?.message || "Gagal memperbarui status pengiriman");
    }
  });

  const handleTransitionStatus = async (id, currentStatus) => {
    let nextStatus = "";
    if (currentStatus === "Disiapkan") nextStatus = "Siap Berangkat";
    else if (currentStatus === "Siap Berangkat") nextStatus = "Dalam Perjalanan";
    else if (currentStatus === "Dalam Perjalanan") nextStatus = "Selesai";

    if (!nextStatus) return;

    if (nextStatus === "Selesai") {
      const confirmText = "Apakah Anda yakin ingin menyelesaikan pengiriman ini? Ini akan memotong stok di gudang.";
      if (!window.confirm(confirmText)) {
        return;
      }
    }

    try {
      await updateDOStatus({ id, status: nextStatus });
    } catch (err) {
      // toast is already shown by onError of useMutation
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSO || !selectedCust || !qty || !tglKirim) {
      toast.warning("Mohon isi field wajib.");
      return;
    }

    await createDO({
      sales_order_id: parseInt(selectedSO),
      customer_id: parseInt(selectedCust),
      qty: parseInt(qty),
      truk,
      driver,
      tgl_kirim: tglKirim,
      catatan
    });
  };

  // KPIs
  const loading = isLoadingDOs;
  const activeDeliveries = deliveryOrdersList.filter(d => ["Dipersiapkan", "Disiapkan", "Siap Berangkat", "Dalam Perjalanan"].includes(d.status)).length;
  const inTransit = deliveryOrdersList.filter(d => d.status === "Dalam Perjalanan").length;
  const readyToDepart = deliveryOrdersList.filter(d => d.status === "Siap Berangkat").length;
  const completedCount = deliveryOrdersList.filter(d => d.status === "Selesai").length;

  return (
    <div>
      <PageHeader
        title="Delivery"
        subtitle="Delivery order management and product shipment to customers"
        breadcrumbs={["Home", "Delivery"]}
        testId="delivery-page-header"
        actions={
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"
          >
            <Plus className="w-3.5 h-3.5" />
            DO Baru
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="do-kpi-active" label="Active Deliveries" value={loading ? "..." : formatNumber(activeDeliveries)} unit="DO" icon={Truck} accent="warning" />
          <KPICard testId="do-kpi-route" label="In Transit" value={loading ? "..." : formatNumber(inTransit)} unit="DO" icon={MapPin} accent="default" />
          <KPICard testId="do-kpi-ready" label="Ready to Depart" value={loading ? "..." : formatNumber(readyToDepart)} unit="DO" icon={Clock} accent="default" />
          <KPICard testId="do-kpi-done" label="Completed" value={loading ? "..." : formatNumber(completedCount)} unit="DO" icon={CheckCircle2} accent="success" />
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
            {deliveryOrdersList.slice(0, 3).map((d, i) => {
              const variant = statusToVariant(d.status);
              const variantColor = variant === "route" ? "#E9730C" : variant === "done" ? "#107E3E" : "#0A6ED1";
              const productStr = d.sales_order?.product?.nama || "Produk Beton";
              return (
                <div key={d.no} data-testid={`fleet-card-${i}`} className="border rounded-md overflow-hidden" style={{ borderColor: variantColor + "33", background: `linear-gradient(180deg, ${variantColor}06 0%, #FFFFFF 60%)` }}>
                  <div className="p-3 border-b" style={{ borderColor: variantColor + "22" }}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{d.no}</div>
                        <div className="text-sm font-semibold text-[#1C252E] truncate">{d.customer?.nama || "Customer"}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <div className="px-3">
                    <TruckIllustration status={variant} />
                  </div>
                  <div className="p-3 pt-1">
                    <div className="text-[11px] text-[#59687A] truncate mb-2">{productStr} ({formatNumber(d.qty)} unit)</div>
                    <DeliveryTimeline status={d.status} />
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#59687A] font-mono-num">
                      <span>🚛 {d.truk || "-"}</span>
                      <span>{d.tgl_kirim}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && deliveryOrdersList.length === 0 && (
              <div className="col-span-3 py-6 text-center text-xs text-[#59687A]">Tidak ada pengiriman aktif hari ini.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Delivery Order List</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">DO No.</th>
                <th className="px-4 py-2 text-left">Related SO</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Load</th>
                <th className="px-4 py-2 text-left">Truck</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left w-48">Timeline</th>
                <th className="px-4 py-2 text-left">Delivery Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrdersList.map((d, i) => (
                <tr key={d.no} data-testid={`do-row-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{d.no}</td>
                  <td className="px-4 font-mono-num text-[#59687A]">{d.sales_order?.no || "-"}</td>
                  <td className="px-4 font-medium">{d.customer?.nama || "-"}</td>
                  <td className="px-4">{formatNumber(d.qty)} unit</td>
                  <td className="px-4 font-mono-num">{d.truk || "-"}</td>
                  <td className="px-4 text-[#59687A]">{d.driver || "-"}</td>
                  <td className="px-4"><DeliveryTimeline status={d.status} /></td>
                  <td className="px-4 font-mono-num">{d.tgl_kirim}</td>
                  <td className="px-4"><StatusBadge status={d.status} /></td>
                  <td className="px-4 text-center">
                    {d.status !== "Selesai" ? (
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-xs h-7 px-2 font-semibold text-[#0A6ED1] border-[#0A6ED1] hover:bg-[#0A6ED1] hover:text-white transition-colors"
                        onClick={() => handleTransitionStatus(d.id, d.status)}
                      >
                        {d.status === "Disiapkan" && "Konfirmasi Siap"}
                        {d.status === "Siap Berangkat" && "Kirim Armada"}
                        {d.status === "Dalam Perjalanan" && "Selesaikan"}
                      </Button>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && deliveryOrdersList.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-xs text-[#59687A]">Belum ada data delivery order.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DO Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white border border-[#DFE3E8] rounded-md p-6 w-full max-w-lg shadow-lg">
            <h3 className="text-base font-semibold text-[#1C252E] mb-4 font-display">New Delivery Order</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* FIFO Warning Alert */}
              {fifoWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 space-y-1">
                  <span className="font-semibold block">⚠️ Peringatan FIFO (MTS):</span>
                  <div>Terdapat stok produk ini dengan umur simpan &gt; 30 hari di gudang! Silakan keluarkan Batch/Lot tertua terlebih dahulu:</div>
                  <div className="mt-1 font-mono font-bold bg-amber-100 p-1.5 rounded inline-block text-[10px]">
                    Batch: {fifoWarning.batch_number} | Umur: {fifoWarning.aging_days} hari | Tgl Produksi: {fifoWarning.production_date}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#59687A] block mb-1">Sales Order *</label>
                  <select
                    className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                    value={selectedSO}
                    onChange={(e) => handleSOChange(e.target.value)}
                    required
                  >
                    <option value="">Pilih Sales Order...</option>
                    {(salesOrdersData || []).map(so => (
                      <option key={so.id} value={so.id}>
                        {so.no} — {so.customer?.nama} ({so.product?.nama})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#59687A] block mb-1">Customer *</label>
                  <select
                    className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    value={selectedCust}
                    disabled
                    required
                  >
                    <option value="">Customer (Otomatis)</option>
                    {(customersData || []).map(cust => (
                      <option key={cust.id} value={cust.id}>{cust.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SO Info & Stock Status Panel */}
              {soItemDetails && (
                <div className="bg-slate-50 border border-[#EEF0F2] rounded p-3 text-xs space-y-2 font-sans">
                  <span className="font-semibold block text-[#1C252E]">Sales Order & Stock Status:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-2 border rounded">
                      <span className="text-[10px] text-[#59687A] block">Ordered</span>
                      <span className="font-mono font-bold text-sm text-[#1C252E]">{soItemDetails.qty_ordered}</span>
                    </div>
                    <div className="bg-white p-2 border rounded">
                      <span className="text-[10px] text-[#59687A] block">Delivered</span>
                      <span className="font-mono font-bold text-sm text-green-700">{soItemDetails.qty_delivered}</span>
                    </div>
                    <div className="bg-white p-2 border rounded">
                      <span className="text-[10px] text-[#59687A] block">Remaining</span>
                      <span className="font-mono font-bold text-sm text-[#0A6ED1]">{soItemDetails.remaining}</span>
                    </div>
                    <div className="bg-white p-2 border rounded">
                      <span className="text-[10px] text-[#59687A] block">Available Stock</span>
                      <span className="font-mono font-bold text-sm text-amber-700">{availableStock}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[#59687A] block mb-1">Quantity (unit) *</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#59687A] block mb-1">Truck Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-9012-AB"
                    className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                    value={truk}
                    onChange={(e) => setTruk(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-[#59687A] block mb-1">Driver</label>
                  <input
                    type="text"
                    placeholder="Nama Driver"
                    className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#59687A] block mb-1">Delivery Date *</label>
                <input
                  type="date"
                  className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                  value={tglKirim}
                  onChange={(e) => setTglKirim(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#59687A] block mb-1">Delivery Notes</label>
                <textarea
                  className="w-full border border-[#DFE3E8] rounded px-3 py-2 text-sm focus:border-[#0A6ED1] focus:outline-none"
                  rows="3"
                  placeholder="Catatan pengiriman..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-[#DFE3E8] rounded text-xs hover:bg-gray-50 transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6ED1] hover:bg-[#0854A1] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Create DO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOrders;
