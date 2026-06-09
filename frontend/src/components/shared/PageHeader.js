import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const PageHeader = ({ title, subtitle, breadcrumbs = [], actions, testId }) => {
  return (
    <div
      data-testid={testId || "page-header"}
      className="bg-white border-b border-[#DFE3E8] px-6 py-4 sticky top-0 z-20"
    >
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-[#59687A] mb-1.5">
          {breadcrumbs.map((bc, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <span className={i === breadcrumbs.length - 1 ? "text-[#1C252E] font-medium" : ""}>{bc}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1C252E] font-display tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[#59687A] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
