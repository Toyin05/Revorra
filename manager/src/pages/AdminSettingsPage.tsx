import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getPlatformSettings, savePlatformSettings, addAdminLog } from "@/lib/adminData";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(getPlatformSettings());
  const { toast } = useToast();

  const handleSave = () => {
    savePlatformSettings(settings);
    addAdminLog("update_settings", "platform");
    toast({ title: "Settings saved", description: "Platform settings have been updated." });
  };

  const fields = [
    { key: "welcome_bonus" as const, label: "Welcome Bonus (€)", desc: "Amount credited to new users' OneHub wallet" },
    { key: "referral_reward" as const, label: "Direct Referral Reward (€)", desc: "Earned when someone you invite registers" },
    { key: "indirect_referral_reward" as const, label: "Indirect Referral Reward (€)", desc: "Earned from second-level referrals" },
    { key: "min_withdrawal_referral" as const, label: "Min. Withdrawal – Referral (€)", desc: "Minimum balance to withdraw from referral wallet" },
    { key: "min_withdrawal_task" as const, label: "Min. Withdrawal – Task (€)", desc: "Minimum balance to withdraw from task wallet" },
    { key: "min_withdrawal_onehub" as const, label: "Min. Withdrawal – OneHub (€)", desc: "Minimum balance to withdraw from OneHub wallet" },
    { key: "game_attempts" as const, label: "Daily Game Attempts", desc: "How many times a user can play each game per day" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Platform Settings</h1>
        <p className="text-muted-foreground text-sm">Configure rewards, limits, and platform rules.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  step={f.key === "game_attempts" ? "1" : "0.1"}
                  value={settings[f.key]}
                  onChange={e => setSettings({ ...settings, [f.key]: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="gradient-primary cursor-pointer">
            <Save className="h-4 w-4 mr-1" /> Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
