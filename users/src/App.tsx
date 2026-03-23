import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Sponsored from "./pages/Sponsored";
import OneHub from "./pages/OneHub";
import TicTacToe from "./pages/TicTacToe";
import SpinWin from "./pages/SpinWin";
import Referrals from "./pages/Referrals";
import History from "./pages/History";
import Withdraw from "./pages/Withdraw";
import VTU from "./pages/VTU";
import Profile from "./pages/Profile";
import AccountSetup from "./pages/AccountSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Dashboard - Protected */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/sponsored" element={<Sponsored />} />
              <Route path="/onehub" element={<OneHub />} />
              <Route path="/onehub/tic-tac-toe" element={<TicTacToe />} />
              <Route path="/onehub/spin-win" element={<SpinWin />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/history" element={<History />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/vtu" element={<VTU />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/account-setup" element={<AccountSetup />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
