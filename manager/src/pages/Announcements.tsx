import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/api/announcementsApi";
import { Plus, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    image: "",
    ctaLink: "",
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data.data || []);
    } catch (error) {
      console.error("Failed to load announcements:", error);
      toast({ title: "Failed to load announcements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    try {
      await createAnnouncement({
        title: form.title,
        message: form.message,
        image: form.image,
        ctaLink: form.ctaLink
      });
      
      toast({ title: "Announcement created successfully" });
      setOpen(false);
      setForm({ title: "", message: "", image: "", ctaLink: "", active: true });
      loadAnnouncements();
    } catch (error) {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string, currentActive: boolean) => {
    try {
      await updateAnnouncement(id, { active: !currentActive });
      toast({ title: currentActive ? "Announcement deactivated" : "Announcement activated" });
      loadAnnouncements();
    } catch (error) {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      toast({ title: "Announcement deleted" });
    } catch (error) {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm">Manage platform announcements and promotions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary cursor-pointer">
              <Plus className="h-4 w-4 mr-1" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  placeholder="Announcement title" 
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input 
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })} 
                  placeholder="Announcement message" 
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input 
                  value={form.image} 
                  onChange={(e) => setForm({ ...form, image: e.target.value })} 
                  placeholder="https://example.com/image.jpg" 
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Link (optional)</Label>
                <Input 
                  value={form.ctaLink} 
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} 
                  placeholder="/tasks" 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.active} 
                  onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary cursor-pointer">
                Create Announcement
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
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>CTA Link</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No announcements found.
                  </TableCell>
                </TableRow>
              )}
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground">
                    {a.message}
                  </TableCell>
                  <TableCell>
                    {a.image ? (
                      <img 
                        src={a.image} 
                        alt="flyer" 
                        style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                    ) : 'No image'}
                  </TableCell>
                  <TableCell>
                    {a.ctaLink ? (
                      <a 
                        href={a.ctaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {a.ctaLink}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={a.active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"}>
                      {a.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer" 
                        onClick={() => handleDeactivate(a.id, a.active)}
                        title={a.active ? "Deactivate" : "Activate"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-destructive" 
                        onClick={() => handleDelete(a.id)}
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