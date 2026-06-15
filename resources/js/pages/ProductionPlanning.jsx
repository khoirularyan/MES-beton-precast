import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, AlertTriangle, Package, Play, Clock, TruckIcon, Boxes, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductionPlanningRefactored = () => {
  // State
  const [demands, setDemands] = useState([]);
  const [batches, setBatches] = useState([]);
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    demand_open: 0,
    demand_scheduled: 0,
    batch_planned: 0,
    batch_active: 0,
    batch_qc: 0,
    batch_completed: 0,
    batch_delivered: 0,
    mold_utilization_pct: 0,
  });

  // MPS Summary state
  const [planLevel, setPlanLevel] = useState('All');
  const [mpsData, setMpsData] = useState({
    kpis: {
      monthly_planned_volume: 0,
      monthly_produced_volume: 0,
      achievement_pct: 0,
      open_demand_count: 0
    },
    summary_table: []
  });
  const [mpsLoading, setMpsLoading] = useState(false);

  // Schedule Dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulingDemand, setSchedulingDemand] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    start_date: '',
    notes: ''
  });
  const [batchPreview, setBatchPreview] = useState(null);

  // Manual Batch Planning
  const [planningMode, setPlanningMode] = useState('auto');
  const [manualBatches, setManualBatches] = useState([{ date: '', end_date: '', qty: '' }]);
  const [autoPreviewData, setAutoPreviewData] = useState(null);
  const [autoPreviewLoading, setAutoPreviewLoading] = useState(false);
  const [autoPreviewError, setAutoPreviewError] = useState(null);

  // Gantt Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysToShow, setDaysToShow] = useState(14);
  const [calendarData, setCalendarData] = useState([]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    loadAllData().then(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (schedulingDemand && scheduleForm.start_date && planningMode === 'auto') {
      loadBatchPreview();
    }
    if (planningMode === 'manual' && schedulingDemand && scheduleForm.start_date && scheduleForm.mold_id) {
      loadAutoPreview();
    }
  }, [schedulingDemand, scheduleForm.start_date, scheduleForm.mold_id, planningMode]);

  useEffect(() => {
    if (!isMounted) return;
    loadCalendarData();
  }, [currentDate, daysToShow, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    loadMpsSummary(planLevel);
  }, [planLevel, isMounted]);

  const loadMpsSummary = async (level) => {
    setMpsLoading(true);
    try {
      const res = await api.get('/planning/mps-summary', { params: { plan_level: level } });
      setMpsData(res.data);
    } catch (error) {
      console.error('Failed to load MPS summary', error);
    } finally {
      setMpsLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load demand queue: Open/Approved + Planned-orphan demands via dedicated endpoint
      const demandsRes = await api.get('/production-demands/queue');
      setDemands(demandsRes.data.data || []);

      // Load all batches
      const batchesRes = await api.get('/production-batches', { params: { per_page: 100, upcoming: true } });
      setBatches(batchesRes.data.data || []);

      // Load molds
      const moldsRes = await api.get('/molds', { params: { per_page: 1000 } });
      setMolds(moldsRes.data?.data || moldsRes.data || []);

      // Load stats
      const statsRes = await api.get('/production-plans/stats');
      setStats(statsRes.data);

      // Load calendar
      await loadCalendarData();

      // Load MPS summary
      await loadMpsSummary(planLevel);
    } catch (error) {
      toast.error('Failed to load production planning data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchPreview = async () => {
    if (!schedulingDemand || !scheduleForm.start_date) return;
    
    try {
      const params = { start_date: scheduleForm.start_date };
      if (scheduleForm.mold_id) params.mold_id = scheduleForm.mold_id;

      const res = await api.get(`/production-demands/${schedulingDemand.id}/preview-batches`, { params });
      setBatchPreview(res.data);

      // If user hasn't manually picked a mold yet, pre-select the auto-chosen one
      if (!scheduleForm.mold_id && res.data.mold_id) {
        setScheduleForm(prev => ({ ...prev, mold_id: res.data.mold_id }));
      }
    } catch (error) {
      console.error('Failed to load batch preview', error);
      const msg = error.response?.data?.message || 'Failed to preview batches';
      toast.error(msg);
    }
  };

  const loadCalendarData = async () => {
    try {
      const dates = getDatesRange();
      const fromDate = formatDateToYYYYMMDD(dates[0]);
      const toDate = formatDateToYYYYMMDD(dates[dates.length - 1]);
      
      const calRes = await api.get('/production-plans/calendar', { 
        params: { from: fromDate, to: toDate } 
      });
      setCalendarData(calRes.data || []);
    } catch (error) {
      console.error('Failed to load calendar', error);
    }
  };

  const handleScheduleProduction = (demand) => {
    setSchedulingDemand(demand);
    setScheduleForm({
      start_date: '',
      mold_id: null,
      notes: ''
    });
    setBatchPreview(null);
    setPlanningMode('auto');
    setManualBatches([{ date: '', end_date: '', qty: '' }]);
    setAutoPreviewData(null);
    setAutoPreviewError(null);
    setShowScheduleDialog(true);
  };

  const handleModeChange = (newMode) => {
    setPlanningMode(newMode);
    setAutoPreviewData(null);
    setAutoPreviewError(null);
    setManualBatches([{ date: '', end_date: '', qty: '' }]);
  };

  // Manual batch helpers
  const addBatchRow = () => setManualBatches(prev => [...prev, { date: '', end_date: '', qty: '' }]);

  const removeBatchRow = (index) => {
    setManualBatches(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const updateBatchRow = (index, field, value) => {
    setManualBatches(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const totalManualQty = manualBatches.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);

  const loadAutoPreview = async () => {
    if (!schedulingDemand || !scheduleForm.start_date || !scheduleForm.mold_id) return;
    setAutoPreviewLoading(true);
    setAutoPreviewError(null);
    try {
      const params = { start_date: scheduleForm.start_date, mold_id: scheduleForm.mold_id };
      const res = await api.get(`/production-demands/${schedulingDemand.id}/preview-batches`, { params });
      setAutoPreviewData(res.data);
    } catch (error) {
      setAutoPreviewError(error.response?.data?.message || 'Gagal memuat auto preview.');
    } finally {
      setAutoPreviewLoading(false);
    }
  };

  const handleReopenDemand = async (demand) => {
    try {
      setLoading(true);
      const res = await api.post(`/production-demands/${demand.id}/reopen`);
      toast.success(res.data.message || 'Demand berhasil di-reset ke Open.');
      loadAllData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal me-reset demand.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitSchedule = async () => {
    if (!scheduleForm.start_date) {
      toast.error('Pilih tanggal mulai produksi');
      return;
    }

    // Frontend validation for manual mode
    if (planningMode === 'manual') {
      if (manualBatches.length === 0) {
        toast.error('Tambahkan minimal satu batch');
        return;
      }
      const invalid = manualBatches.some(b => !b.date || !b.qty || parseFloat(b.qty) <= 0);
      if (invalid) {
        toast.error('Setiap batch harus memiliki tanggal dan qty yang valid (> 0)');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        start_date: scheduleForm.start_date,
        notes: scheduleForm.notes,
        planning_mode: planningMode,
      };
      if (scheduleForm.mold_id) payload.mold_id = scheduleForm.mold_id;

      if (planningMode === 'manual') {
        payload.manual_batches = manualBatches.map((b, i) => ({
          date: b.date,
          end_date: b.end_date || b.date, // fallback to same day if not set
          qty: parseFloat(b.qty),
          sequence: i + 1,
        }));
      }

      const res = await api.post(`/production-demands/${schedulingDemand.id}/schedule`, payload);

      const batchCount = planningMode === 'manual'
        ? manualBatches.length
        : (batchPreview?.required_batches ?? '');
      toast.success(`${batchCount} batch berhasil dijadwalkan.`);
      if (res.data.warning) toast.warning(res.data.warning);
      setShowScheduleDialog(false);
      loadAllData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to schedule production';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDateToYYYYMMDD = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  const getDatesRange = () => {
    const dates = [];
    const start = new Date(currentDate);
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDatesRange();

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'Planned': 'default',
      'In Progress': 'secondary',
      'QC Pending': 'outline',
      'Completed': 'success',
      'Delivered': 'success',
      'Cancelled': 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planned': 'bg-blue-500',
      'In Progress': 'bg-orange-500',
      'QC Pending': 'bg-purple-500',
      'Completed': 'bg-green-500',
      'Delivered': 'bg-gray-500',
      'Cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -daysToShow : daysToShow));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const activeProductIds = demands.map(d => d.product_id);
  const scheduledMoldIds = Array.isArray(calendarData) ? calendarData.map(p => p.mold_id) : [];
  const activeBatchMoldIds = batches
    .filter(b => b.status === 'Planned' || b.status === 'In Progress')
    .map(b => b.mold_id);

  const moldsToShow = molds.filter(mold => {
    const isScheduled = scheduledMoldIds.includes(mold.id) || activeBatchMoldIds.includes(mold.id);
    const isCompatible = activeProductIds.includes(mold.product_id) ||
      demands.some(d => {
        if (d.product?.allowed_molds?.some(am => am.id === mold.id)) return true;
        
        const prodNama = d.product?.nama?.toLowerCase();
        const moldNama = mold.nama?.toLowerCase();
        const moldProduk = mold.produk?.toLowerCase();
        if (prodNama && moldNama && (prodNama.includes(moldNama) || moldNama.includes(prodNama))) return true;
        if (prodNama && moldProduk && (prodNama.includes(moldProduk) || moldProduk.includes(prodNama))) return true;
        
        return false;
      });
    return isScheduled || isCompatible;
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Production Planning"
        subtitle="Mold-Based Production Scheduling"
        actions={
          <Button onClick={loadAllData} variant="outline" disabled={loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* MPS Summary Panel */}
      <Card className="border border-[#DFE3E8]">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1C252E] flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#0A6ED1]" />
                Master Production Schedule (MPS) Summary
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Agregasi target volume perencanaan (Planned) vs realisasi fisik completed (Produced)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Plan Level:</span>
              <Select value={planLevel} onValueChange={setPlanLevel} disabled={mpsLoading}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Levels</SelectItem>
                  <SelectItem value="MPS">MPS Level</SelectItem>
                  <SelectItem value="Weekly">Weekly Level</SelectItem>
                  <SelectItem value="Daily">Daily Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {mpsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading MPS summary data...</div>
          ) : (
            <>
              {/* MPS KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded-md p-3">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">Monthly Planned Volume</span>
                  <span className="text-lg font-bold text-[#1C252E] mt-1 block">{(mpsData.kpis?.monthly_planned_volume || 0).toLocaleString()} m³</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded-md p-3">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">Monthly Produced Volume</span>
                  <span className="text-lg font-bold text-[#1C252E] mt-1 block">{(mpsData.kpis?.monthly_produced_volume || 0).toLocaleString()} m³</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded-md p-3">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">Plan Achievement</span>
                  <span className="text-lg font-bold text-emerald-600 mt-1 block">{(mpsData.kpis?.achievement_pct || 0)}%</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded-md p-3">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">Open Demands</span>
                  <span className="text-lg font-bold text-[#0A6ED1] mt-1 block">{(mpsData.kpis?.open_demand_count || 0)} Demands</span>
                </div>
              </div>

              {/* Summary Table */}
              <div className="border border-[#DFE3E8] rounded-md overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#DFE3E8]">
                    <tr>
                      <th className="p-2.5 font-semibold text-[#1C252E]">Month Period</th>
                      <th className="p-2.5 font-semibold text-[#1C252E] text-right">Planned Volume</th>
                      <th className="p-2.5 font-semibold text-[#1C252E] text-right">Produced Volume</th>
                      <th className="p-2.5 font-semibold text-[#1C252E] text-right">Achievement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mpsData.summary_table && mpsData.summary_table.length > 0 ? (
                      mpsData.summary_table.map((row, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-accent/20">
                          <td className="p-2.5 font-medium text-primary">{row.month_year}</td>
                          <td className="p-2.5 text-right font-mono">{parseFloat(row.planned_volume).toLocaleString()} m³</td>
                          <td className="p-2.5 text-right font-mono">{parseFloat(row.produced_volume).toLocaleString()} m³</td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={row.achievement_pct >= 85 ? 'text-emerald-600' : row.achievement_pct >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                              {row.achievement_pct}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">No planning summaries available for this plan level.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* KPI Dashboard - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard
          label="Demand Open"
          value={stats.demand_open || 0}
          icon={AlertTriangle}
          accent="warning"
        />
        <KPICard
          label="Demand Scheduled"
          value={stats.demand_scheduled || 0}
          icon={CheckCircle}
          accent="default"
        />
        <KPICard
          label="Batch Planned"
          value={stats.batch_planned || 0}
          icon={Calendar}
          accent="default"
        />
        <KPICard
          label="Batch Active"
          value={stats.batch_active || 0}
          icon={Play}
          accent="warning"
        />
        <KPICard
          label="Batch QC"
          value={stats.batch_qc || 0}
          icon={Clock}
          accent="neutral"
        />
        <KPICard
          label="Batch Completed"
          value={stats.batch_completed || 0}
          icon={Package}
          accent="success"
        />
        <KPICard
          label="Batch Delivered"
          value={stats.batch_delivered || 0}
          icon={TruckIcon}
          accent="neutral"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Demand Queue (35%) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Demand Queue
                <Badge variant="secondary">{demands.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex flex-col justify-center">
              <div className="flex-grow overflow-y-auto max-h-[320px]">
                {demands.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground my-auto flex flex-col items-center justify-center min-h-[220px]">
                    <Boxes className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No open demands</p>
                  </div>
                )}
                {demands.map((demand) => (
                  <div key={demand.id} className="border-b p-4 hover:bg-accent/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-primary">{demand.product?.nama}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          Customer: {demand.sales_order?.customer?.nama || 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={demand.priority <= 3 ? 'destructive' : 'secondary'} className="text-xs">
                          P{demand.priority}
                        </Badge>
                        {demand.is_orphan && (
                          <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                            Re-open
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t pt-2 mt-2">
                      <div className="text-muted-foreground">Demand No:</div>
                      <div className="font-mono truncate">{demand.demand_number}</div>
                      
                      <div className="text-muted-foreground">SO No:</div>
                      <div className="font-mono truncate">{demand.sales_order?.no || demand.sales_order?.so_number || 'N/A'}</div>
                      
                      <div className="text-muted-foreground">Quantity:</div>
                      <div className="font-bold">{parseFloat(demand.demand_qty).toLocaleString()} pcs</div>
                      
                      <div className="text-muted-foreground">Due Date:</div>
                      <div className="text-destructive font-medium">{demand.required_date}</div>
                    </div>

                    {demand.is_orphan ? (
                      <div className="space-y-1">
                        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Production plan tidak ditemukan. Reset demand ke Open untuk menjadwalkan ulang.
                        </p>
                        <Button 
                          onClick={() => handleReopenDemand(demand)}
                          size="sm"
                          variant="outline"
                          className="w-full mt-1 border-amber-500 text-amber-600 hover:bg-amber-50"
                          disabled={loading}
                        >
                          Re-open Demand
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleScheduleProduction(demand)}
                        size="sm" 
                        className="w-full mt-2"
                      >
                        Schedule Production
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Mold Utilization (65%) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Mold Utilization</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                  <span>Mold Utilization (Units Active Today / Total Units)</span>
                </div>
                
                {/* Recharts Stacked Column Chart */}
                <div className="w-full overflow-x-auto pt-4">
                  {molds.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8 w-full">No molds found in master data.</p>
                  ) : (
                    <div style={{ minWidth: molds.length > 6 ? `${molds.length * 75}px` : '100%' }}>
                      {(() => {
                        const chartData = molds.map(mold => {
                          const todayStr = formatDateToYYYYMMDD(new Date());
                          const inUse = batches.filter(b => {
                            const bDate = b.planned_date || b.planned_start?.split('T')[0];
                            return b.mold_id === mold.id && 
                              (b.status === 'Planned' || b.status === 'In Progress') && 
                              bDate === todayStr;
                          }).length;
                          
                          const total = mold.jumlah_total || 0;
                          const active = mold.jumlah_aktif || 0;
                          const inactive = Math.max(0, total - active);
                          const idle = Math.max(0, active - inUse);
                          
                          return {
                            name: mold.kode || mold.nama,
                            fullName: mold.nama,
                            'In Use': inUse,
                            'Active (Idle)': idle,
                            'Inactive': inactive,
                            total: total
                          };
                        });

                        return (
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                              data={chartData}
                              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                              barSize={32}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip 
                                formatter={(value, name) => [`${value} Units`, name]}
                                labelFormatter={(label, items) => {
                                  const item = items[0]?.payload;
                                  return item ? `${item.fullName} (${label})` : label;
                                }}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: 500 }}
                              />
                              <Bar dataKey="In Use" stackId="a" fill="#5c6dfb" name="In Use Today" />
                              <Bar dataKey="Active (Idle)" stackId="a" fill="#9aa6fc" name="Active (Idle)" />
                              <Bar dataKey="Inactive" stackId="a" fill="#cbd5e1" name="Inactive" />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Gantt Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Production Gantt Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                Next →
              </Button>
              <Select value={daysToShow.toString()} onValueChange={(val) => setDaysToShow(parseInt(val))}>
                <SelectTrigger className="w-24 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Calendar Header */}
              <div className="flex border-b bg-accent/30">
                <div className="w-32 flex-shrink-0 p-2 border-r font-medium text-xs sticky left-0 bg-accent/30">
                  Mold
                </div>
                {dates.map((date, idx) => (
                  <div key={idx} className="flex-1 min-w-[80px] p-2 border-r text-center">
                    <div className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-xs text-muted-foreground">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                ))}
              </div>

              {/* Mold Rows */}
              {moldsToShow.map((mold) => {
                const moldPlans = Array.isArray(calendarData) 
                  ? calendarData.filter(plan => plan.mold_id === mold.id || plan.resource === mold.nama)
                  : [];
                
                return (
                  <div key={mold.id} className="flex border-b hover:bg-accent/20">
                    <div className="w-32 flex-shrink-0 p-2 border-r text-xs font-medium sticky left-0 bg-background z-10">
                      {mold.nama}
                      <div className="text-[10px] text-muted-foreground">Cap: {mold.kapasitas_per_siklus || 1} pcs/cycle</div>
                      <div className="text-[9px] text-blue-600 font-semibold">
                        Daily: {(mold.kapasitas_per_siklus || 1) * (mold.siklus_per_hari || 1) * (mold.jumlah_aktif || 1)} pcs
                      </div>
                    </div>
                    <div className="flex-1 relative" style={{ minHeight: '60px' }}>
                      {dates.map((date, idx) => (
                        <div 
                          key={idx} 
                          className="absolute border-r"
                          style={{
                            left: `${(idx / dates.length) * 100}%`,
                            width: `${(1 / dates.length) * 100}%`,
                            height: '100%'
                          }}
                        />
                      ))}
                      
                      {/* Render batch bars */}
                      {moldPlans.map((plan) => {
                        const startDate = new Date(plan.start + 'T00:00:00');
                        const endDate = new Date((plan.end || plan.start) + 'T00:00:00');
                        
                        let startIndex = dates.findIndex(d => 
                          d.toDateString() === startDate.toDateString()
                        );
                        let endIndex = dates.findIndex(d => 
                          d.toDateString() === endDate.toDateString()
                        );
                        
                        if (startIndex === -1 && endIndex === -1) return null;
                        
                        if (startIndex === -1) startIndex = 0;
                        if (endIndex === -1) endIndex = dates.length - 1;
                        
                        const left = (startIndex / dates.length) * 100;
                        const width = Math.max(
                          ((endIndex - startIndex + 1) / dates.length) * 100 - 0.5,
                          (1 / dates.length) * 100 * 0.8  // minimum 80% of 1 cell
                        );

                        // Color by status
                        const statusLower = (plan.status || '').toLowerCase();
                        const barColor = statusLower.includes('casting') || statusLower.includes('progress')
                          ? 'from-orange-500 to-orange-600'
                          : statusLower.includes('qc') || statusLower.includes('quality')
                          ? 'from-purple-500 to-purple-600'
                          : statusLower.includes('finish') || statusLower.includes('selesai')
                          ? 'from-green-500 to-green-600'
                          : statusLower.includes('deliver') || statusLower.includes('kirim')
                          ? 'from-gray-500 to-gray-600'
                          : 'from-blue-500 to-indigo-600'; // planning/default
                        
                        return (
                          <div
                            key={plan.batch_id || plan.plan_id || Math.random()}
                            className={`absolute top-2 bg-gradient-to-r ${barColor} rounded px-1.5 py-1 cursor-pointer shadow hover:opacity-90 transition-opacity z-20`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              height: 'calc(100% - 16px)'
                            }}
                            title={`${plan.batch_number || 'Batch'} — ${plan.product_name}\nQty: ${plan.qty} pcs | SO: ${plan.sales_order} | ${plan.customer}`}
                          >
                            <div className="text-[10px] text-white font-semibold truncate">
                              {plan.product_name}
                            </div>
                            <div className="text-[9px] text-white/90 truncate font-medium">
                              {plan.qty} pcs · {plan.batch_number ? plan.batch_number.split('-').slice(-1)[0] : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {moldsToShow.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active or scheduled molds found</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t bg-accent/10 flex items-center gap-4 flex-wrap text-xs">
            <span className="font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>QC Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Production Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Upcoming Scheduled Production</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-accent/30">
                <tr>
                  <th className="p-2 text-left font-medium">Batch No</th>
                  <th className="p-2 text-left font-medium">Product</th>
                  <th className="p-2 text-left font-medium">Mold</th>
                  <th className="p-2 text-left font-medium">Qty</th>
                  <th className="p-2 text-left font-medium">Date</th>
                  <th className="p-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.slice(0, 10).map((batch) => (
                  <tr key={batch.id} className="border-b hover:bg-accent/20">
                    <td className="p-2 font-mono text-[10px]">{batch.batch_number}</td>
                    <td className="p-2">{batch.product?.nama}</td>
                    <td className="p-2">{batch.mold?.nama || 'N/A'}</td>
                    <td className="p-2">{batch.target_qty}</td>
                    <td className="p-2">{batch.planned_date || batch.planned_start?.split('T')[0]}</td>
                    <td className="p-2">
                      <Badge variant={getStatusBadgeVariant(batch.status)} className="text-[10px]">
                        {batch.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {batches.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No batches scheduled</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Production Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Production</DialogTitle>
            <DialogDescription>
              Atur jadwal produksi: pilih mold, tanggal mulai, dan konfirmasi batch yang akan dibuat.
            </DialogDescription>
          </DialogHeader>

          {schedulingDemand && (
            <div className="space-y-5">

              {/* ── 1. Demand Summary ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-accent/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Customer</span>
                  <span className="font-semibold">{schedulingDemand.sales_order?.customer?.nama || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Sales Order</span>
                  <span className="font-semibold font-mono">{schedulingDemand.sales_order?.no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Produk</span>
                  <span className="font-semibold">{schedulingDemand.product?.nama}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Total Demand</span>
                  <span className="font-bold text-primary text-sm">{parseFloat(schedulingDemand.demand_qty).toLocaleString()} pcs</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Due Date</span>
                  <span className="font-semibold text-orange-600">{schedulingDemand.required_date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Priority</span>
                  <Badge variant={schedulingDemand.priority <= 3 ? 'destructive' : 'secondary'} className="text-xs">
                    P{schedulingDemand.priority}
                  </Badge>
                </div>
              </div>

              {/* ── 1.5. Planning Mode Toggle ── */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Mode Perencanaan:</span>
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleModeChange('auto')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      planningMode === 'auto'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('manual')}
                    className={`px-3 py-1.5 text-xs font-semibold border-l transition-colors ${
                      planningMode === 'manual'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    Manual
                  </button>
                </div>
                {planningMode === 'manual' && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Tentukan batch secara manual
                  </span>
                )}
              </div>

              {/* ── 2. Scheduling Parameters ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-xs font-semibold">Tanggal Mulai Produksi *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    className="mt-1"
                    value={scheduleForm.start_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Pilih Mold</Label>
                  <Select
                    value={scheduleForm.mold_id ? String(scheduleForm.mold_id) : ''}
                    onValueChange={(val) => setScheduleForm({ ...scheduleForm, mold_id: parseInt(val) })}
                    disabled={!batchPreview?.compatible_molds?.length}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={batchPreview ? 'Pilih mold...' : 'Isi tanggal mulai dulu'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(batchPreview?.compatible_molds || []).map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          <span className="font-mono">{m.kode}</span>
                          <span className="ml-2 text-muted-foreground">— {m.nama}</span>
                          <span className={`ml-2 font-semibold ${m.jumlah_tersedia > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {m.jumlah_tersedia}/{m.jumlah_aktif} tersedia
                          </span>
                          {m.is_primary && <span className="ml-2 text-[10px] text-blue-600">[Primary]</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!scheduleForm.start_date && (
                <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded">
                  Pilih tanggal mulai untuk menghitung kapasitas dan jadwal batch secara otomatis.
                </div>
              )}

              {/* ── 3. Mold Info Card (muncul setelah preview) ── */}
              {batchPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[#F0F4FF] px-4 py-2 text-xs font-semibold text-[#1C252E] uppercase tracking-wider border-b">
                    Info Mold Terpilih
                  </div>
                  <div className="grid grid-cols-4 gap-0 divide-x text-center">
                    {[
                      { label: 'Mold', value: batchPreview.mold_name },
                      { label: 'Total Unit', value: batchPreview.jumlah_total ?? '—' },
                      { label: 'Sedang Dipakai', value: <span className="text-orange-500 font-bold">{batchPreview.jumlah_terpakai ?? 0}</span> },
                      { label: 'Tersedia', value: <span className={`font-bold ${(batchPreview.jumlah_tersedia ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>{batchPreview.jumlah_tersedia ?? 0}</span> },
                    ].map((item, i) => (
                      <div key={i} className="py-3 px-2">
                        <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                        <div className="text-xs font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 3.5. Auto Preview Panel (Manual Mode Only) ── */}
              {planningMode === 'manual' && (
                <Card className="border border-blue-300 bg-blue-50/40">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Auto Preview (Referensi — Read Only)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {!scheduleForm.start_date || !scheduleForm.mold_id ? (
                      <p className="text-xs text-blue-500">Isi tanggal mulai dan pilih mold untuk melihat estimasi otomatis.</p>
                    ) : autoPreviewLoading ? (
                      <p className="text-xs text-blue-500 animate-pulse">Memuat preview otomatis...</p>
                    ) : autoPreviewError ? (
                      <p className="text-xs text-destructive">{autoPreviewError}</p>
                    ) : autoPreviewData ? (
                      <div className="space-y-2">
                        <div className="flex gap-4 text-xs">
                          <span className="text-blue-700 font-semibold">{autoPreviewData.required_days} Hari</span>
                          <span className="text-indigo-700 font-semibold">{autoPreviewData.required_batches} Batch</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-[120px] overflow-y-auto">
                          {autoPreviewData.batches?.map((batch) => (
                            <div key={batch.sequence} className="text-center p-1.5 bg-white rounded border border-blue-200 text-[10px]">
                              <div className="font-bold text-blue-700">Batch {batch.sequence}</div>
                              <div className="font-semibold text-blue-600">{batch.qty} pcs</div>
                              <div className="text-muted-foreground font-mono">{batch.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {/* ── 4. Schedule Summary + Batch List (Auto Mode) ── */}
              {batchPreview && planningMode === 'auto' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[#F0F4FF] px-4 py-2 text-xs font-semibold text-[#1C252E] uppercase tracking-wider border-b flex justify-between items-center">
                    <span>Rencana Batch Produksi</span>
                    <div className="flex gap-4 text-[11px] font-normal">
                      <span className="text-emerald-600 font-bold">{batchPreview.required_days} Hari</span>
                      <span className="text-indigo-600 font-bold">{batchPreview.required_batches} Batch</span>
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[180px] overflow-y-auto">
                    {batchPreview.batches.map((batch) => (
                      <div key={batch.sequence} className="text-center p-2 bg-[#F8FAFC] rounded border text-[10px] hover:bg-blue-50 transition-colors">
                        <div className="font-bold text-primary">Batch {batch.sequence}</div>
                        <div className="font-semibold text-blue-600 my-0.5 text-xs">{batch.qty} pcs</div>
                        <div className="text-muted-foreground font-mono">{batch.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. Material Readiness ── */}
              {batchPreview && planningMode === 'auto' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[#F0F4FF] px-4 py-2 text-xs font-semibold text-[#1C252E] uppercase tracking-wider border-b flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#0A6ED1]" />
                    Material Readiness
                    {batchPreview.material_shortage
                      ? <Badge variant="destructive" className="ml-auto text-[9px]">SHORTAGE</Badge>
                      : <Badge className="ml-auto text-[9px] bg-green-500 hover:bg-green-600 text-white">READY</Badge>
                    }
                  </div>
                  <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto">
                    {batchPreview.material_requirements && batchPreview.material_requirements.length > 0 ? (
                      batchPreview.material_requirements.map((mat, mIdx) => {
                        const shortage = parseFloat(mat.shortage_qty || 0);
                        const isReady = shortage <= 0;
                        return (
                          <div key={mat.material_id || mIdx} className="flex items-center justify-between text-xs border-b pb-2 last:border-0 last:pb-0">
                            <div>
                              <span className="font-semibold text-primary block">{mat.material_nama || mat.material}</span>
                              <span className="text-[10px] text-muted-foreground">
                                Butuh: <strong>{parseFloat(mat.required_qty).toLocaleString()}</strong> {mat.satuan}
                                &nbsp;·&nbsp;
                                Stok: <strong>{parseFloat(mat.available_qty).toLocaleString()}</strong> {mat.satuan}
                              </span>
                            </div>
                            {isReady
                              ? <Badge className="text-[9px] bg-green-500 hover:bg-green-600 text-white">READY</Badge>
                              : <div className="text-right">
                                  <Badge variant="destructive" className="text-[9px]">SHORTAGE</Badge>
                                  <span className="block text-[10px] text-destructive font-semibold mt-0.5">-{shortage.toLocaleString()} {mat.satuan}</span>
                                </div>
                            }
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">Tidak ada material yang dibutuhkan.</p>
                    )}
                  </div>
                  {batchPreview.material_shortage && (
                    <div className="border-t p-3">
                      <Button
                        onClick={() => {
                          const text = `PROCUREMENT SUGGESTION\n\n` +
                            batchPreview.material_requirements
                              .filter(m => parseFloat(m.shortage_qty) > 0)
                              .map(m => `${m.material_nama || m.material}: Kekurangan ${parseFloat(m.shortage_qty).toLocaleString()} ${m.satuan}`)
                              .join('\n') +
                            `\n\nGenerated: ${formatDateToYYYYMMDD(new Date())}`;
                          navigator.clipboard.writeText(text);
                          toast.success('Procurement suggestion disalin ke clipboard!');
                        }}
                        size="sm"
                        variant="outline"
                        className="w-full text-[10px] h-7 border-destructive text-destructive hover:bg-destructive/10"
                      >
                        Copy Procurement Suggestion
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── 5.5. Manual Batch Form ── */}
              {planningMode === 'manual' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-[#F0F4FF] px-4 py-2 text-xs font-semibold text-[#1C252E] uppercase tracking-wider border-b flex justify-between items-center">
                    <span>Input Batch Manual</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Total: <strong className="text-primary">{totalManualQty.toLocaleString()} pcs</strong>
                    </span>
                  </div>
                  <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                    {/* Header labels */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold pb-1 border-b">
                      <span className="w-6 flex-shrink-0 text-center">#</span>
                      <span className="flex-1">Start Date (Mulai)</span>
                      <span className="flex-1">End Date / Deadline</span>
                      <span className="w-28">Qty (pcs)</span>
                      <span className="w-7"></span>
                    </div>
                    {manualBatches.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-6 text-center font-mono flex-shrink-0">
                          {index + 1}
                        </span>
                        <Input
                          type="date"
                          className="flex-1 h-8 text-xs"
                          value={row.date}
                          onChange={(e) => updateBatchRow(index, 'date', e.target.value)}
                        />
                        <Input
                          type="date"
                          className="flex-1 h-8 text-xs border-dashed"
                          value={row.end_date}
                          min={row.date || undefined}
                          title="Deadline / tanggal selesai batch ini"
                          onChange={(e) => updateBatchRow(index, 'end_date', e.target.value)}
                        />
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Qty"
                          className="w-28 h-8 text-xs"
                          value={row.qty}
                          onChange={(e) => updateBatchRow(index, 'qty', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeBatchRow(index)}
                          disabled={manualBatches.length === 1}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 pb-3 pt-1 border-t flex items-center justify-between">
                    <button
                      type="button"
                      onClick={addBatchRow}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Batch
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {manualBatches.length} batch · Total <strong>{totalManualQty.toLocaleString()} pcs</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* ── 6. Notes ── */}
              <div>
                <Label htmlFor="notes" className="text-xs font-semibold">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  className="mt-1"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Catatan tambahan untuk jadwal produksi ini..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={submitSchedule}
              disabled={
                loading ||
                !scheduleForm.start_date ||
                (planningMode === 'auto' && !batchPreview) ||
                (planningMode === 'manual' && manualBatches.length === 0)
              }
            >
              {loading
                ? 'Menjadwalkan...'
                : planningMode === 'manual'
                  ? `Konfirmasi & Buat ${manualBatches.length} Batch Manual`
                  : `Konfirmasi & Buat ${batchPreview?.required_batches ?? ''} Batch`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionPlanningRefactored;
