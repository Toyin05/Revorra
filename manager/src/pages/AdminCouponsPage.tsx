import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateCoupon, getCoupons } from "@/api/couponAdminApi";
import { Plus, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    code: "", 
    walletType: "referral", 
    uses: "1", 
    expiresAt: "2026-12-31" 
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const res = await getCoupons();
      setCoupons(res.data.data || []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast({ title: "Failed to load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateCoupon({
        code: form.code || undefined,
        walletType: form.walletType,
        uses: parseInt(form.uses) || 1,
        expiresAt: form.expiresAt
      });
      
      toast({ title: "Coupon generated successfully" });
      setOpen(false);
      setForm({ code: "", walletType: "referral", uses: "1", expiresAt: "2026-12-31" });
      loadCoupons();
    } catch (error) {
      toast({ title: "Failed to generate coupon", variant: "destructive" });
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      // API endpoint would be: deleteCoupon(id)
      // For now, we'll just update locally
      setCoupons(coupons.filter(c => c.id !== id));
      toast({ title: "Coupon deleted" });
    } catch (error) {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Coupon Management</h1>
          <p className="text-muted-foreground text-sm">Generate and manage withdrawal coupons.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary cursor-pointer">
              <Plus className="h-4 w-4 mr-1" /> Generate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Code (optional, auto-generate if empty)</Label>
                <Input 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value })} 
                  placeholder="Leave empty for auto-generate" 
                />
              </div>
              <div className="space-y-2">
                <Label>Wallet Type</Label>
                <Select value={form.walletType} onValueChange={v => setForm({ ...form, walletType: v })}>
                  <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral" className="cursor-pointer">Referral</SelectItem>
                    <SelectItem value="task" className="cursor-pointer">Task</SelectItem>
                    <SelectItem value="onehub" className="cursor-pointer">OneHub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={form.uses} 
                  onChange={e => setForm({ ...form, uses: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  type="date" 
                  value={form.expiresAt} 
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })} 
                />
              </div>
              <Button onClick={handleGenerate} className="w-full gradient-primary cursor-pointer">
                Generate Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No coupons.
                  </TableCell>
                </TableRow>
              )}
              {coupons.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell className="capitalize">{c.wallet_type || c.wallet}</TableCell>
                  <TableCell>{c.uses || c.max_uses}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.expires_at || c.expiry}
                  </TableCell>
                  <TableCell>
                    <Badge className={c.used ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700 hover:bg-green-100"}>
                      {c.used ? "Used" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        onClick={() => copyToClipboard(c.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-destructive" 
                        onClick={() => deleteCoupon(c.id)}
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
    </div>
  );
}
