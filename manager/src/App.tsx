import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";

import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminTasksPage from "./pages/AdminTasksPage";
import AdminSponsoredPage from "./pages/AdminSponsoredPage";
import AdminGamesPage from "./pages/AdminGamesPage";
import AdminWithdrawalsPage from "./pages/AdminWithdrawalsPage";
import AdminCouponsPage from "./pages/AdminCouponsPage";
import AdminVTUPage from "./pages/AdminVTUPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminSettingsPage from "./pages/AdminSettings";
import Announcements from "./pages/Announcements";
import CouponRequests from "./pages/CouponRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            
            {/* Admin Routes - Protected */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/tasks" element={<AdminTasksPage />} />
              <Route path="/admin/sponsored" element={<AdminSponsoredPage />} />
              <Route path="/admin/games" element={<AdminGamesPage />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              <Route path="/admin/vtu" element={<AdminVTUPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/announcements" element={<Announcements />} />
              <Route path="/admin/coupon-requests" element={<CouponRequests />} />
            </Route>

            {/* Redirect root to admin login */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
