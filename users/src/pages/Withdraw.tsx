import { useAuth } from "@/context/AuthContext";
import { getWallet } from "@/api/walletApi";
import { requestWithdrawal, submitWithdrawal } from "@/api/withdrawalApi";
import { requestCoupon, uploadCouponProof, getUserCoupons, redeemCoupon } from "@/api/couponsApi";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wallet, Lock, X, Upload, ChevronDown, ChevronUp, Copy } from "lucide-react";
import BackButton from "@/components/BackButton";

const wallets = [
  { key: "referral" as const, label: "Referral Wallet", min: 35, balanceKey: "referralBalance" },
  { key: "task" as const, label: "Task Wallet", min: 89, balanceKey: "taskBalance" },
  { key: "onehub" as const, label: "OneHub Wallet", min: 16, balanceKey: "onehubBalance" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function WithdrawPage() {
  const { user, wallet: walletFromContext } = useAuth();
  const [balances, setBalances] = useState<{ referralBalance: number; taskBalance: number; onehubBalance: number } | null>(null);
  const [coupon, setCoupon] = useState("");
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [method, setMethod] = useState("bank");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Coupon request modal states
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponType, setCouponType] = useState<"REFERRAL" | "TASK" | "ONEHUB">("REFERRAL");
  const [couponRequesting, setCouponRequesting] = useState(false);
  const [couponPaymentInfo, setCouponPaymentInfo] = useState<{
    requestId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);
  
  // Coupon redemption states - using object for per-card state
  const [userCoupons, setUserCoupons] = useState<Array<{
    id: string;
    code: string;
    type: string;
    status: string;
    amount?: number;
    createdAt?: string;
    couponCode?: string;
    proofImage?: string;
  }>>([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [redeemInputs, setRedeemInputs] = useState<Record<string, string>>({});
  const [redeemLoading, setRedeemLoading] = useState<Record<string, boolean>>({});
  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(new Set());
  
  // View proof modal
  const [viewProofImage, setViewProofImage] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  
  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  
  // Payment proof upload states
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [proofImage, setProofImage] = useState<string>("");
  const [proofPreview, setProofPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use wallet from context if available
  const wallet = walletFromContext ?? balances ?? { referralBalance: 0, taskBalance: 0, onehubBalance: 0 };

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const res = await getWallet();
        setBalances(res.data.data);
      } catch (err) {
        console.error("Failed to load wallet:", err);
      }
    };
    if (!walletFromContext) {
      loadWallet();
    }
  }, [walletFromContext]);

  // Fetch user coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const res = await getUserCoupons();
        setUserCoupons(res.data.data || []);
      } catch (err) {
        console.error("Failed to load coupons:", err);
      } finally {
        setCouponLoading(false);
      }
    };
    loadCoupons();
  }, []);

  if (!user) return null;

  const handleRequestCoupon = async () => {
    setCouponRequesting(true);
    try {
      const res = await requestCoupon(couponType);
      const data = res.data.data;
      setCouponPaymentInfo({
        requestId: data.requestId,
        amount: data.amount,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });
      toast.success("Payment instructions ready");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request coupon");
    } finally {
      setCouponRequesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, JPG, and WebP are allowed.");
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProofImage(base64);
      setProofPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!proofImage) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    if (!couponPaymentInfo?.requestId) {
      toast.error("Invalid request");
      return;
    }

    setUploading(true);
    try {
      await uploadCouponProof(couponPaymentInfo.requestId, proofImage);
      setProofSubmitted(true);
      toast.success("Payment proof submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const handleRedeemCoupon = async (couponId: string, code: string) => {
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setRedeemLoading(prev => ({ ...prev, [couponId]: true }));
    try {
      await redeemCoupon(code.trim());
      setRedeemedCodes(prev => new Set(prev).add(code.trim()));
      setRedeemInputs(prev => ({ ...prev, [couponId]: "" }));
      toast.success("Withdrawal unlocked successfully!");
      
      // Refresh coupons list
      const res = await getUserCoupons();
      setUserCoupons(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to redeem coupon");
    } finally {
      setRedeemLoading(prev => ({ ...prev, [couponId]: false }));
    }
  };

  const handleCloseModal = () => {
    setCouponModalOpen(false);
    setCouponPaymentInfo(null);
    setShowUploadSection(false);
    setProofImage("");
    setProofPreview("");
    setProofSubmitted(false);
  };

  const handleIHavePaid = () => {
    setShowUploadSection(true);
  };

  const handleSubmitWithdrawal = async () => {
    setWithdrawLoading(true);
    setWithdrawError("");
    try {
      await submitWithdrawal({
        amount: parseFloat(withdrawAmount),
        method: 'bank_transfer',
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName
      });
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawAccountNumber("");
      setWithdrawAccountName("");
    } catch (err: any) {
      setWithdrawError(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdraw = async (walletKey: string, min: number) => {
    const balance = wallet[walletKey as keyof typeof wallet] ?? 0;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < min) { 
      toast.error(`Minimum withdrawal is €${min}`); 
      return; 
    }
    
    if (withdrawAmount > balance) { 
      toast.error("Insufficient balance"); 
      return; 
    }

    if (!coupon.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);
    try {
      await requestWithdrawal({
        walletType: walletKey,
        amount: withdrawAmount,
        method,
        bankName,
        accountNumber,
        accountName,
        couponCode: coupon,
      });
      
      toast.success(`Withdrawal request of €${withdrawAmount.toFixed(2)} submitted!`);
      setCoupon("");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setActiveWallet(null);
      
      // Refresh balances
      const res = await getWallet();
      setBalances(res.data.data);
    } catch (err: any) {
      console.error("Withdrawal failed:", err);
      toast.error(err.response?.data?.message || "Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">Withdraw</h1>
      <p className="text-sm text-muted-foreground mb-6">Cash out your earnings</p>

      {/* Request Coupon Button */}
      <button 
        onClick={() => setCouponModalOpen(true)}
        className="w-full mb-6 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition shadow-sm"
      >
        Request Coupon Code
      </button>

      {/* User Coupons Section */}
      {!couponLoading && userCoupons.length > 0 && (
        <div className="mb-6 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">Your Coupons</h3>
          <div className="space-y-3">
            {userCoupons.map((couponItem) => {
              const isRedeemed = redeemedCodes.has(couponItem.code);
              return (
                <div key={couponItem.id} className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground capitalize">{couponItem.type} Wallet</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${couponItem.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {couponItem.status === 'APPROVED' ? (isRedeemed ? 'Unlocked' : 'Ready') : couponItem.status}
                    </span>
                  </div>
                  {couponItem.status === 'APPROVED' && (
                    <>
                      <div className="bg-background rounded-lg p-2 mb-3">
                        <p className="text-xs text-muted-foreground">Your Coupon Code</p>
                        <p className="font-mono font-bold text-lg">{couponItem.code}</p>
                      </div>
                      {!isRedeemed ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={redeemInputs[couponItem.id] || ''}
                            onChange={(e) => setRedeemInputs(prev => ({ ...prev, [couponItem.id]: e.target.value }))}
                            placeholder="Enter coupon code"
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() => handleRedeemCoupon(couponItem.id, redeemInputs[couponItem.id] || '')}
                            disabled={redeemLoading[couponItem.id]}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                          >
                            {redeemLoading[couponItem.id] ? "..." : "Redeem"}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-green-600 font-medium">
                          ✓ Withdrawal Unlocked
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coupon Requests Dashboard */}
      <div className="mb-6 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <button 
          onClick={() => setShowRequests(!showRequests)}
          className="w-full flex items-center justify-between mb-4 cursor-pointer"
        >
          <h3 className="font-semibold text-sm">Coupon Requests</h3>
          {showRequests ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        {showRequests && (
          <>
            {couponLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : userCoupons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No coupon requests yet</p>
            ) : (
              <div className="space-y-3">
                {userCoupons.map((request) => (
                  <div key={request.id} className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground capitalize">{request.type} Wallet</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">₦{request.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {request.status === 'APPROVED' && request.couponCode && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '2px solid #22c55e',
                        borderRadius: '8px'
                      }}>
                        <p style={{fontSize: '12px', color: '#16a34a', fontWeight: '600', marginBottom: '6px'}}>
                          🎟️ Your Coupon Code:
                        </p>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <p style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            letterSpacing: '3px',
                            color: '#15803d',
                            flex: 1
                          }}>
                            {request.couponCode}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(request.couponCode || '');
                              toast.success('Coupon code copied to clipboard!');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        <p style={{fontSize: '11px', color: '#16a34a', marginTop: '4px'}}>
                          Use this code to unlock your withdrawal
                        </p>
                      </div>
                    )}
                    
                    {request.proofImage && (
                      <button
                        onClick={() => setViewProofImage(request.proofImage || null)}
                        className="text-xs text-primary hover:underline mt-2 cursor-pointer"
                      >
                        View Proof
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Wallet Balances - Read Only */}
      <div className="mb-6 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-4">Wallet Balances</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Referral</p>
            <p className="text-lg font-display font-bold text-primary">€{(wallet.referralBalance ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Task</p>
            <p className="text-lg font-display font-bold text-green-600">€{(wallet.taskBalance ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">OneHub</p>
            <p className="text-lg font-display font-bold text-blue-600">€{(wallet.onehubBalance ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      {userCoupons.some(c => c.status === 'REDEEMED') ? (
        <div className="mb-6 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-4">Withdraw to Bank</h3>
          {withdrawError && <p className="text-sm text-red-500 mb-3">{withdrawError}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
              <input 
                type="number" 
                placeholder="Enter amount in EUR"
                value={withdrawAmount} 
                onChange={e => setWithdrawAmount(e.target.value)} 
                className="w-full border border-border/50 rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Bank Name</label>
              <input 
                placeholder="Enter bank name"
                value={withdrawBankName} 
                onChange={e => setWithdrawBankName(e.target.value)} 
                className="w-full border border-border/50 rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Account Number</label>
              <input 
                placeholder="Enter account number"
                value={withdrawAccountNumber} 
                onChange={e => setWithdrawAccountNumber(e.target.value)} 
                className="w-full border border-border/50 rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Account Name</label>
              <input 
                placeholder="Enter account name"
                value={withdrawAccountName} 
                onChange={e => setWithdrawAccountName(e.target.value)} 
                className="w-full border border-border/50 rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              />
            </div>
          </div>
          <button 
            onClick={handleSubmitWithdrawal} 
            disabled={withdrawLoading}
            className="w-full mt-4 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
          >
            {withdrawLoading ? 'Processing...' : 'Submit Withdrawal Request'}
          </button>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <p className="font-semibold text-amber-800">Withdrawal Locked</p>
          <p className="text-sm text-amber-700 mt-1">Request and redeem a coupon to unlock withdrawal</p>
        </div>
      )}

      {/* Coupon Request Modal */}
      {couponModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold">
                {proofSubmitted ? "Success" : showUploadSection ? "Upload Payment Proof" : "Request Coupon Code"}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {proofSubmitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold text-lg mb-2">Payment proof submitted</p>
                <p className="text-sm text-muted-foreground">Awaiting admin approval</p>
              </div>
            ) : !couponPaymentInfo ? (
              <>
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">Select wallet type:</label>
                  <select 
                    value={couponType} 
                    onChange={e => setCouponType(e.target.value as "REFERRAL" | "TASK" | "ONEHUB")}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  >
                    <option value="REFERRAL">Referral Wallet</option>
                    <option value="TASK">Task Wallet</option>
                    <option value="ONEHUB">OneHub Wallet</option>
                  </select>
                </div>
                <button 
                  onClick={handleRequestCoupon} 
                  disabled={couponRequesting}
                  className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
                >
                  {couponRequesting ? "Processing..." : "Request Coupon"}
                </button>
              </>
            ) : !showUploadSection ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-center mb-3">Make Payment</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">₦{couponPaymentInfo.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-semibold">{couponPaymentInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-semibold">{couponPaymentInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-semibold">{couponPaymentInfo.accountName}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleIHavePaid} 
                  className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition"
                >
                  I Have Paid
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-center mb-3">Make Payment</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">₦{couponPaymentInfo.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-semibold">{couponPaymentInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-semibold">{couponPaymentInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-semibold">{couponPaymentInfo.accountName}</span>
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3">Upload Payment Screenshot</p>
                  
                  {!proofPreview ? (
                    <div className="text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm cursor-pointer hover:bg-muted/80 transition"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Screenshot
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">JPEG, PNG, JPG, WebP (max 5MB)</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <img 
                        src={proofPreview} 
                        alt="Payment proof preview" 
                        className="w-full h-40 object-contain rounded-lg bg-muted"
                      />
                      <button
                        onClick={() => { setProofImage(""); setProofPreview(""); }}
                        className="text-sm text-red-500 hover:underline cursor-pointer"
                      >
                        Remove and upload different image
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSubmitProof}
                  disabled={!proofImage || uploading}
                  className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Submit Payment Proof"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof Image Modal */}
      {viewProofImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewProofImage(null)}>
          <div className="bg-card rounded-2xl p-4 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Payment Proof</h3>
              <button onClick={() => setViewProofImage(null)} className="p-1 hover:bg-muted rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <img 
              src={viewProofImage} 
              alt="Payment proof" 
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
