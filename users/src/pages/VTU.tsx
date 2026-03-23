import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getWallet, purchaseAirtime, purchaseData, getVTUHistory, getDataPlans, validateMobile } from "@/api/vtuApi";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";

const networks = [
  {
    id: 'MTN',
    name: 'MTN',
    color: '#FFC220',
    textColor: '#000000',
    svg: (
      <svg viewBox="0 0 100 100" width="32" height="32">
        <circle cx="50" cy="50" r="50" fill="#FFC220"/>
        <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#000000" fontFamily="Arial">MTN</text>
      </svg>
    )
  },
  {
    id: 'AIRTEL',
    name: 'Airtel',
    color: '#FF0000',
    textColor: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 100 100" width="32" height="32">
        <circle cx="50" cy="50" r="50" fill="#FF0000"/>
        <text x="50" y="62" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">airtel</text>
      </svg>
    )
  },
  {
    id: 'GLO',
    name: 'Glo',
    color: '#006600',
    textColor: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 100 100" width="32" height="32">
        <circle cx="50" cy="50" r="50" fill="#006600"/>
        <text x="50" y="62" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">glo</text>
      </svg>
    )
  },
  {
    id: '9MOBILE',
    name: '9mobile',
    color: '#006B54',
    textColor: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 100 100" width="32" height="32">
        <circle cx="50" cy="50" r="50" fill="#006B54"/>
        <text x="50" y="58" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">9</text>
        <text x="50" y="75" textAnchor="middle" fontSize="16" fill="#FFFFFF" fontFamily="Arial">mobile</text>
      </svg>
    )
  }
];

// Airtime amounts in Naira with Euro conversion
const AIRTIME_AMOUNTS = [
  { naira: 100, euro: 100 / 1600 },
  { naira: 200, euro: 200 / 1600 },
  { naira: 500, euro: 500 / 1600 },
  { naira: 1000, euro: 1000 / 1600 },
  { naira: 2000, euro: 2000 / 1600 },
  { naira: 5000, euro: 5000 / 1600 },
];

// Data plan type from API
interface DataPlan {
  serviceID: number;
  description: string;
  amount: string;
}

// Transaction type
interface VTUTransaction {
  id: string;
  type: string;
  phone: string;
  amount: number;
  amountNGN?: number;
  status: string;
  createdAt: string;
  network: string;
}

export default function VTUPage() {
  const { wallet: walletFromContext } = useAuth();
  const [tab, setTab] = useState<"airtime" | "data">("airtime");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  
  // Data plans
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // History
  const [history, setHistory] = useState<VTUTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await getWallet();
        setBalance(res.data.data?.onehubBalance || walletFromContext?.onehubBalance || 0);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
        setBalance(walletFromContext?.onehubBalance || 0);
      }
    };
    fetchBalance();
  }, [walletFromContext]);

  // Fetch data plans when network changes on Data tab
  useEffect(() => {
    if (tab === "data" && network) {
      const fetchPlans = async () => {
        setLoadingPlans(true);
        setDataPlans([]);
        setSelectedPlan(null);
        try {
          const res = await getDataPlans(network);
          if (res.data.status === "success" && res.data.data) {
            setDataPlans(res.data.data);
          } else {
            // Fallback plans
            setDataPlans(getFallbackPlans(network));
          }
        } catch (err) {
          // Fallback plans on error
          setDataPlans(getFallbackPlans(network));
        } finally {
          setLoadingPlans(false);
        }
      };
      fetchPlans();
    }
  }, [tab, network]);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await getVTUHistory();
        if (res.data.success && res.data.data) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const getNetworkColor = (netId: string) => {
    const net = NETWORKS.find(n => n.id === netId);
    return net?.color || "#6B7280";
  };

  const handleBuy = async () => {
    if (!network) { toast.error("Please select a network"); return; }
    if (!phone) { toast.error("Please enter phone number"); return; }

    setLoading(true);
    try {
      let response;
      
      if (tab === "airtime") {
        // Use custom amount if entered, otherwise use selected amount
        const nairaAmount = customAmount ? parseInt(customAmount) : (parseInt(amount) || 0);
        if (!nairaAmount || nairaAmount <= 0) { toast.error("Please select or enter amount"); setLoading(false); return; }
        
        // Convert to euros: eurAmount = ngnAmount / 1600
        const euroAmount = nairaAmount / 1600;
        
        response = await purchaseAirtime({
          network: network.toUpperCase(),
          phoneNumber: phone,
          amount: euroAmount
        });
        
        toast.success(response.data.message || `Airtime purchase successful! ₦${nairaAmount}`);
      } else {
        // Data
        if (!selectedPlan) { toast.error("Please select a data plan"); setLoading(false); return; }
        
        response = await purchaseData({
          network: network.toUpperCase(),
          phoneNumber: phone,
          serviceID: selectedPlan.serviceID,
          planName: selectedPlan.description,
          amountNGN: parseInt(selectedPlan.amount)
        });
        
        toast.success(response.data.message || `Data purchase successful! ₦${selectedPlan.amount}`);
      }
      
      // Refresh balance
      const res = await getWallet();
      setBalance(res.data.data?.onehubBalance || 0);
      
      // Refresh history
      const histRes = await getVTUHistory();
      if (histRes.data.success && histRes.data.data) {
        setHistory(histRes.data.data);
      }
      
      // Reset form
      setPhone("");
      setAmount("");
      setCustomAmount("");
      setSelectedPlan(null);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAmount = (naira: number) => {
    setAmount(naira.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setAmount("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatNaira = (naira: number) => `₦${naira.toLocaleString()}`;
  const formatEuro = (euro: number) => `€${euro.toFixed(2)}`;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">VTU</h1>
      <p className="text-sm text-muted-foreground mb-6">Buy airtime or data</p>

      {/* OneHub Balance */}
      <div className="bg-card border rounded-2xl p-4 mb-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OneHub Balance</span>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
          </div>
        </div>
        <span className="text-2xl font-display font-bold">€{balance.toFixed(2)}</span>
      </div>

      <div className="bg-card border rounded-2xl p-5">
        <div className="flex gap-2 mb-5">
          {(["airtime", "data"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize cursor-pointer transition ${
                tab === t ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Network Selection */}
          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">Network</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {networks.map(n => (
                <button
                  key={n.id}
                  onClick={() => setNetwork(n.id.toLowerCase())}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: network === n.id.toLowerCase() 
                      ? `3px solid ${n.color}` 
                      : '2px solid #e5e7eb',
                    backgroundColor: network === n.id.toLowerCase() 
                      ? `${n.color}15` 
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: network === n.id.toLowerCase() 
                      ? `0 4px 12px ${n.color}40` 
                      : '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {n.svg}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: network === n.id.toLowerCase() ? n.color : '#374151'
                  }}>
                    {n.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-medium mb-1 block text-muted-foreground">Phone Number</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="08012345678" 
            />
          </div>

          {/* Airtime Amounts */}
          {tab === "airtime" && (
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Amount</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {AIRTIME_AMOUNTS.map(({ naira, euro }) => (
                  <button
                    key={naira}
                    onClick={() => handleSelectAmount(naira)}
                    className={`py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      amount === naira.toString()
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {formatNaira(naira)} ({formatEuro(euro)})
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                value={customAmount}
                onChange={e => handleCustomAmountChange(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
                placeholder="Or enter custom amount (Naira)" 
              />
              {customAmount && (
                <p className="text-xs text-muted-foreground mt-1">
                  = {formatEuro(parseInt(customAmount) / 1600)}
                </p>
              )}
            </div>
          )}

          {/* Data Plans */}
          {tab === "data" && (
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">
                Data Plan {loadingPlans && <Loader2 className="inline h-3 w-3 animate-spin" />}
              </label>
              {dataPlans.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {dataPlans.map(plan => (
                    <button
                      key={plan.serviceID}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3 rounded-xl text-left transition cursor-pointer border ${
                        selectedPlan?.serviceID === plan.serviceID
                          ? "border-primary bg-primary/10"
                          : "bg-muted hover:bg-muted/80 border-transparent"
                      }`}
                    >
                      <p className="text-sm font-medium">{plan.description}</p>
                      <p className="text-xs text-muted-foreground">{formatNaira(parseInt(plan.amount))}</p>
                    </button>
                  ))}
                </div>
              ) : !loadingPlans && network ? (
                <p className="text-sm text-muted-foreground text-center py-4">No plans available</p>
              ) : null}
            </div>
          )}

          {/* Buy Button */}
          <button 
            onClick={handleBuy} 
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Buy {tab === "airtime" ? "Airtime" : "Data"}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
        {loadingHistory ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {history.map(tx => (
              <div key={tx.id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getNetworkColor(tx.network?.toLowerCase()) }}
                  >
                    {tx.network?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type} • {tx.network}</p>
                    <p className="text-xs text-muted-foreground">{tx.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {tx.amountNGN ? formatNaira(tx.amountNGN) : formatEuro(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                    tx.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tx.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback data plans when API not implemented
function getFallbackPlans(network: string): DataPlan[] {
  const plans: Record<string, DataPlan[]> = {
    mtn: [
      { serviceID: 101, description: "MTN 10MB", amount: "100" },
      { serviceID: 102, description: "MTN 100MB", amount: "200" },
      { serviceID: 103, description: "MTN 500MB", amount: "500" },
      { serviceID: 104, description: "MTN 1GB", amount: "1000" },
      { serviceID: 105, description: "MTN 2GB", amount: "2000" },
      { serviceID: 106, description: "MTN 5GB", amount: "5000" },
    ],
    airtel: [
      { serviceID: 201, description: "Airtel 10MB", amount: "100" },
      { serviceID: 202, description: "Airtel 100MB", amount: "200" },
      { serviceID: 203, description: "Airtel 500MB", amount: "500" },
      { serviceID: 204, description: "Airtel 1GB", amount: "1000" },
      { serviceID: 205, description: "Airtel 2GB", amount: "2000" },
      { serviceID: 206, description: "Airtel 5GB", amount: "5000" },
    ],
    glo: [
      { serviceID: 301, description: "Glo 10MB", amount: "100" },
      { serviceID: 302, description: "Glo 100MB", amount: "200" },
      { serviceID: 303, description: "Glo 500MB", amount: "500" },
      { serviceID: 304, description: "Glo 1GB", amount: "1000" },
      { serviceID: 305, description: "Glo 2GB", amount: "2000" },
      { serviceID: 306, description: "Glo 5GB", amount: "5000" },
    ],
    "9mobile": [
      { serviceID: 401, description: "9Mobile 10MB", amount: "100" },
      { serviceID: 402, description: "9Mobile 100MB", amount: "200" },
      { serviceID: 403, description: "9Mobile 500MB", amount: "500" },
      { serviceID: 404, description: "9Mobile 1GB", amount: "1000" },
      { serviceID: 405, description: "9Mobile 2GB", amount: "2000" },
      { serviceID: 406, description: "9Mobile 5GB", amount: "5000" },
    ],
  };
  return plans[network] || plans.mtn;
}
