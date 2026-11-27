import { useAuth } from "@/context/AuthContext";
import { BalanceCard } from "@/components/BalanceCard";
import { getWallet, getTransactions } from "@/api/walletApi";
import { getTasks } from "@/api/tasksApi";
import { Users, ListTodo, Gamepad2, DollarSign, ArrowRight, Bell, Gift, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, wallet: walletFromContext } = useAuth();
  const [wallet, setWallet] = useState<{ referralBalance: number; taskBalance: number; onehubBalance: number; bonusBalance: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/register?ref=${user?.username || ''}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Use wallet from context if available
    if (walletFromContext) {
      setWallet(walletFromContext as any);
    } else {
      // Load wallet from API if not in context
      const loadWallet = async () => {
        try {
          const walletRes = await getWallet();
          setWallet(walletRes.data.data);
        } catch (err) {
          console.error("Failed to load wallet:", err);
        }
      };
      loadWallet();
    }
  }, [walletFromContext]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, transactionsRes] = await Promise.all([
          getTasks(),
          getTransactions()
        ]);
        setTasks(tasksRes.data.data);
        setTransactions(transactionsRes.data.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };
    loadData();
  }, []);

  if (!user) return null;

  const displayName = user?.username || user?.email || 'User';
  const balances = wallet || { referralBalance: 0, taskBalance: 0, onehubBalance: 0, bonusBalance: 0 };
  const total = (balances.referralBalance ?? 0) + (balances.taskBalance ?? 0) + (balances.onehubBalance ?? 0) + (balances.bonusBalance ?? 0);
  const earnings = transactions.slice(0, 5);
  const availableTasks = tasks.filter((t: any) => !transactions.find((c: any) => c.task_id === t.id)).slice(0, 3);

  const card = "bg-white border border-black/[0.06] rounded-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

  return (
    <div className="px-4 pt-5 md:px-8 md:pt-8 max-w-5xl mx-auto">
      {/* Header with Welcome & Referral Link */}
      <div style={{ animationDelay: "0ms" }} className="rise flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">{displayName} 👋</h1>
        </div>
        <Link to="/history" className="h-11 w-11 rounded-full bg-white border border-black/[0.06] flex items-center justify-center cursor-pointer hover:border-black/15 transition">
          <Bell className="h-[18px] w-[18px] text-foreground/70" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 mb-4">
        {/* Balance Cards */}
        <div style={{ animationDelay: "60ms" }} className="rise grid grid-cols-3 gap-3">
          <BalanceCard className="col-span-3" label="Total Earnings" amount={total} variant="primary" icon={<DollarSign className="h-4 w-4 text-white" />} />
          <BalanceCard label="Referral" amount={balances.referralBalance ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
          <BalanceCard label="Tasks" amount={balances.taskBalance ?? 0} icon={<ListTodo className="h-4 w-4 text-muted-foreground" />} />
          <BalanceCard label="OneHub" amount={balances.onehubBalance ?? 0} variant="dark" icon={<Gamepad2 className="h-4 w-4 text-white" />} />
        </div>

        <div className="flex flex-col gap-4">
          {/* Referral link */}
          <div style={{ animationDelay: "120ms" }} className={`rise ${card} p-2 flex items-center gap-2`}>
            <input readOnly value={referralLink} className="flex-1 min-w-0 h-11 text-[13px] bg-transparent px-3 text-muted-foreground outline-none" />
            <button onClick={handleCopyLink} className="h-11 px-4 rounded-2xl bg-foreground text-white text-sm font-medium flex items-center gap-1.5 cursor-pointer hover:bg-foreground/90 active:scale-[0.98] transition">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ animationDelay: "180ms" }} className="rise grid grid-cols-3 gap-3 flex-1">
            {[
              { to: "/tasks", icon: <ListTodo className="h-5 w-5" />, label: "Tasks" },
              { to: "/onehub", icon: <Gamepad2 className="h-5 w-5" />, label: "Games" },
              { to: "/referrals", icon: <Users className="h-5 w-5" />, label: "Invite" },
            ].map(a => (
              <Link key={a.to} to={a.to} className={`${card} p-4 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated transition group`}>
                <div className="h-11 w-11 rounded-2xl bg-orange-50 flex items-center justify-center text-primary group-hover:gradient-primary group-hover:text-white transition-colors">{a.icon}</div>
                <span className="text-[13px] font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily Tasks Preview */}
        {availableTasks.length > 0 && (
          <div style={{ animationDelay: "240ms" }} className={`rise ${card} p-2`}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <h2 className="font-display text-lg font-semibold">Daily Tasks</h2>
              <Link to="/tasks" className="text-[13px] text-primary font-medium flex items-center gap-1 cursor-pointer">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {availableTasks.slice(0, 3).map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-3 py-3 ${i > 0 ? "border-t border-black/[0.05]" : ""}`}>
                <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-primary shrink-0"><ListTodo className="h-[18px] w-[18px]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-[13px] text-muted-foreground">Earn €{(t.reward ?? 0).toFixed(2)}</p>
                </div>
                <Link to="/tasks" className="h-9 px-4 rounded-full bg-foreground/[0.05] hover:bg-foreground hover:text-white text-[13px] font-medium grid place-items-center transition cursor-pointer">Go</Link>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div style={{ animationDelay: "300ms" }} className={`rise ${card} p-2 ${availableTasks.length > 0 ? "" : "lg:col-span-2"}`}>
          <h2 className="font-display text-lg font-semibold px-3 pt-3 pb-2">Recent Activity</h2>
          {earnings.length === 0 ? (
            <div className="px-3 pb-6 pt-4 text-center text-sm text-muted-foreground">
              No activity yet. Start completing tasks to earn!
            </div>
          ) : (
            earnings.map((e: any, i: number) => {
              const isDebit = ['WITHDRAWAL_REQUEST', 'VTU_PURCHASE'].includes(e.type);
              const sign = isDebit ? '-' : '+';
              return (
                <div key={e.id || e._id} className={`flex items-center justify-between gap-3 px-3 py-3 ${i > 0 ? "border-t border-black/[0.05]" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.type || e.activity}</p>
                    <p className="text-[13px] text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums px-2.5 py-1 rounded-full ${isDebit ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>{sign}€{Math.abs(e.amount).toFixed(2)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
