import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMobileNav } from "./AdminMobileNav";

export function AdminLayout() {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminMobileNav />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
