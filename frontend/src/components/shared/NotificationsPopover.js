import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, AlertTriangle, ShieldCheck, Truck, Wrench, Package } from "lucide-react";
import { toast } from "sonner";

const items = [
  { icon: AlertTriangle, color: "#B00020", title: "Reject ditemukan di Line-B", desc: "U-Ditch 500 — 2 unit retak struktural", time: "5 menit lalu" },
  { icon: ShieldCheck, color: "#107E3E", title: "Inspeksi QC lulus", desc: "Batch BC-800-0118 (18 unit)", time: "20 menit lalu" },
  { icon: Wrench, color: "#E9730C", title: "Maintenance Forklift dijadwalkan", desc: "MCH-008 selesai estimasi 20 Feb", time: "1 jam lalu" },
  { icon: Package, color: "#0070F2", title: "Stok semen menipis", desc: "Sisa 184.5 ton — min 50 ton (PR-2026-0048 dalam proses)", time: "2 jam lalu" },
  { icon: Truck, color: "#0A6ED1", title: "Pengiriman dalam perjalanan", desc: "DO-2026-0142 → PT Adhi Karya", time: "3 jam lalu" },
];

export const NotificationsPopover = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="header-notifications"
          className="w-9 h-9 flex items-center justify-center text-[#59687A] hover:bg-[#F4F6F8] rounded transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#B00020] rounded-full" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" data-testid="notifications-panel">
        <div className="px-4 py-3 border-b border-[#DFE3E8] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#1C252E] font-display">Notifikasi</div>
            <div className="text-[11px] text-[#59687A]">{items.length} pesan baru</div>
          </div>
          <button onClick={() => toast.success("Semua notifikasi ditandai sudah dibaca")} className="text-[11px] text-[#0A6ED1] hover:underline" data-testid="notif-mark-read">Tandai sudah dibaca</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} data-testid={`notif-${i}`} className="px-4 py-3 border-b border-[#EEF0F2] hover:bg-[#F8FAFC] cursor-pointer flex gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: it.color + "15", color: it.color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#1C252E]">{it.title}</div>
                  <div className="text-[11px] text-[#59687A] truncate">{it.desc}</div>
                  <div className="text-[10px] text-[#59687A] mt-0.5">{it.time}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#DFE3E8] text-center">
          <button onClick={() => toast.info("Membuka pusat notifikasi lengkap...")} className="text-[11px] text-[#0A6ED1] hover:underline" data-testid="notif-see-all">Lihat semua notifikasi →</button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
