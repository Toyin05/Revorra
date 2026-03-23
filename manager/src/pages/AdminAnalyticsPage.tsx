import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueStats } from "@/api/statsApi";
import { Users, TrendingUp, CheckCircle, Gamepad2, BarChart3, DollarSign, Wallet } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      const res = await getRevenueStats();
      setRevenue(res.data.data);
    } catch (error) {
      console.error("Failed to load revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: "Total Task Rewards Paid", value: `€${(revenue?.totalTaskRewards || 0).toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { label: "Total Referral Rewards", value: `€${(revenue?.totalReferralRewards || 0).toFixed(2)}`, icon: TrendingUp, color: "text-secondary" },
    { label: "Total Withdrawn", value: `€${(revenue?.totalWithdrawn || 0).toFixed(2)}`, icon: Wallet, color: "text-green-600" },
    { label: "Platform Profit", value: `€${(revenue?.platformProfit || 0).toFixed(2)}`, icon: BarChart3, color: "text-blue-500" },
  ];

  const walletBreakdown = [
    { label: "Task Wallet", value: `€${(revenue?.taskWallet || 0).toFixed(2)}`, pct: revenue?.taskWalletPct || 0 },
    { label: "Referral Wallet", value: `€${(revenue?.referralWallet || 0).toFixed(2)}`, pct: revenue?.referralWalletPct || 0 },
    { label: "OneHub Wallet", value: `€${(revenue?.onehubWallet || 0).toFixed(2)}`, pct: revenue?.onehubWalletPct || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Platform insights and performance metrics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className="shadow-card">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-xl font-display font-bold">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {walletBreakdown.map(w => (
            <div key={w.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{w.label}</span>
                <span className="text-muted-foreground">{w.value} ({w.pct}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${w.pct}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Total Users</span>
              <span className="font-medium">{revenue?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Active Tasks</span>
              <span className="font-medium">{revenue?.activeTasks || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Total Referrals</span>
              <span className="font-medium">{revenue?.totalReferrals || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Task Completions</span>
              <span className="font-medium">{revenue?.taskCompletions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Avg. User Balance</span>
              <span className="font-medium">€{revenue?.avgUserBalance?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Avg. Withdrawal</span>
              <span className="font-medium">€{revenue?.avgWithdrawal?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{revenue?.completionRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Coupon Usage</span>
              <span className="font-medium">{revenue?.couponUsage || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
