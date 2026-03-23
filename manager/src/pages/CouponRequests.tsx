import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCouponRequests, approveCouponRequest, rejectCouponRequest } from "@/api/couponRequestsApi";
import { Check, X, Image as ImageIcon, Loader2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CouponRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await getCouponRequests();
      console.log('Coupon requests response:', res.data);
      setRequests(res.data.data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast({ title: "Failed to load requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveCouponRequest(id);
      toast({ title: "Coupon generated" });
      loadRequests();
    } catch (error) {
      toast({ title: "Failed to approve", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectCouponRequest(id);
      toast({ title: "Request rejected" });
      loadRequests();
    } catch (error) {
      toast({ title: "Failed to reject", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "PENDING") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
    if (status === "APPROVED") return "bg-green-100 text-green-700 hover:bg-green-100";
    if (status === "REJECTED") return "bg-red-100 text-red-700 hover:bg-red-100";
    return "bg-muted text-muted-foreground";
  };

  const formatType = (type: string) => {
    if (!type) return "-";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Coupon Requests</h1>
        <p className="text-muted-foreground text-sm">Review and manage coupon generation requests.</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No requests found.
                  </TableCell>
                </TableRow>
              )}
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    <div className="text-sm">{req.user?.email || req.user_email || "-"}</div>
                    <div className="text-xs text-muted-foreground">ID: {req.userId || req.user_id || req.user?.id || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatType(req.type || req.coupon_type)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{typeof req.amount === 'number' ? req.amount.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell>
                    {(req.proofImage || req.proof_image || req.proof) ? (
                      <div className="flex flex-col items-start gap-2">
                        <img 
                          src={req.proofImage || req.proof_image || req.proof} 
                          alt="Proof" 
                          style={{ width: 200, borderRadius: 8 }}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setImagePreview(req.proofImage || req.proof_image || req.proof)}
                        />
                        <button 
                          onClick={() => setImagePreview(req.proofImage || req.proof_image || req.proof)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                        >
                          <Maximize2 className="h-3 w-3" />
                          Enlarge
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {req.status === "PENDING" ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer text-green-600"
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                        >
                          {processingId === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer text-destructive"
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                        >
                          {processingId === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full Screen Image Preview Modal */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Proof Image</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 min-h-[60vh]">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Proof"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                style={{ maxHeight: '80vh' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}