import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings, getTWBalance } from "@/api/settingsApi";
import { Settings, Wallet, RefreshCw, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  
  // Settings state
  const [eurRate, setEurRate] = useState("1600");
  const [platformName, setPlatformName] = useState("Revorra");
  const [tokenDisplay, setTokenDisplay] = useState("");
  const [newToken, setNewToken] = useState("");
  
  // Balance state
  const [twBalance, setTwBalance] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      if (res.data.success) {
        setEurRate(res.data.data.eurToNgnRate || "1600");
        setPlatformName(res.data.data.platformName || "Revorra");
        setTokenDisplay(res.data.data.topupwizardToken || "");
      }
      // Also load TW balance
      loadTWBalance();
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTWBalance = async () => {
    setRefreshingBalance(true);
    try {
      const res = await getTWBalance();
      // Response is nested: res.data.data.data.funds
      const funds = res.data?.data?.data?.funds || res.data?.data?.funds || '0';
      setTwBalance(`₦${funds}`);
    } catch (error) {
      console.error("Failed to load TW balance:", error);
      setTwBalance("Failed to fetch");
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleSaveToken = async () => {
    if (!newToken.trim()) {
      toast({ title: "Please enter a new token", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ topupwizardToken: newToken });
      toast({ title: "Token saved successfully" });
      setNewToken("");
      loadSettings();
    } catch (error) {
      toast({ title: "Failed to save token", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEurRate = async () => {
    setSaving(true);
    try {
      await updateSettings({ eurToNgnRate: eurRate });
      toast({ title: "EUR Rate saved successfully" });
    } catch (error) {
      toast({ title: "Failed to save rate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformName = async () => {
    setSaving(true);
    try {
      await updateSettings({ platformName: platformName });
      toast({ title: "Platform name saved successfully" });
    } catch (error) {
      toast({ title: "Failed to save platform name", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Mask token for display (show last 4 chars)
  const getMaskedToken = (token: string) => {
    if (!token) return "No token set";
    if (token.length <= 4) return "****";
    return "****" + token.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage platform configurations and integrations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* TopupWizard Integration */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              TopupWizard Integration
            </CardTitle>
            <CardDescription>Manage your TopupWizard API credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Token Display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Token</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">
                {getMaskedToken(tokenDisplay)}
              </div>
            </div>

            {/* New Token Input */}
            <div className="space-y-2">
              <Label htmlFor="newToken">Enter New Token</Label>
              <div className="flex gap-2">
                <Input
                  id="newToken"
                  type="password"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Enter new TopupWizard API token"
                />
                <Button 
                  onClick={handleSaveToken}
                  disabled={saving || !newToken.trim()}
                  className="cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">TopupWizard Wallet Balance</Label>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold">
                  {twBalance !== null ? twBalance : "Unable to fetch"}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadTWBalance}
                  disabled={refreshingBalance}
                  className="cursor-pointer"
                >
                  {refreshingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Refresh Balance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Configuration */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Configuration
            </CardTitle>
            <CardDescription>General platform settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eurToNgnRate">EUR to NGN Rate</Label>
              <div className="flex gap-2">
                <Input
                  id="eurToNgnRate"
                  type="number"
                  value={eurRate}
                  onChange={(e) => setEurRate(e.target.value)}
                  placeholder="1600"
                />
                <Button 
                  onClick={handleSaveEurRate}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <div className="flex gap-2">
                <Input
                  id="platformName"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Revorra"
                />
                <Button 
                  onClick={handleSavePlatformName}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}