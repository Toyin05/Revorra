import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getVTUTransactions, getNetworkConfigs, saveNetworkConfigs, addAdminLog } from "@/lib/adminData";
import { Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminVTUPage() {
  const [networks, setNetworks] = useState(getNetworkConfigs());
  const transactions = getVTUTransactions();
  const { toast } = useToast();

  const toggleNetwork = (name: string) => {
    const updated = networks.map(n => n.name === name ? { ...n, enabled: !n.enabled } : n);
    setNetworks(updated);
    saveNetworkConfigs(updated);
    addAdminLog("toggle_network", name);
    toast({ title: `${name} ${updated.find(n => n.name === name)?.enabled ? "enabled" : "disabled"}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">VTU Management</h1>
        <p className="text-muted-foreground text-sm">Manage networks and view transaction logs.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Networks</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {networks.map(n => (
              <div key={n.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{n.name}</span>
                </div>
                <Switch checked={n.enabled} onCheckedChange={() => toggleNetwork(n.name)} className="cursor-pointer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base">Transaction Logs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>User</TableHead><TableHead>Phone</TableHead><TableHead>Network</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {transactions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transactions yet.</TableCell></TableRow>}
              {transactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.user}</TableCell>
                  <TableCell>{t.phone}</TableCell>
                  <TableCell>{t.network}</TableCell>
                  <TableCell className="text-right">€{t.amount.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{t.type}</TableCell>
                  <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.date ? new Date(t.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
