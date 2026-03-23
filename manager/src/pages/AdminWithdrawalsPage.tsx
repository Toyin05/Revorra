import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWithdrawals, approveWithdrawal, rejectWithdrawal, markPaid } from "@/api/withdrawalAdminApi";
import { Check, X, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await getWithdrawals();
      setWithdrawals(res.data.data || []);
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
      toast({ title: "Failed to load withdrawals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: "approve" | "reject" | "paid") => {
    setProcessingId(id);
    try {
      if (action === "approve") {
        await approveWithdrawal(id);
        toast({ title: "Withdrawal approved" });
      } else if (action === "reject") {
        await rejectWithdrawal(id);
        toast({ title: "Withdrawal rejected" });
      } else if (action === "paid") {
        await markPaid(id);
        toast({ title: "Marked as paid" });
      }
      loadWithdrawals();
    } catch (error) {
      toast({ title: `Failed to ${action} withdrawal`, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "PENDING") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
    if (status === "APPROVED") return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    if (status === "PAID") return "bg-green-100 text-green-700 hover:bg-green-100";
    if (status === "REJECTED") return "bg-red-100 text-red-700 hover:bg-red-100";
    return "bg-muted text-muted-foreground";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return `€${typeof amount === 'number' ? amount.toFixed(2) : "0.00"}`;
  };

  const getUserEmail = (w: any) => {
    return w.user?.email || w.user_email || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Withdrawals</h1>
        <p className="text-muted-foreground text-sm">Review and manage withdrawal requests.</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Wallet Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No withdrawals yet.
                  </TableCell>
                </TableRow>
              )}
              {withdrawals.map((w: any) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    {getUserEmail(w)}
                  </TableCell>
                  <TableCell className="capitalize">{w.walletType || w.wallet_type || w.wallet || "-"}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(w.amount)}</TableCell>
                  <TableCell>{w.bankName || w.bank_name || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{w.accountNumber || w.account_number || "-"}</TableCell>
                  <TableCell>{w.accountName || w.account_name || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(w.status)}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(w.createdAt || w.created_at)}
                  </TableCell>
                  <TableCell>
                    {(w.status === "PENDING" || w.status === "pending") && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="cursor-pointer text-green-600 border-green-600 hover:bg-green-50" 
                          onClick={() => updateStatus(w.id, "approve")}
                          disabled={processingId === w.id}
                        >
                          {processingId === w.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="cursor-pointer text-red-600 border-red-600 hover:bg-red-50" 
                          onClick={() => updateStatus(w.id, "reject")}
                          disabled={processingId === w.id}
                        >
                          {processingId === w.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                    {(w.status === "APPROVED" || w.status === "approved") && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="cursor-pointer text-blue-600 border-blue-600 hover:bg-blue-50" 
                        onClick={() => updateStatus(w.id, "paid")}
                        disabled={processingId === w.id}
                      >
                        {processingId === w.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <DollarSign className="h-3 w-3 mr-1" />
                        )}
                        Mark as Paid
                      </Button>
                    )}
                    {(w.status === "PAID" || w.status === "paid" || w.status === "REJECTED" || w.status === "rejected") && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
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
