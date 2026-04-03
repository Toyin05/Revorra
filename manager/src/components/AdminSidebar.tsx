import {
  LayoutDashboard, Users, ListTodo, Share2, Gamepad2, Wallet,
  Ticket, Bell, BarChart3, Settings, LogOut, Shield, Megaphone, ClipboardList
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminNotificationBell from "@/components/ui/AdminNotificationBell";
import { getAdminNotifications } from "@/api/statsApi";
import { useState, useEffect } from "react";

const menuItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/admin/sponsored", icon: Share2, label: "Sponsored Posts" },
  { to: "/admin/games", icon: Gamepad2, label: "Games Control" },
  { to: "/admin/withdrawals", icon: Wallet, label: "Withdrawals", needsBadge: true },
  { to: "/admin/coupons", icon: Ticket, label: "Coupons" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const { logout, admin } = useAdminAuth();
  const [pendingCounts, setPendingCounts] = useState({ pendingTasks: 0, pendingWithdrawals: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await getAdminNotifications();
        if (res.data?.success) {
          setPendingCounts({
            pendingTasks: res.data.data?.pendingTasks || 0,
            pendingWithdrawals: res.data.data?.pendingWithdrawals || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending counts:", err);
      }
    };
    fetchCounts();
    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-h-screen border-r bg-card">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold text-gradient">Revorra Admin</h1>
          </div>
          <AdminNotificationBell />
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
            <span className="flex-1">{item.label}</span>
            {item.needsBadge && (item.to === "/admin/tasks" ? pendingCounts.pendingTasks : pendingCounts.pendingWithdrawals) > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1.5 animate-pulse">
                {item.to === "/admin/tasks" ? pendingCounts.pendingTasks : pendingCounts.pendingWithdrawals}
              </span>
            )}
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

