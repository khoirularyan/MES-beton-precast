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
import { useAuth } from "@/lib/auth";

export const Header = () => {
  const { user, logout } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out", { description: "You have successfully logged out of PrecastMES." });
  };

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
          <div className="text-[11px] uppercase tracking-wider text-[#59687A] leading-none">Active Shift</div>
          <div className="text-[13px] font-semibold text-[#107E3E] leading-tight">{company.shift}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
          <Input
            data-testid="global-search"
            placeholder="Search orders, products, customers..."
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
              <div className="text-sm font-semibold text-[#1C252E] font-display">Help & Documentation</div>
              <div className="text-[11px] text-[#59687A]">Resources for plant operators</div>
            </div>
            <div className="py-1">
              {[
                { icon: BookOpen, label: "User Guide", desc: "How to use MES modules" },
                { icon: FileText, label: "Operating Standards", desc: "Precast concrete production SOP" },
                { icon: Keyboard, label: "Keyboard Shortcuts", desc: "View all shortcuts" },
                { icon: MessageCircle, label: "Contact Support", desc: "support@precastmes.id" },
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
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Language set to English")} data-testid="setting-language">Language: English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Timezone: WIB (Asia/Jakarta)")} data-testid="setting-timezone">Timezone: WIB</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Theme: Light (SAP Fiori)")} data-testid="setting-theme">Theme: Light</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Opening account settings...")} data-testid="setting-account">Account Settings</DropdownMenuItem>
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
                <AvatarImage src="https://images.unsplash.com/photo-1603696774905-83ae340e2cae?crop=entropy&cs=srgb&fm=jpg&q=85&w=64" alt={user?.name ?? company.operator} />
                <AvatarFallback className="text-xs bg-[#0A6ED1] text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-[12px] font-medium text-[#1C252E] leading-tight">{user?.name ?? company.operator}</div>
                <div className="text-[10px] text-[#59687A] leading-tight">{user?.role_label ?? "Plant Manager"}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info(`Opening ${user?.name ?? company.operator}'s profile...`)} data-testid="menu-profile">Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Opening user preferences...")} data-testid="menu-preferences">Preferences</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("You switched to Shift 2 - Afternoon")} data-testid="menu-shift">Change Shift</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout" className="text-[#B00020]">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
