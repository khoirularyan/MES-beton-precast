import { ArrowUp, ArrowDown, Minus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const KPICard = ({
  label, value, unit, trend, trendValue, icon: Icon, accent = "default", testId,
  info, onClick,
}) => {
  const accents = {
    default: { bar: "bg-[#0A6ED1]", iconBg: "bg-[#E5F0FA] text-[#0A6ED1]", hex: "#0A6ED1" },
    success: { bar: "bg-[#107E3E]", iconBg: "bg-[#E6F5EC] text-[#107E3E]", hex: "#107E3E" },
    warning: { bar: "bg-[#E9730C]", iconBg: "bg-[#FDF3E7] text-[#E9730C]", hex: "#E9730C" },
    error:   { bar: "bg-[#B00020]", iconBg: "bg-[#FBE6E9] text-[#B00020]", hex: "#B00020" },
    neutral: { bar: "bg-[#59687A]", iconBg: "bg-[#F4F6F8] text-[#59687A]", hex: "#59687A" },
  };
  const a = accents[accent] || accents.default;

  const trendIcon = trend === "up" ? <ArrowUp className="w-3 h-3" /> :
                    trend === "down" ? <ArrowDown className="w-3 h-3" /> :
                    <Minus className="w-3 h-3" />;
  const trendColor = trend === "up" ? "text-[#107E3E]" : trend === "down" ? "text-[#B00020]" : "text-[#59687A]";

  const interactive = Boolean(onClick);

  return (
    <div
      data-testid={testId}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`mes-tile relative bg-white border border-[#DFE3E8] rounded-md p-4 overflow-hidden transition-all ${
        interactive ? "cursor-pointer hover:border-[#0A6ED1] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0A6ED1]/30" : ""
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.bar}`} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold truncate">{label}</div>
          {info && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid={`${testId}-info`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#A6B0BE] hover:text-[#0A6ED1] transition-colors flex-shrink-0"
                    aria-label="Penjelasan KPI"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs leading-snug">
                  {info}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded flex items-center justify-center ${a.iconBg}`}>
            <Icon className="w-4 h-4" strokeWidth={1.8} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-[28px] font-semibold text-[#1C252E] tracking-tight font-display leading-none font-mono-num">{value}</div>
        {unit && <div className="text-sm text-[#59687A] font-medium">{unit}</div>}
      </div>
      {trendValue && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${trendColor}`}>
          {trendIcon}
          <span className="font-medium">{trendValue}</span>
          <span className="text-[#59687A]">vs kemarin</span>
        </div>
      )}
      {interactive && (
        <div className="absolute bottom-1.5 right-2 text-[9px] uppercase tracking-wider text-[#A6B0BE] opacity-0 group-hover:opacity-100 transition-opacity">
          Klik untuk detail
        </div>
      )}
    </div>
  );
};

export default KPICard;
