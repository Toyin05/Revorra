import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User } from "@/lib/types";
import { register as registerApi, login as loginApi, getProfile } from "@/api/authApi";

interface AuthContextType {
  user: User | null;
  wallet: { referralBalance: number; taskBalance: number; onehubBalance: number } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { full_name: string; username: string; email: string; phone: string; password: string; referral_code?: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateWallet: (updates: { referralBalance?: number; taskBalance?: number; onehubBalance?: number }) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<{ referralBalance: number; taskBalance: number; onehubBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await getProfile();
          const data = res.data.data;
          setUser(data.user);
          setWallet(data.wallet);
        } catch (err) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginApi({ email, password });
      const token = res.data.data.token;
      const user = res.data.data.user;
      const wallet = res.data.data.wallet;
      localStorage.setItem("token", token);
      setUser(user);
      setWallet(wallet);
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  }, []);

  const register = useCallback(async (data: { full_name: string; username: string; email: string; phone: string; password: string; referral_code?: string }) => {
    try {
      const res = await registerApi({
        username: data.username,
        email: data.email,
        password: data.password,
        referralCode: data.referral_code || undefined,
        fullName: data.full_name,
        phone: data.phone,
      });
      const token = res.data.data.token;
      const user = res.data.data.user;
      const wallet = res.data.data.wallet;
      localStorage.setItem("token", token);
      setUser(user);
      setWallet(wallet);
      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const updateWallet = useCallback((updates: { referralBalance?: number; taskBalance?: number; onehubBalance?: number }) => {
    setWallet(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, wallet, login, register, logout, updateUser, updateWallet, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
