import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BarChart3, Boxes
} from "lucide-react";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/inventory", icon: Boxes, label: "Inventory" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-slate-900 flex flex-col z-40">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">StockPilot</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-brand-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">v1.0.0</p>
      </div>
    </aside>
  );
}