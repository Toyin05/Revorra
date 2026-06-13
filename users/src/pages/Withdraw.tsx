import { useAuth } from "@/context/AuthContext";
import { getWallet, getTransactions } from "@/api/walletApi";
import { requestWithdrawal, getWithdrawals } from "@/api/withdrawalApi";
import { getCouponLink } from "@/api/settingsApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wallet, Lock, ExternalLink, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";

const WALLETS = [
  { key: "REFERRAL", label: "Referral", min: 35, color: "purple", icon: "€" },
  { key: "TASK", label: "Task", min: 89, color: "green", icon: "€" },
  { key: "ONEHUB", label: "OneHub", min: 16, color: "blue", icon: "€" },
];

const WALLET_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  REFERRAL: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", glow: "shadow-purple-500/20" },
  TASK: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", glow: "shadow-green-500/20" },
  ONEHUB: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", glow: "shadow-blue-500/20" },
};

export default function WithdrawPage() {
  const { user, wallet: walletFromContext } = useAuth();
  const [wallet, setWallet] = useState<{ referralBalance: number; taskBalance: number; onehubBalance: number } | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [couponLink, setCouponLink] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Get balance for selected wallet
  const getBalance = (key: string) => {
    if (!wallet) return 0;
    switch (key) {
      case "REFERRAL": return wallet.referralBalance;
      case "TASK": return wallet.taskBalance;
      case "ONEHUB": return wallet.onehubBalance;
      default: return 0;
    }
  };

  // Get min amount for selected wallet
  const getMinAmount = (key: string) => {
    const w = WALLETS.find(w => w.key === key);
    return w?.min || 0;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load wallet
        const walletRes = walletFromContext 
          ? { data: { data: walletFromContext } }
          : await getWallet();
        setWallet(walletRes.data.data);
        
        // Load coupon link
        try {
          const couponRes = await getCouponLink();
          setCouponLink(couponRes.data.data?.link || "");
        } catch {
          // If endpoint doesn't exist, use default
          setCouponLink("");
        }
        
        // Load withdrawal history
        const withdrawRes = await getWithdrawals();
        setWithdrawals(withdrawRes.data.data || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadData();
  }, [walletFromContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWallet) {
      toast.error("Please select a wallet");
      return;
    }
    
    const numAmount = parseFloat(amount);
    const minAmount = getMinAmount(selectedWallet);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (numAmount < minAmount) {
      toast.error(`Minimum withdrawal is €${minAmount} for ${selectedWallet} wallet`);
      return;
    }
    
    if (numAmount > getBalance(selectedWallet)) {
      toast.error("Insufficient balance");
      return;
    }
    
    if (!couponCode || couponCode.trim() === '') {
      toast.error('Coupon code is required. Please request a coupon code via WhatsApp or Telegram first.');
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Please fill all bank details");
      return;
    }
    
    setLoading(true);
    try {
      await requestWithdrawal({
        walletType: selectedWallet,
        amount: numAmount,
        couponCode: couponCode || undefined,
        method: "bank_transfer",
        bankName,
        accountNumber,
        accountName,
      });
      
      toast.success(`Withdrawal request of €${numAmount.toFixed(2)} submitted!`);
      
      // Reset form
      setAmount("");
      setCouponCode("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setSelectedWallet(null);
      
      // Refresh wallet
      const walletRes = await getWallet();
      setWallet(walletRes.data.data);
      
      // Refresh history
      const withdrawRes = await getWithdrawals();
      setWithdrawals(withdrawRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoupon = () => {
    if (!couponLink) return;

    let finalLink = couponLink.trim();

    // Ensure the link has a protocol
    if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
      finalLink = 'https://' + finalLink;
    }

    // Add prefilled message for WhatsApp
    if (finalLink.includes('wa.me')) {
      const message = encodeURIComponent(
        `Hello! I would like to request a coupon code for withdrawal on Revorra.\n\nUsername: ${user?.username}\nEmail: ${user?.email}\n\nPlease generate a coupon code for me. Thank you!`
      );
      finalLink = `${finalLink}?text=${message}`;
    }

    // For Telegram, open as-is (Telegram handles its own prefilled messages differently)

    window.open(finalLink, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case "APPROVED":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Approved</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{status || "Unknown"}</span>;
    }
  };

  const displayWallet = walletFromContext || wallet || { referralBalance: 0, taskBalance: 0, onehubBalance: 0 };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">Withdraw</h1>
      <p className="text-sm text-muted-foreground mb-6">Cash out your earnings</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Wallet Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Wallet</label>
          <div className="grid grid-cols-3 gap-3">
            {WALLETS.map((w) => {
              const isSelected = selectedWallet === w.key;
              const balance = w.key === "REFERRAL" ? displayWallet.referralBalance 
                : w.key === "TASK" ? displayWallet.taskBalance 
                : displayWallet.onehubBalance;
              const colors = WALLET_COLORS[w.key];
              
              return (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => setSelectedWallet(w.key)}
                  className={`
                    relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
                    ${isSelected 
                      ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow} scale-[1.02]` 
                      : "border-border hover:border-muted-foreground/30 bg-card"
                    }
                  `}
                >
                  <p className="text-xs text-muted-foreground mb-1">{w.label}</p>
                  <p className={`text-lg font-display font-bold ${isSelected ? colors.text : ""}`}>
                    €{(balance ?? 0).toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium mb-2 block">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded-xl px-4 py-3 pl-8 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>
          {selectedWallet && (
            <p className="text-xs text-muted-foreground mt-1">
              Min: €{getMinAmount(selectedWallet)} for {WALLETS.find(w => w.key === selectedWallet)?.label} wallet
            </p>
          )}
        </div>

        {/* Coupon Code */}
        <div>
          <label className="text-sm font-medium mb-2 block">Coupon Code</label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter your coupon code"
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            style={{ borderColor: !couponCode.trim() ? '#ef4444' : '#e5e7eb' }}
          />
          {!couponCode.trim() && (
            <p className="text-xs mt-1">
               Coupon code required — request one via WhatsApp/Telegram
            </p>
          )}
        </div>

        {/* Bank Details */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Enter bank name"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !couponCode.trim() || !amount || !bankName.trim() || !accountNumber.trim() || !accountName.trim()}
          className="w-full gradient-primary text-primary-foreground py-4 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            opacity: (loading || !couponCode.trim() || !amount || !bankName.trim() || !accountNumber.trim() || !accountName.trim()) ? 0.5 : 1,
            cursor: (loading || !couponCode.trim()) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>Cashout / Withdraw</>
          )}
        </button>
      </form>

      {/* Coupon Link Button */}
      {couponLink && (
        <button
          type="button"
          onClick={handleGetCoupon}
          className="w-full mt-4 border border-primary/30 bg-primary/5 rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:bg-primary/10 hover:border-primary/50 transition cursor-pointer"
        >
          <Lock className="h-4 w-4" />
          Don't have a coupon code? Request one now
          <ExternalLink className="h-4 w-4" />
        </button>
      )}

      {/* Withdrawal History */}
      <div className="mt-8">
        <h2 className="text-lg font-display font-bold mb-4">Withdrawal History</h2>
        {loadingHistory ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-card border rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No withdrawal history yet
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b bg-muted/50 text-xs font-semibold text-muted-foreground">
              <span className="col-span-2">Date</span>
              <span>Amount</span>
              <span>Wallet</span>
              <span>Status</span>
            </div>
            {withdrawals.map((w) => (
              <div key={w.id} className="grid grid-cols-5 gap-2 px-4 py-3 border-b last:border-0 text-sm">
                <span className="col-span-2 text-xs text-muted-foreground">
                  {w.createdAt ? new Date(w.createdAt).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  }) : '-'}
                </span>
                <span className="text-xs font-medium">€{(w.amount ?? 0).toFixed(2)}</span>
                <span className="text-xs capitalize text-muted-foreground">{w.walletType?.toLowerCase() || '-'}</span>
                <span>{getStatusBadge(w.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
