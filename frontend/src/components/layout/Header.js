import { Search, HelpCircle, Settings, BookOpen, Keyboard, MessageCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { company } from "@/data/mockData";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationsPopover from "@/components/shared/NotificationsPopover";
import { toast } from "sonner";

export const Header = () => {
  return (
    <header
      data-testid="app-header"
      className="h-14 bg-white border-b border-[#DFE3E8] flex items-center px-6 sticky top-0 z-30"
    >
      {/* Plant context */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#59687A] leading-none">Plant</div>
          <div className="text-[13px] font-semibold text-[#1C252E] leading-tight">{company.plant}</div>
        </div>
        <div className="w-px h-8 bg-[#DFE3E8]" />
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#59687A] leading-none">Shift Aktif</div>
          <div className="text-[13px] font-semibold text-[#107E3E] leading-tight">{company.shift}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
          <Input
            data-testid="global-search"
            placeholder="Cari order, produk, customer..."
            className="pl-9 h-9 bg-[#F4F6F8] border-[#DFE3E8] text-sm focus-visible:ring-1 focus-visible:ring-[#0A6ED1]"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <button
              data-testid="header-help"
              className="w-9 h-9 flex items-center justify-center text-[#59687A] hover:bg-[#F4F6F8] rounded transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0" data-testid="help-panel">
            <div className="px-4 py-3 border-b border-[#DFE3E8]">
              <div className="text-sm font-semibold text-[#1C252E] font-display">Bantuan & Dokumentasi</div>
              <div className="text-[11px] text-[#59687A]">Sumber daya untuk operator pabrik</div>
            </div>
            <div className="py-1">
              {[
                { icon: BookOpen, label: "Panduan Pengguna", desc: "Cara menggunakan modul MES" },
                { icon: FileText, label: "Standar Operasional", desc: "SOP produksi precast concrete" },
                { icon: Keyboard, label: "Pintasan Keyboard", desc: "Lihat semua shortcut" },
                { icon: MessageCircle, label: "Hubungi Support", desc: "support@precastmes.id" },
              ].map((it, i) => {
                const Icon = it.icon;
                return (
                  <button
                    key={i}
                    data-testid={`help-item-${i}`}
                    onClick={() => toast.info(it.label, { description: it.desc })}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#F4F6F8] text-left"
                  >
                    <Icon className="w-4 h-4 text-[#59687A]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#1C252E]">{it.label}</div>
                      <div className="text-[11px] text-[#59687A] truncate">{it.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="header-settings"
              className="w-9 h-9 flex items-center justify-center text-[#59687A] hover:bg-[#F4F6F8] rounded transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Pengaturan</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Bahasa diubah ke Bahasa Indonesia")} data-testid="setting-language">Bahasa: Indonesia</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Zona waktu: WIB (Asia/Jakarta)")} data-testid="setting-timezone">Zona Waktu: WIB</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Tema: Light (SAP Fiori)")} data-testid="setting-theme">Tema: Light</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Membuka pengaturan akun...")} data-testid="setting-account">Pengaturan Akun</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-[#DFE3E8] mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="header-user-menu"
              className="flex items-center gap-2 h-9 px-2 hover:bg-[#F4F6F8] rounded transition-colors"
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src="https://images.unsplash.com/photo-1603696774905-83ae340e2cae?crop=entropy&cs=srgb&fm=jpg&q=85&w=64" alt={company.operator} />
                <AvatarFallback className="text-xs bg-[#0A6ED1] text-white">BS</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-[12px] font-medium text-[#1C252E] leading-tight">{company.operator}</div>
                <div className="text-[10px] text-[#59687A] leading-tight">Plant Manager</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Membuka profil Budi Santoso...")} data-testid="menu-profile">Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Membuka preferensi pengguna...")} data-testid="menu-preferences">Preferensi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Anda berganti ke Shift 2 - Sore")} data-testid="menu-shift">Ganti Shift</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Sesi dikeluarkan...")} data-testid="menu-logout" className="text-[#B00020]">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
