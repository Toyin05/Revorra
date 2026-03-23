import {
  LayoutDashboard, ListTodo, Share2, Gamepad2, Users, Clock,
  Wallet, Phone, UserCircle, Settings, LogOut
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/sponsored", icon: Share2, label: "Sponsored Posts" },
  { to: "/onehub", icon: Gamepad2, label: "OneHub Games" },
  { to: "/referrals", icon: Users, label: "Referrals" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/withdraw", icon: Wallet, label: "Withdraw" },
  { to: "/vtu", icon: Phone, label: "VTU" },
  { to: "/profile", icon: UserCircle, label: "Profile" },
  { to: "/account-setup", icon: Settings, label: "Account Setup" },
];

export function AppSidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen border-r bg-card">
      <div className="p-5 border-b">
        <h1 className="text-xl font-display font-bold text-gradient">Revorra</h1>
        {user && (
          <p className="text-xs text-muted-foreground mt-1 truncate">@{user.username}</p>
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
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
