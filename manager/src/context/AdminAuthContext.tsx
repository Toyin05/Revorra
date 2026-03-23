import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface Admin {
  id: string;
  email: string;
  username: string;
  role: string;
  full_name?: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin on mount
    const storedAdmin = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("token");
    
    if (storedAdmin && storedToken) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Check if user is admin
        if (user.role !== "ADMIN") {
          return { success: false, error: "Not an admin account" };
        }

        // Save token
        localStorage.setItem("token", token);
        console.log('Token saved:', localStorage.getItem('token'));
        
        // Save user
        localStorage.setItem("admin", JSON.stringify(user));
        console.log('User saved:', localStorage.getItem('admin'));
        setAdmin(user);

        return { success: true };
      } else {
        return { success: false, error: response.data.message || "Login failed" };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
