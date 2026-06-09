// KPI Drilldown Dialog — shows formula, data source, trend, and breakdown for any KPI.

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Sigma, Database, TrendingUp, Layers } from "lucide-react";

const synthTrend = (label) => {
  const seed = label.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const days = ["08 Feb", "09 Feb", "10 Feb", "11 Feb", "12 Feb", "13 Feb", "14 Feb"];
  return days.map((d, i) => {
    const base = 60 + ((seed + i * 11) % 35);
    return { day: d, value: base + (i === 6 ? 8 : 0) };
  });
};

const KPIDrilldownDialog = ({ open, onOpenChange, definition, currentValue, currentDelta, accent = "#0A6ED1" }) => {
  if (!definition) return null;
  const trend = synthTrend(definition.label);
  const totalBreakdown = definition.breakdown
    .filter((b) => typeof b.value === "number")
    .reduce((s, b) => s + b.value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" data-testid="kpi-drilldown-dialog">
        {/* Header bar */}
        <div
          className="px-6 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}
        >
          <DialogHeader className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-80 font-semibold">KPI Drilldown</div>
            <DialogTitle className="text-xl font-display font-semibold text-white">{definition.label}</DialogTitle>
            <DialogDescription className="text-xs text-white/85">
              {definition.deskripsi}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-end gap-4 mt-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-75">Nilai Saat Ini</div>
              <div className="text-3xl font-semibold font-mono-num">{currentValue}</div>
            </div>
            {currentDelta && (
              <div className="text-xs font-medium opacity-95 pb-1.5 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {currentDelta}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5 bg-white">
          {/* Formula + source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">
                <Sigma className="w-3 h-3" /> Formula
              </div>
              <div className="text-xs text-[#1C252E] mt-1.5 font-mono leading-relaxed">{definition.formula}</div>
            </div>
            <div className="bg-[#F8FAFC] border border-[#DFE3E8] rounded p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">
                <Database className="w-3 h-3" /> Sumber Data
              </div>
              <div className="text-xs text-[#1C252E] mt-1.5 leading-relaxed">{definition.dataSource}</div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="border border-[#DFE3E8] rounded">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#EEF0F2]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">
                <TrendingUp className="w-3 h-3" /> Tren 7 Hari Terakhir
              </div>
              <div className="text-[10px] text-[#59687A] font-mono-num">data simulasi</div>
            </div>
            <div className="h-32 px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${definition.label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#EEF0F2" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#59687A" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#59687A" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid #DFE3E8" }}
                    labelStyle={{ fontWeight: 600, color: "#1C252E" }}
                  />
                  <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2} fill={`url(#grad-${definition.label.replace(/\s/g, "")})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">
                <Layers className="w-3 h-3" /> Breakdown
              </div>
              {totalBreakdown > 0 && (
                <div className="text-[10px] text-[#59687A]">
                  Total: <span className="font-mono-num font-semibold text-[#1C252E]">{totalBreakdown}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5" data-testid="kpi-breakdown-list">
              {definition.breakdown.map((b, i) => {
                const num = typeof b.value === "number" ? b.value : 0;
                const pct = totalBreakdown > 0 ? (num / totalBreakdown) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3" data-testid={`kpi-breakdown-${i}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-[#1C252E] font-medium truncate">{b.label}</span>
                        <span className="text-xs font-mono-num font-semibold text-[#1C252E]">
                          {b.value} {b.unit && <span className="text-[10px] text-[#59687A] font-sans">{b.unit}</span>}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F4F6F8] rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: typeof b.value === "number" && totalBreakdown > 0 ? `${pct}%` : "100%",
                            backgroundColor: b.color || accent,
                            opacity: typeof b.value === "number" ? 1 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KPIDrilldownDialog;
