import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./ui/bottom-nav";
import { NotificationPopup } from "./NotificationPopup";
import { AnnouncementPopup } from "./AnnouncementPopup";

export function DashboardLayout() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AppSidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <NotificationPopup />
      <AnnouncementPopup />
    </div>
  );
}
