import Logo from "@/components/Logo";
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
    <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:sticky md:top-0 bg-white border-r border-black/[0.06]">
      <div className="px-6 pt-7 pb-6">
        <NavLink to="/dashboard" aria-label="Revorra" className="text-foreground inline-block"><Logo className="h-[14px]" /></NavLink>
        {user && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/[0.06] p-2.5"><div className="h-9 w-9 shrink-0 rounded-full gradient-primary grid place-items-center text-white text-sm font-semibold uppercase">{user.username?.[0]}</div><p className="text-sm font-medium truncate">@{user.username}</p></div>
        )}
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-orange-50 text-foreground [&>svg]:text-primary"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-black/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 h-10 rounded-full text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
