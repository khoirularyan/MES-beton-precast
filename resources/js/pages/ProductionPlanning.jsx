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
import { Calendar, CheckCircle, AlertTriangle, Package, Play, Clock, TruckIcon, Boxes } from "lucide-react";
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

  // Gantt Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysToShow, setDaysToShow] = useState(14);
  const [calendarData, setCalendarData] = useState([]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    loadAllData().then(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (schedulingDemand && scheduleForm.start_date) {
      loadBatchPreview();
    }
  }, [schedulingDemand, scheduleForm.start_date]);

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
      // Load Open demands (not scheduled yet)
      const demandsRes = await api.get('/production-demands', { 
        params: { status: 'Open', per_page: 100 } 
      });
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
      const res = await api.get(`/production-demands/${schedulingDemand.id}/preview-batches`, {
        params: { start_date: scheduleForm.start_date }
      });
      setBatchPreview(res.data);
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
      notes: ''
    });
    setBatchPreview(null);
    setShowScheduleDialog(true);
  };

  const submitSchedule = async () => {
    if (!scheduleForm.start_date) {
      toast.error('Please select a start date');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/production-demands/${schedulingDemand.id}/schedule`, {
        start_date: scheduleForm.start_date,
        notes: scheduleForm.notes
      });
      toast.success(res.data.message);
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
                      <Badge variant={demand.priority <= 3 ? 'destructive' : 'secondary'} className="text-xs">
                        P{demand.priority}
                      </Badge>
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

                    <Button 
                      onClick={() => handleScheduleProduction(demand)}
                      size="sm" 
                      className="w-full mt-2"
                    >
                      Schedule Production
                    </Button>
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
                      
                      {/* Render plan bars */}
                      {moldPlans.map((plan) => {
                        const startDate = new Date(plan.start);
                        const endDate = new Date(plan.end);
                        
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
                        const width = ((endIndex - startIndex + 1) / dates.length) * 100 - 1;
                        
                        return (
                          <div
                            key={plan.plan_id || Math.random()}
                            className="absolute top-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded px-2 py-1.5 cursor-pointer shadow hover:opacity-90 transition-opacity z-20"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              height: 'calc(100% - 16px)'
                            }}
                            title={`${plan.product_name || plan.resource} - SO: ${plan.sales_order}`}
                          >
                            <div className="text-[10px] text-white font-semibold truncate">
                              {plan.product_name}
                            </div>
                            <div className="text-[9px] text-white/90 truncate font-medium">
                              {plan.qty} pcs • {plan.customer} (SO: {plan.sales_order})
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Production</DialogTitle>
            <DialogDescription>
              Auto-generate batches based on mold capacity
            </DialogDescription>
          </DialogHeader>

          {schedulingDemand && (
            <div className="space-y-4">
              {/* Demand Info (Read-only) */}
              <div className="p-4 bg-accent/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{schedulingDemand.sales_order?.customer?.nama || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Order:</span>
                  <span className="font-medium">{schedulingDemand.sales_order?.no || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{schedulingDemand.product?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demand Qty:</span>
                  <span className="font-bold">{schedulingDemand.demand_qty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium text-orange-600">{schedulingDemand.required_date}</span>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <Label htmlFor="start_date">Production Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                />
              </div>

              {!scheduleForm.start_date && (
                <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded">
                  Please select a start date to automatically calculate capacity and batch schedule.
                </div>
              )}

              {/* Batch Preview */}
              {batchPreview && (
                <div className="space-y-3">
                  <div className="p-4 bg-accent/50 rounded-lg grid grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">AUTO-MAPPED MOLD</span>
                      <span className="text-sm text-primary font-bold">{batchPreview.mold_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">DAILY CAPACITY</span>
                      <span className="text-sm text-blue-600 font-bold">{batchPreview.daily_capacity} pcs/day</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">REQUIRED DAYS</span>
                      <span className="text-sm text-emerald-600 font-bold">{batchPreview.required_days} Days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">TOTAL BATCHES</span>
                      <span className="text-sm text-indigo-600 font-bold">{batchPreview.required_batches} Batches</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-xs mb-2">Automated Batch & Capacity Schedule:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {batchPreview.batches.map((batch) => (
                        <div key={batch.sequence} className="text-center p-2 bg-white rounded border text-[10px] shadow-sm">
                          <div className="font-bold text-primary">Batch {batch.sequence}</div>
                          <div className="font-medium text-blue-600 my-0.5">{batch.qty} pcs</div>
                          <div className="text-muted-foreground font-mono">{batch.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Material Readiness Panel */}
                  <div className="p-4 bg-accent/50 rounded-lg space-y-3">
                    <div className="text-xs font-semibold text-[#1C252E] uppercase tracking-wider flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-[#0A6ED1]" />
                      Material Readiness Check
                    </div>
                    {batchPreview.material_requirements && batchPreview.material_requirements.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {batchPreview.material_requirements.map((mat, mIdx) => {
                          const shortage = parseFloat(mat.shortage_qty || 0);
                          const isReady = shortage <= 0;
                          return (
                            <div key={mat.material_id || mIdx} className="text-xs border-b pb-2 last:border-0 last:pb-0 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-primary block">{mat.material_nama || mat.material}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Required: {parseFloat(mat.required_qty).toLocaleString()} {mat.satuan} • Available: {parseFloat(mat.available_qty).toLocaleString()} {mat.satuan}
                                </span>
                              </div>
                              <div className="text-right">
                                {isReady ? (
                                  <Badge variant="success" className="text-[9px] px-1.5 py-0.5 bg-green-500 hover:bg-green-600 text-white">READY</Badge>
                                ) : (
                                  <div className="space-y-1">
                                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">SHORTAGE</Badge>
                                    <span className="block text-[10px] text-destructive font-semibold">-{shortage.toLocaleString()} {mat.satuan}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-2">No materials required for this product.</div>
                    )}

                    {/* Procurement Suggestion & Copy Button */}
                    {batchPreview.material_shortage && (
                      <div className="pt-2 border-t mt-2 flex flex-col space-y-2">
                        <div className="text-[10px] font-bold text-destructive uppercase tracking-wider">Procurement Suggestion</div>
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] font-mono text-destructive space-y-1">
                          {batchPreview.material_requirements.filter(m => parseFloat(m.shortage_qty) > 0).map((m, mIdx) => (
                            <div key={m.material_id || mIdx}>
                              • {m.material_nama || m.material}: Need {parseFloat(m.shortage_qty).toLocaleString()} {m.satuan}
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => {
                            const text = `PROCUREMENT SUGGESTION\n\n` + 
                              batchPreview.material_requirements
                                .filter(m => parseFloat(m.shortage_qty) > 0)
                                .map(m => `${m.material_nama || m.material}\nShortage: ${parseFloat(m.shortage_qty).toLocaleString()} ${m.satuan}`)
                                .join('\n\n') + 
                              `\n\nGenerated: ${formatDateToYYYYMMDD(new Date())}`;
                            navigator.clipboard.writeText(text);
                            toast.success('Procurement suggestion copied to clipboard!');
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
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitSchedule} disabled={loading || !scheduleForm.start_date}>
              {loading ? 'Scheduling...' : 'Generate Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionPlanningRefactored;
