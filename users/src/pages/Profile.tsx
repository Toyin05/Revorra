import { useAuth } from "@/context/AuthContext";
import { LogOut, ChevronRight, User, Wallet, Settings, Clock, Share2, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getWallet } from "@/api/walletApi";
import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";

export default function ProfilePage() {
  const { user, logout, wallet: walletFromContext } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<{ referralBalance: number; taskBalance: number; onehubBalance: number; bonusBalance: number } | null>(null);
  
  useEffect(() => {
    const loadWallet = async () => {
      // Use wallet from context if available
      if (walletFromContext) {
        setWallet(walletFromContext as any);
      } else {
        try {
          const res = await getWallet();
          setWallet(res.data.data);
        } catch (err) {
          console.error("Failed to load wallet:", err);
        }
      }
    };
    loadWallet();
  }, [walletFromContext]);
  
  if (!user) return null;

  const balances = wallet || { referralBalance: 0, taskBalance: 0, onehubBalance: 0, bonusBalance: 0 };
  const total = (balances.referralBalance ?? 0) + (balances.taskBalance ?? 0) + (balances.onehubBalance ?? 0) + (balances.bonusBalance ?? 0);
  const displayName = user?.username || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const menuItems = [
    { icon: <Wallet className="h-4 w-4" />, label: "Withdraw", to: "/withdraw" },
    { icon: <Clock className="h-4 w-4" />, label: "History", to: "/history" },
    { icon: <Share2 className="h-4 w-4" />, label: "Sponsored Posts", to: "/sponsored" },
    { icon: <Settings className="h-4 w-4" />, label: "Account Setup", to: "/account-setup" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      {/* Profile Card */}
      <div className="bg-card border rounded-2xl p-5 mb-6 text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
          {initials}
        </div>
        <h2 className="font-display font-bold text-lg">{displayName}</h2>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        <div className="mt-4 p-3 bg-muted rounded-xl">
          <p className="text-xs text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-display font-bold text-primary">€{total.toFixed(2)}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-card border rounded-2xl overflow-hidden mb-6">
        {menuItems.map((item, i) => (
          <Link key={i} to={item.to} className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition">
            <div className="text-muted-foreground">{item.icon}</div>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <button
        onClick={() => { logout(); navigate("/"); }}
        className="w-full flex items-center justify-center gap-2 border-2 border-destructive text-destructive py-3 rounded-xl font-semibold cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
