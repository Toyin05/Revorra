import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Shield, LayoutDashboard, Users, ListTodo, Share2, Gamepad2, Wallet, Ticket, Phone, Bell, BarChart3, Settings, LogOut, Megaphone, ClipboardList } from "lucide-react";
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
  { to: "/admin/vtu", icon: Phone, label: "VTU" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const { logout, admin } = useAdminAuth();

  return (
    <div className="lg:hidden">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-gradient">Admin</span>
        </div>
        <button onClick={() => setOpen(!open)} className="cursor-pointer p-1">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      {open && (
        <div className="absolute inset-x-0 top-[57px] z-50 bg-card border-b shadow-elevated max-h-[80vh] overflow-y-auto">
          <nav className="p-3 space-y-0.5">
            {menuItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
