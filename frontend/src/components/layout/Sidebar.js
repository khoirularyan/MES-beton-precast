import { NavLink } from "react-router-dom";
import { navigationItems } from "@/data/mockData";
import {
  LayoutDashboard, Database, CalendarRange, ClipboardList, Factory,
  Thermometer, ShieldCheck, Package, ShoppingCart, Truck, ShoppingBag,
  Wrench, FileBarChart, ChevronLeft, ChevronRight, Workflow, GitBranch
} from "lucide-react";

const iconMap = {
  LayoutDashboard, Database, CalendarRange, ClipboardList, Factory,
  Thermometer, ShieldCheck, Package, ShoppingCart, Truck, ShoppingBag,
  Wrench, FileBarChart, Workflow, GitBranch
};

export const Sidebar = ({ collapsed, onToggle }) => {
  return (
    <aside
      data-testid="sidebar"
      className={`bg-white border-r border-[#DFE3E8] flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-[#DFE3E8]">
        <div className="w-8 h-8 bg-[#0A6ED1] rounded flex items-center justify-center flex-shrink-0">
          <Factory className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <div className="text-[13px] font-semibold text-[#1C252E] font-display leading-tight truncate">PrecastMES</div>
            <div className="text-[10px] text-[#59687A] uppercase tracking-wider">Manufacturing Suite</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {!collapsed && (
          <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">
            Modul Utama
          </div>
        )}
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/"}
              data-testid={`sidebar-nav-${item.id}`}
              className={({ isActive }) =>
                `flex items-center h-10 px-4 text-[13px] text-[#1C252E] hover:bg-[#F4F6F8] transition-colors ${
                  isActive ? "nav-active font-medium" : ""
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer toggle */}
      <button
        onClick={onToggle}
        data-testid="sidebar-toggle"
        className="h-10 border-t border-[#DFE3E8] flex items-center justify-center text-[#59687A] hover:bg-[#F4F6F8] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {!collapsed && <span className="ml-2 text-xs">Ciutkan</span>}
      </button>
    </aside>
  );
};

export default Sidebar;
