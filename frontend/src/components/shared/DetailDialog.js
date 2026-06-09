import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { Progress } from "@/components/ui/progress";

/**
 * Generic detail dialog for viewing record details.
 * Props:
 *   trigger - ReactNode
 *   title, subtitle
 *   sections: [{ title, items: [{ label, value, render? }] }]
 *   status (optional badge)
 *   progress (optional 0-100)
 *   testId
 */
export const DetailDialog = ({ trigger, title, subtitle, sections = [], status, progress, testId = "detail-dialog" }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl" data-testid={`${testId}-content`}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-display">{title}</DialogTitle>
              {subtitle && <DialogDescription className="text-xs mt-1">{subtitle}</DialogDescription>}
            </div>
            {status && <StatusBadge status={status} />}
          </div>
        </DialogHeader>

        {typeof progress === "number" && (
          <div className="py-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#59687A] uppercase tracking-wider text-[10px] font-semibold">Progress</span>
              <span className="font-mono-num font-semibold text-[#1C252E]">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="space-y-4 py-2">
          {sections.map((sec, si) => (
            <div key={si}>
              <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-2 border-b border-[#DFE3E8] pb-1">
                {sec.title}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {sec.items.map((it, ii) => (
                  <div key={ii} className="min-w-0">
                    <div className="text-[11px] text-[#59687A]">{it.label}</div>
                    <div className="text-sm font-medium text-[#1C252E] truncate">
                      {it.render ? it.render(it.value) : it.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" data-testid={`${testId}-close`}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetailDialog;
