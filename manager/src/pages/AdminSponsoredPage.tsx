import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTasks, createTask, deleteTask } from "@/api/tasksAdminApi";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSponsoredPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    shareLink: "", 
    shareMessage: "",
    reward: "0.5",
    dailyLimit: "1"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await getTasks();
      const allTasks = res.data.data || [];
      const sponsoredPosts = allTasks.filter((t: any) => t.taskType === "SPONSORED_POST");
      setPosts(sponsoredPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({ title: "Failed to load posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.shareLink) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    try {
      await createTask({
        title: form.title,
        description: form.description,
        reward: parseFloat(form.reward),
        taskType: "SPONSORED_POST",
        shareLink: form.shareLink,
        shareMessage: form.shareMessage,
        dailyLimit: parseInt(form.dailyLimit) || 1
      });
      
      toast({ title: "Sponsored post created successfully" });
      setOpen(false);
      setForm({ title: "", description: "", shareLink: "", shareMessage: "", reward: "0.5", dailyLimit: "1" });
      loadPosts();
    } catch (error) {
      toast({ title: "Failed to create post", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setPosts(posts.filter(p => p.id !== id));
      toast({ title: "Post deleted" });
    } catch (error) {
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading sponsored posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Sponsored Posts</h1>
          <p className="text-muted-foreground text-sm">Manage daily sponsored share posts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary cursor-pointer">
              <Plus className="h-4 w-4 mr-1" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Sponsored Post</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  placeholder="Post title" 
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Brief description" 
                />
              </div>
              <div className="space-y-2">
                <Label>Share Link</Label>
                <Input 
                  value={form.shareLink} 
                  onChange={e => setForm({ ...form, shareLink: e.target.value })} 
                  placeholder="https://..." 
                />
              </div>
              <div className="space-y-2">
                <Label>Share Message</Label>
                <Input 
                  value={form.shareMessage} 
                  onChange={e => setForm({ ...form, shareMessage: e.target.value })} 
                  placeholder="Message to share with post" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward (€)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={form.reward} 
                    onChange={e => setForm({ ...form, reward: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Limit</Label>
                  <Input 
                    type="number" 
                    value={form.dailyLimit} 
                    onChange={e => setForm({ ...form, dailyLimit: e.target.value })} 
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary cursor-pointer">
                Create Post
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
                <TableHead>Share Message</TableHead>
                <TableHead>Share Link</TableHead>
                <TableHead className="text-right">Reward</TableHead>
                <TableHead className="text-right">Daily Limit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No sponsored posts found.
                  </TableCell>
                </TableRow>
              )}
              {posts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {p.shareMessage || "-"}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {p.shareLink || p.link}
                  </TableCell>
                  <TableCell className="text-right">€{p.reward?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell className="text-right">{p.dailyLimit || 1}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="cursor-pointer text-destructive" 
                        onClick={() => handleDelete(p.id)}
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
