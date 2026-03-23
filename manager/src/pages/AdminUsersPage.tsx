import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "@/api/usersAdminApi";
import { getTopReferrers } from "@/api/referralAdminApi";
import { Eye, Ban, RotateCcw, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, referrersRes] = await Promise.all([
        getUsers(),
        getTopReferrers()
      ]);
      setUsers(usersRes.data.data || []);
      setTopReferrers(referrersRes.data.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string, userId: string) => {
    // These would call corresponding API endpoints
    toast({ title: `User ${action}`, description: `Action "${action}" performed successfully.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">View and manage all registered users.</p>
      </div>

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {topReferrers.slice(0, 5).map((ref: any, index: number) => (
                <div 
                  key={ref.id || index} 
                  className="flex-shrink-0 bg-muted rounded-lg p-3 text-center min-w-[120px]"
                >
                  <div className="text-lg font-bold text-amber-500">#{index + 1}</div>
                  <div className="font-medium text-sm">{ref.full_name || ref.username}</div>
                  <div className="text-xs text-muted-foreground">{ref.referrals_count || ref.referrals} refs</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Referral €</TableHead>
                <TableHead className="text-right">Task €</TableHead>
                <TableHead className="text-right">OneHub €</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>@{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    €{typeof u.referral_balance === 'number' ? u.referral_balance.toFixed(2) : u.referral_balance || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    €{typeof u.task_balance === 'number' ? u.task_balance.toFixed(2) : u.task_balance || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    €{typeof u.onehub_balance === 'number' ? u.onehub_balance.toFixed(2) : u.onehub_balance || "0.00"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        title="View" 
                        onClick={() => handleAction("view_user", u.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-destructive" 
                        title="Ban" 
                        onClick={() => handleAction("ban_user", u.id)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        title="Reset balances" 
                        onClick={() => handleAction("reset_balances", u.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
