import { Home, ListTodo, Gamepad2, Users, User, Phone } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/vtu", icon: Phone, label: "VTU" },
  { to: "/onehub", icon: Gamepad2, label: "OneHub" },
  { to: "/referrals", icon: Users, label: "Referrals" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden rounded-[22px] bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around p-1.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors cursor-pointer rounded-2xl",
                isActive ? "text-primary bg-orange-50" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
