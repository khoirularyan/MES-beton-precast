import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Generic filter popover with date range + custom selects.
 * Props:
 *   selects: [{ name, label, options: [{value,label}] }]
 *   testId
 */
export const FilterPopover = ({ selects = [], testId = "filter-popover" }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" data-testid={`${testId}-trigger`}>
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" data-testid={`${testId}-content`}>
        <div className="text-sm font-semibold text-[#1C252E] font-display mb-3">Filter Lanjutan</div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Periode</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input type="date" className="h-8 text-xs" data-testid={`${testId}-date-from`} />
              <Input type="date" className="h-8 text-xs" data-testid={`${testId}-date-to`} />
            </div>
          </div>
          {selects.map((s) => (
            <div key={s.name}>
              <Label className="text-xs">{s.label}</Label>
              <Select>
                <SelectTrigger className="h-8 text-xs mt-1" data-testid={`${testId}-${s.name}`}>
                  <SelectValue placeholder={`Semua ${s.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {s.options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => { toast.info("Filter direset"); setOpen(false); }}
            data-testid={`${testId}-reset`}
          >
            Reset
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1 bg-[#0A6ED1] hover:bg-[#0854A1]"
            onClick={() => { toast.success("Filter diterapkan"); setOpen(false); }}
            data-testid={`${testId}-apply`}
          >
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Helper to show export toast progress.
 */
export const showExportToast = (label = "laporan") => {
  const id = toast.loading(`Menyiapkan ${label}...`);
  setTimeout(() => {
    toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} berhasil diunduh`, {
      id,
      description: `File ${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.xlsx telah disimpan`,
    });
  }, 1200);
};

export const showPrintToast = () => {
  toast.info("Membuka dialog cetak...", {
    description: "Pratinjau cetak siap dalam beberapa detik",
  });
};

export const showRefreshToast = () => {
  const id = toast.loading("Memperbarui data...");
  setTimeout(() => {
    toast.success("Data berhasil diperbarui", {
      id,
      description: `Sinkronisasi terakhir: ${new Date().toLocaleTimeString("id-ID")}`,
    });
  }, 800);
};

export default FilterPopover;
