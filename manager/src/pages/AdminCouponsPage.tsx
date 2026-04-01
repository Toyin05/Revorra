import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCoupons, getCouponLink, updateCouponLink } from "@/api/couponAdminApi";
import { Copy, Ticket, Loader2, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [couponLink, setCouponLink] = useState("");
  const [newLink, setNewLink] = useState("");
  const [platform, setPlatform] = useState("whatsapp");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCoupons();
    loadCouponLink();
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

  const loadCouponLink = async () => {
    try {
      const res = await getCouponLink();
      setCouponLink(res.data.data?.link || "");
      setNewLink(res.data.data?.link || "");
    } catch (error) {
      console.error("Failed to load coupon link:", error);
    }
  };

  const handleUpdateLink = async () => {
    if (!newLink.trim()) {
      toast({ title: "Please enter a link", variant: "destructive" });
      return;
    }
    setSavingLink(true);
    try {
      let sanitizedLink = newLink.trim();
      if (sanitizedLink && !sanitizedLink.startsWith('http://') && !sanitizedLink.startsWith('https://')) {
        sanitizedLink = 'https://' + sanitizedLink;
      }
      await updateCouponLink(sanitizedLink);
      setCouponLink(sanitizedLink);
      setNewLink(sanitizedLink);
      toast({ title: "Coupon link updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update link", variant: "destructive" });
    } finally {
      setSavingLink(false);
    }
  };

  const handleGenerate = async () => {
    if (!email.trim()) {
      toast({ title: "Please enter user email", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ walletType: 'TASK', count: 1, email: email.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data && data.data.length > 0) {
        // Add the new coupon to state immediately
        const newCoupon = { ...data.data[0], generated_for: email };
        setCoupons([newCoupon, ...coupons]);
        toast({ title: `Coupon generated: ${data.data[0].code}` });
        setEmail("");
      } else {
        toast({ title: data.message || "Failed to generate coupon", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to generate coupon", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!" });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
      <div>
        <h1 className="text-2xl font-display font-bold">Coupon Management</h1>
        <p className="text-muted-foreground text-sm">Manage coupon request link and generate codes.</p>
      </div>

      {/* Section 1 - Request Link Manager */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Coupon Request Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Users will be redirected here when they click "Get Coupon Code"
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Platform</Label>
              <RadioGroup value={platform} onValueChange={setPlatform} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" className="cursor-pointer" />
                  <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="telegram" id="telegram" className="cursor-pointer" />
                  <Label htmlFor="telegram" className="cursor-pointer">Telegram</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" className="cursor-pointer" />
                  <Label htmlFor="other" className="cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-muted-foreground">Link</Label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {couponLink || "No link set"}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://wa.me/234xxxxxxxxx..."
                  className="flex-1"
                />
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Enter full link e.g. https://wa.me/2348012345678 or https://t.me/yourusername
                </p>
              </div>
              <Button 
                onClick={handleUpdateLink}
                disabled={savingLink}
                className="cursor-pointer"
              >
                {savingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Link"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Generate Coupon Codes */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Generate Coupon Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">User Email</Label>
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={generating}
              className="gradient-primary cursor-pointer w-full"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ticket className="h-4 w-4 mr-2" />}
              Generate Coupon Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Coupons List */}
      <div>
        <h2 className="text-xl font-display font-bold mb-4">Generated Coupons</h2>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No coupons generated yet.
                    </TableCell>
                  </TableRow>
                )}
                {coupons.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium text-lg">{c.code}</TableCell>
                    <TableCell>{c.generated_for || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(c.created_at || c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        onClick={() => copyToClipboard(c.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
