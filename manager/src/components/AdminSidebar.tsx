import {
  LayoutDashboard, Users, ListTodo, Share2, Gamepad2, Wallet,
  Ticket, Phone, Bell, BarChart3, Settings, LogOut, Shield, Megaphone, ClipboardList
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

const menuItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/admin/sponsored", icon: Share2, label: "Sponsored Posts" },
  { to: "/admin/games", icon: Gamepad2, label: "Games Control" },
  { to: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
  { to: "/admin/coupons", icon: Ticket, label: "Coupons" },
  { to: "/admin/coupon-requests", icon: ClipboardList, label: "Coupon Requests" },
  { to: "/admin/vtu", icon: Phone, label: "VTU Management" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const { logout, admin } = useAdminAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-h-screen border-r bg-card">
      <div className="p-5 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-display font-bold text-gradient">Revorra Admin</h1>
        </div>
        {admin && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{admin.name} · {admin.role.replace("_", " ")}</p>
        )}
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "gradient-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
