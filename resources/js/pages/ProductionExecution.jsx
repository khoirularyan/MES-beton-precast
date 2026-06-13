import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ArrowRight, Clock, Play, CheckCircle2, History, User, Calendar, RefreshCw, AlertTriangle, AlertCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { productionBatchApi, batchStatusApi } from "@/lib/api";
import ProductIcon from "@/components/visuals/ProductIcon";

const ProductionExecution = () => {
  const [statuses, setStatuses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, batchRes] = await Promise.all([
        batchStatusApi.getAll({ aktif: true }),
        productionBatchApi.getAll({ raw: true })
      ]);
      
      // Sort statuses by urutan sequence
      const activeStatuses = (statusRes.data.data || statusRes.data).filter(s => s.aktif);
      activeStatuses.sort((a, b) => a.urutan - b.urutan);
      setStatuses(activeStatuses);
      setBatches(batchRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data dari database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransition = async (batchId, toStatusId, notes = "") => {
    setIsTransitioning(true);
    try {
      await productionBatchApi.transition(batchId, {
        to_status_id: toStatusId,
        notes: notes || `Transisi status via Progress Board`
      });
      toast.success("Status batch berhasil diperbarui");
      setTransitionNotes("");
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal mengubah status batch";
      const detail = error.response?.data?.errors?.status?.[0] || "";
      toast.error(`${msg}. ${detail}`);
    } finally {
      setIsTransitioning(false);
    }
  };

  const openHistory = async (batch) => {
    try {
      const res = await productionBatchApi.getOne(batch.id);
      setSelectedBatch(res.data);
      setHistoryOpen(true);
    } catch (error) {
      toast.error("Gagal mengambil histori batch");
    }
  };

  // Duration Calculator (for Casting, Curing, QC)
  const getDurationString = (start) => {
    if (!start) return "";
    const startTime = new Date(start);
    const now = new Date();
    const diffMs = now - startTime;
    if (diffMs < 0) return "Baru mulai";
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} Hari ${diffHrs % 24} Jam berjalan`;
    }
    return `${diffHrs} Jam ${diffMins} Menit berjalan`;
  };

  // Planned vs Actual Variance Calculator
  const getVarianceString = (batch) => {
    const plan = batch.planned_date ? new Date(batch.planned_date) : null;
    const actual = batch.actual_start ? new Date(batch.actual_start) : new Date();
    
    if (!plan) return { text: "N/A", type: "neutral" };
    
    // reset times for day comparison
    plan.setHours(0,0,0,0);
    actual.setHours(0,0,0,0);
    
    const diffTime = actual - plan;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return { text: `+${diffDays} Hari Terlambat`, type: "late" };
    } else if (diffDays < 0) {
      return { text: `${diffDays} Hari Lebih Cepat`, type: "early" };
    }
    return { text: "Tepat Waktu", type: "ontime" };
  };

  // Schedule Status Calculator (On Schedule, Near Due, Overdue)
  const getScheduleStatus = (batch) => {
    // If already finished/delivered, it's completed
    const isCompleted = batch.status_model?.kode === 'BS-05' || batch.status_model?.kode === 'BS-06';
    if (isCompleted) {
      return { label: "On Schedule", color: "text-[#107E3E] bg-[#E5F6ED]", dot: "bg-[#107E3E]" };
    }

    const plan = batch.planned_date ? new Date(batch.planned_date) : null;
    if (!plan) return { label: "On Schedule", color: "text-[#107E3E] bg-[#E5F6ED]", dot: "bg-[#107E3E]" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    plan.setHours(0, 0, 0, 0);

    const diffDays = Math.round((plan - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Overdue", color: "text-[#B00020] bg-[#FBE6E9]", dot: "bg-[#B00020]" };
    } else if (diffDays === 0) {
      return { label: "Near Due", color: "text-[#E9730C] bg-[#FFF2E5]", dot: "bg-[#E9730C]" };
    }
    return { label: "On Schedule", color: "text-[#107E3E] bg-[#E5F6ED]", dot: "bg-[#107E3E]" };
  };

  const getActionLabel = (nextStatusName) => {
    if (!nextStatusName) return "";
    const name = nextStatusName.toLowerCase();
    if (name.includes("ready material") || name.includes("material")) {
      return "Siapkan Material";
    }
    if (name.includes("casting") || name.includes("cetak")) {
      return "Mulai Casting";
    }
    if (name.includes("qc") || name.includes("quality")) {
      return "Mulai QC Check";
    }
    if (name.includes("finished") || name.includes("selesai") || name.includes("komplet")) {
      return "Selesaikan Batch";
    }
    if (name.includes("delivered") || name.includes("kirim") || name.includes("kirim customer")) {
      return "Kirim ke Customer";
    }
    // Dynamic fallback
    return `Kirim ke ${nextStatusName}`;
  };

  const getActionIcon = (nextStatusName) => {
    if (!nextStatusName) return <Play className="w-3 h-3 text-[#59687A]" />;
    const name = nextStatusName.toLowerCase();
    if (name.includes("ready") || name.includes("material")) {
      return <Calendar className="w-3 h-3 text-[#59687A]" />;
    }
    if (name.includes("casting") || name.includes("cetak")) {
      return <Play className="w-3 h-3 text-[#107E3E] fill-[#107E3E]" />;
    }
    if (name.includes("qc") || name.includes("quality")) {
      return <CheckCircle2 className="w-3 h-3 text-[#0A6ED1]" />;
    }
    if (name.includes("finished") || name.includes("selesai")) {
      return <CheckCircle2 className="w-3 h-3 text-[#107E3E]" />;
    }
    if (name.includes("delivered") || name.includes("kirim")) {
      return <ArrowRight className="w-3 h-3 text-[#59687A]" />;
    }
    return <Play className="w-3 h-3 text-[#59687A]" />;
  };

  const filteredBatches = batches.filter(b => 
    b.batch_number.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (b.product?.nama && b.product.nama.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Production Execution Monitoring"
        subtitle="Real-time progress board for precast concrete batches driven by planning schedule"
        breadcrumbs={["Home", "Production Execution"]}
        actions={
          <Button size="sm" onClick={fetchData} className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        
        {/* Search filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#DFE3E8] p-4 rounded-md shadow-sm">
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Cari Batch No atau Produk..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-[#DFE3E8] rounded focus:outline-none focus:border-[#0A6ED1]"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-[#59687A]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#107E3E]" />On Schedule</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E9730C]" />Near Due</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#B00020]" />Overdue</span>
          </div>
        </div>

        {/* Dashboard Status Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {statuses.map((s) => {
            const count = batches.filter(b => b.batch_status_id === s.id).length;
            return (
              <div
                key={s.id}
                className="bg-white border border-[#DFE3E8] p-3 rounded-md flex flex-col items-center justify-center text-center shadow-xs"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#59687A]">{s.status}</span>
                <span className="text-2xl font-bold font-mono-num mt-1" style={{ color: s.warna }}>{count}</span>
                <span className="text-[9px] text-[#A6B0BE] mt-0.5">batch aktif</span>
              </div>
            );
          })}
        </div>

        {/* Kanban Board Container */}
        {loading && statuses.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white border rounded-md">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0A6ED1]" />
            <span className="ml-2.5 text-sm text-[#59687A]">Memuat progress board...</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 items-stretch min-h-[60vh]">
            {statuses.map((columnStatus, colIndex) => {
              const colBatches = filteredBatches.filter(b => b.batch_status_id === columnStatus.id);
              const nextStatus = statuses[colIndex + 1];

              return (
                <div
                  key={columnStatus.id}
                  className="flex-shrink-0 w-80 bg-[#F4F6F8] rounded-md border border-[#DFE3E8] p-3 flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#DFE3E8] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: columnStatus.warna }} />
                      <h3 className="font-semibold text-sm text-[#1C252E] font-display">{columnStatus.status}</h3>
                    </div>
                    <span className="font-mono-num text-xs font-semibold px-2 py-0.5 bg-white border border-[#DFE3E8] rounded-full text-[#59687A]">
                      {colBatches.length}
                    </span>
                  </div>

                  {/* Cards stack */}
                  <div className="space-y-3 overflow-y-auto flex-1 max-h-[60vh] pr-1">
                    {colBatches.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-28 border border-dashed border-[#DFE3E8] bg-white/50 rounded-md text-[#A6B0BE]">
                        <span className="text-xs">Tidak ada batch</span>
                      </div>
                    ) : (
                      colBatches.map((batch) => {
                        const schedInfo = getScheduleStatus(batch);
                        const variance = getVarianceString(batch);
                        
                        // Check if active running status (Casting, Curing, QC)
                        const isActiveRunning = ['BS-03', 'BS-07', 'BS-04'].includes(columnStatus.kode);

                        return (
                          <div
                            key={batch.id}
                            className="bg-white border border-[#DFE3E8] rounded-md p-3.5 shadow-sm hover:border-[#0A6ED1] transition-all space-y-3 relative group"
                          >
                            {/* Card Header: Batch Number & History Trigger */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono-num text-xs font-semibold text-[#0A6ED1]">{batch.batch_number}</span>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => openHistory(batch)} 
                                  className="text-[#A6B0BE] hover:text-[#0A6ED1] transition-colors p-1"
                                  title="Lihat Histori Log Batch"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${schedInfo.color}`}>
                                  <span className={`w-1 h-1 rounded-full ${schedInfo.dot}`} />
                                  {schedInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="flex items-start gap-2.5">
                              <ProductIcon name={batch.product?.nama || ""} size="sm" className="mt-0.5" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#1C252E] leading-tight truncate">{batch.product?.nama || "Unknown Product"}</h4>
                                <p className="text-[10px] text-[#A6B0BE] mt-0.5">SO: {batch.sales_order?.no || "Stock (MTS)"}</p>
                              </div>
                            </div>

                            {/* Batch Info Grid */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#F8FAFC] p-2 rounded border border-[#EEF0F2]">
                              <div>
                                <span className="text-[#A6B0BE]">Cetakan:</span>
                                <div className="font-semibold text-[#1C252E] truncate">{batch.mold?.nama || "N/A"}</div>
                              </div>
                              <div>
                                <span className="text-[#A6B0BE]">Kuantitas:</span>
                                <div className="font-semibold text-[#1C252E] font-mono-num">
                                  {batch.actual_qty > 0 ? `${batch.actual_qty} / ` : ""}{batch.target_qty} unit
                                </div>
                              </div>
                              <div>
                                <span className="text-[#A6B0BE]">Tgl Jadwal:</span>
                                <div className="font-semibold text-[#1C252E] font-mono-num">{batch.planned_date || "N/A"}</div>
                              </div>
                              <div>
                                <span className="text-[#A6B0BE]">Schedule Variance:</span>
                                <div className={`font-semibold font-mono-num ${
                                  variance.type === 'late' ? 'text-[#B00020]' : variance.type === 'early' ? 'text-[#107E3E]' : 'text-[#59687A]'
                                }`}>
                                  {variance.text}
                                </div>
                              </div>
                            </div>

                            {/* Active production running indicators */}
                            {isActiveRunning && batch.actual_start && (
                              <div className="flex items-center justify-between text-[10px] border-t border-[#EEF0F2] pt-2">
                                <span className="text-[#107E3E] font-semibold flex items-center gap-1 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#107E3E]" /> Running
                                </span>
                                <span className="text-[#59687A] font-mono-num font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#A6B0BE]" /> {getDurationString(batch.actual_start)}
                                </span>
                              </div>
                            )}

                            {/* Action transition button */}
                            {nextStatus && (
                              <div className="pt-1.5">
                                <Button
                                  size="xs"
                                  className="w-full text-[10px] h-7 bg-white hover:bg-[#E5F0FA] border border-[#DFE3E8] text-[#1C252E] hover:text-[#0A6ED1] hover:border-[#0A6ED1] gap-1 font-medium transition-all"
                                  onClick={() => handleTransition(batch.id, nextStatus.id)}
                                  disabled={isTransitioning}
                                >
                                  {getActionIcon(nextStatus.status)}
                                  {getActionLabel(nextStatus.status)}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline Logs dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          {selectedBatch && (
            <>
              <div className="px-6 py-4 bg-gradient-to-r from-[#0A6ED1] to-[#0854A1] text-white">
                <DialogHeader>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 font-semibold">Histori Log Batch</div>
                  <DialogTitle className="text-base font-display text-white">{selectedBatch.batch_number}</DialogTitle>
                  <DialogDescription className="text-xs text-white/85">
                    {selectedBatch.product?.nama} · Qty {selectedBatch.target_qty} units
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="relative border-l-2 border-[#DFE3E8] ml-2.5 pl-6 space-y-6">
                  {selectedBatch.status_logs && selectedBatch.status_logs.length > 0 ? (
                    selectedBatch.status_logs.map((log) => (
                      <div key={log.id} className="relative">
                        {/* Dot marker */}
                        <span className="absolute left-[-31px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0A6ED1] bg-white" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#A6B0BE] font-mono-num">
                            <span>{new Date(log.changed_at).toLocaleString('id-ID')}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.user?.name || "Sistem"}</span>
                          </div>
                          
                          <div className="text-xs font-semibold text-[#1C252E] flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">{log.from_status?.status || "Draft"}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#A6B0BE]" />
                            <span className="px-1.5 py-0.5 rounded text-white font-mono text-[10px]" style={{ backgroundColor: log.to_status?.warna }}>{log.to_status?.status}</span>
                          </div>
                          
                          {log.notes && (
                            <p className="text-xs text-[#59687A] bg-[#F8FAFC] border border-[#EEF0F2] p-2 rounded italic">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-[#A6B0BE]">Belum ada log histori perubahan status batch ini</div>
                  )}
                </div>
              </div>

              <DialogFooter className="px-6 py-3 bg-[#F8FAFC] border-t border-[#EEF0F2]">
                <Button variant="outline" size="sm" onClick={() => setHistoryOpen(false)}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionExecution;
