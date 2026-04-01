import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getNotifications, saveNotifications, addAdminLog, type AdminNotification } from "@/lib/adminData";
import { Plus, Pencil, Trash2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<AdminNotification[]>(getNotifications());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNotification | null>(null);
  const [form, setForm] = useState({ title: "", description: "", image: "", button_text: "", button_link: "", type: "popup" as AdminNotification["type"] });
  const { toast } = useToast();

  const save = (updated: AdminNotification[]) => { setNotifs(updated); saveNotifications(updated); };

  const handleSubmit = () => {
    if (!form.title) return;
    if (editing) {
      save(notifs.map(n => n.id === editing.id ? { ...n, ...form } : n));
      addAdminLog("edit_notification", editing.id);
    } else {
      const nn: AdminNotification = { id: crypto.randomUUID(), ...form, active: true, created_at: new Date().toISOString() };
      save([nn, ...notifs]);
      addAdminLog("create_notification", nn.id);
    }
    toast({ title: editing ? "Notification updated" : "Notification created" });
    setOpen(false); setEditing(null); setForm({ title: "", description: "", image: "", button_text: "", button_link: "", type: "popup" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">Manage announcements and popups.</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button className="gradient-primary cursor-pointer"><Plus className="h-4 w-4 mr-1" /> Create</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Notification</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Image URL (optional)</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Button Text</Label><Input value={form.button_text} onChange={e => setForm({ ...form, button_text: e.target.value })} /></div>
                <div className="space-y-2"><Label>Button Link</Label><Input value={form.button_link} onChange={e => setForm({ ...form, button_link: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as AdminNotification["type"] })}>
                  <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popup" className="cursor-pointer">Popup</SelectItem>
                    <SelectItem value="banner" className="cursor-pointer">Banner</SelectItem>
                    <SelectItem value="broadcast" className="cursor-pointer">Broadcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary cursor-pointer">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Active</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {notifs.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{n.type}</Badge></TableCell>
                  <TableCell><Switch checked={n.active} onCheckedChange={v => save(notifs.map(x => x.id === n.id ? { ...x, active: v } : x))} className="cursor-pointer" /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => { setEditing(n); setForm({ title: n.title, description: n.description, image: n.image || "", button_text: n.button_text || "", button_link: n.button_link || "", type: n.type }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="cursor-pointer text-destructive" onClick={() => { save(notifs.filter(x => x.id !== n.id)); toast({ title: "Deleted" }); }}><Trash2 className="h-4 w-4" /></Button>
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
