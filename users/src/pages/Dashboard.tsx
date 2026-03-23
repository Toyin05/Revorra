import { useAuth } from "@/context/AuthContext";
import { BalanceCard } from "@/components/BalanceCard";
import { getTransactions } from "@/api/walletApi";
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

  const referralLink = `https://revorra.com/register?ref=${user?.username || ''}`;

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
    }
  }, [walletFromContext]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, transactionsRes] = await Promise.all([
          getTasks(),
          getTransactions()
        ]);
        // Only set wallet from API if we don't have it from context
        if (!walletFromContext) {
          const walletRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallet`).then(r => r.json());
          if (walletRes.data) {
            setWallet(walletRes.data);
          }
        }
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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header with Welcome & Referral Link */}
      <div className="bg-card border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-xl font-display font-bold">{displayName} 👋</h1>
          </div>
          <Link to="/history" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary/10 transition">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <input 
            readOnly 
            value={referralLink}
            className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground"
          />
          <button 
            onClick={handleCopyLink}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer hover:opacity-90 transition"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <BalanceCard label="Total Earnings" amount={total} variant="primary" icon={<DollarSign className="h-4 w-4 text-primary-foreground" />} />
        <BalanceCard label="Referral" amount={balances.referralBalance ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <BalanceCard label="Tasks" amount={balances.taskBalance ?? 0} icon={<ListTodo className="h-4 w-4 text-muted-foreground" />} />
        <BalanceCard label="OneHub" amount={balances.onehubBalance ?? 0} variant="dark" icon={<Gamepad2 className="h-4 w-4 text-primary-foreground" />} />
        <BalanceCard label="Welcome Bonus" amount={balances.bonusBalance ?? 0} icon={<Gift className="h-4 w-4 text-muted-foreground" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { to: "/tasks", icon: <ListTodo className="h-5 w-5" />, label: "Tasks" },
          { to: "/onehub", icon: <Gamepad2 className="h-5 w-5" />, label: "Games" },
          { to: "/referrals", icon: <Users className="h-5 w-5" />, label: "Invite" },
        ].map(a => (
          <Link key={a.to} to={a.to} className="bg-card border rounded-2xl p-4 text-center cursor-pointer hover:shadow-elevated transition group">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2 group-hover:scale-110 transition-transform">{a.icon}</div>
            <span className="text-xs font-medium">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Daily Tasks Preview */}
      {availableTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">Daily Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary font-medium flex items-center gap-1 cursor-pointer">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-2">
            {availableTasks.slice(0, 3).map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border rounded-xl p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ListTodo className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">Earn €{(t.reward ?? 0).toFixed(2)}</p>
                </div>
                <Link to="/tasks" className="text-xs text-primary font-medium cursor-pointer">Go</Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="font-display font-bold mb-3">Recent Activity</h2>
        {earnings.length === 0 ? (
          <div className="bg-card border rounded-xl p-6 text-center text-sm text-muted-foreground">
            No activity yet. Start completing tasks to earn!
          </div>
        ) : (
          <div className="space-y-2">
            {earnings.map((e: any) => {
              const isDebit = ['WITHDRAWAL_REQUEST', 'VTU_PURCHASE'].includes(e.type);
              const sign = isDebit ? '-' : '+';
              return (
                <div key={e.id || e._id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.type || e.activity}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-sm font-display font-bold ${isDebit ? 'text-red-500' : 'text-primary'}`}>{sign}€{Math.abs(e.amount).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
