import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getGameSettings, saveGameSettings, addAdminLog } from "@/lib/adminData";
import { Gamepad2, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGamesPage() {
  const [settings, setSettings] = useState(getGameSettings());
  const { toast } = useToast();

  const update = (game: string, patch: any) => {
    const updated = { ...settings, [game]: { ...settings[game], ...patch } };
    setSettings(updated);
    saveGameSettings(updated);
    addAdminLog("update_game_settings", game);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Games Control</h1>
        <p className="text-muted-foreground text-sm">Manage game settings and reward probabilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(settings).map(([game, s]) => (
          <Card key={game} className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg capitalize">{game.replace("-", " ")}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{s.enabled ? "Enabled" : "Disabled"}</span>
                  <Switch checked={s.enabled} onCheckedChange={v => update(game, { enabled: v })} className="cursor-pointer" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Daily attempts per user</Label>
                <Input type="number" min={1} max={10} value={s.daily_attempts} onChange={e => update(game, { daily_attempts: parseInt(e.target.value) || 1 })} />
              </div>
              {game === "spin-win" && (
                <div className="space-y-2">
                  <Label>Reward values</Label>
                  <div className="flex flex-wrap gap-2">
                    {s.spin_rewards.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-sm">€{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => toast({ title: "Settings saved" })}>
                <RotateCw className="h-3 w-3 mr-1" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
