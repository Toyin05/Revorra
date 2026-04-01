import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, CheckCircle, Clock, Share2, TrendingUp } from "lucide-react";
import { getAdminStats } from "@/api/statsApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await getAdminStats();
        setStats(res.data.data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
    { label: "Total Tasks", value: stats?.totalTasks || 0, icon: DollarSign, color: "text-secondary" },
    { label: "Pending Approvals", value: stats?.pendingApprovals || 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Pending Withdrawals", value: stats?.pendingWithdrawals || 0, icon: Clock, color: "text-amber-500" },
    { label: "Total Transactions", value: stats?.totalTransactions || 0, icon: Share2, color: "text-blue-500" },
    { label: "Total Revenue", value: `€${(stats?.totalRevenue || 0).toFixed(2)}`, icon: TrendingUp, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Welcome back, {admin?.name}</h1>
        <p className="text-muted-foreground text-sm">Here's what's happening on Revorra today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                <p className="text-2xl font-display font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Total Users</span>
              <span className="font-medium">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Active Tasks</span>
              <span className="font-medium">{stats?.activeTasks || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Pending Withdrawals</span>
              <span className="font-medium">{stats?.pendingWithdrawals || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Task Completion Rate</span>
              <span className="font-medium">{stats?.completionRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Avg. Withdrawal</span>
              <span className="font-medium">€{stats?.avgWithdrawal?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b">
              <span className="text-muted-foreground">Total Coupons Used</span>
              <span className="font-medium">{stats?.couponsUsed || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
