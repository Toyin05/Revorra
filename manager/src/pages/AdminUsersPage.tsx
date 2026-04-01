import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getUsers, getUserDetails, suspendUser, deleteUser } from "@/api/usersAdminApi";
import { getTopReferrers } from "@/api/referralAdminApi";
import { Eye, Ban, Trash2, Trophy, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  const handleViewUser = async (userId: string) => {
    try {
      const res = await getUserDetails(userId);
      setSelectedUser(res.data.data);
      setUserDetailsOpen(true);
    } catch (error) {
      toast({ title: "Failed to load user details", variant: "destructive" });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setProcessingId(userId);
    try {
      await suspendUser(userId);
      toast({ title: "User status updated" });
      loadData();
    } catch (error) {
      toast({ title: "Failed to update user status", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setProcessingId(userToDelete.id);
    try {
      await deleteUser(userToDelete.id);
      toast({ title: "User deleted successfully" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadData();
    } catch (error) {
      toast({ title: "Failed to delete user", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Referral €</TableHead>
                <TableHead className="text-right">Task €</TableHead>
                <TableHead className="text-right">OneHub €</TableHead>
                <TableHead>Status</TableHead>
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
<TableCell className="font-medium">
                      @{u.username}
                    </TableCell>
                   <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(u.createdAt || u.created_at)}
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
                    {u.isSuspended ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        title="View Details" 
                        onClick={() => handleViewUser(u.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-orange-600" 
                        title={u.isSuspended ? "Unsuspend" : "Suspend"} 
                        onClick={() => handleSuspendUser(u.id)}
                        disabled={processingId === u.id}
                      >
                        {processingId === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-destructive" 
                        title="Delete User" 
                        onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">@{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt || selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={selectedUser.isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                    {selectedUser.isSuspended ? "Suspended" : "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referrals</p>
                  <p className="font-medium">{selectedUser.referrals_count || selectedUser.referrals || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="font-medium">{selectedUser.tasks_completed_count || selectedUser.tasks_completed || 0}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Wallet Balances</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Referral €</p>
                    <p className="font-bold">€{selectedUser.referral_balance?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Task €</p>
                    <p className="font-bold">€{selectedUser.task_balance?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">OneHub €</p>
                    <p className="font-bold">€{selectedUser.onehub_balance?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Earnings</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="font-medium">€{selectedUser.total_earned?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Referral Earnings</p>
                    <p className="font-medium">€{selectedUser.referral_earnings?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete user <span className="font-medium">@{userToDelete?.username}</span>? 
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {processingId === userToDelete?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
