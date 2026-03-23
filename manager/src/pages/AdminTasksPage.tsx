import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask, getTasks, deleteTask } from "@/api/tasksAdminApi";
import { getPendingCompletions, approveCompletion, rejectCompletion } from "@/api/taskApprovalApi";
import { Plus, Pencil, Trash2, Power, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/types";

const TASK_TYPES = [
  { value: "SOCIAL_TASK", label: "Social Task" },
  { value: "EXTERNAL_LINK", label: "External Link" },
  { value: "SPONSORED_POST", label: "Sponsored Post" }
];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openCompletions, setOpenCompletions] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    link: "", 
    reward: "0.7", 
    taskType: "SOCIAL_TASK",
    proofRequired: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, completionsRes] = await Promise.all([
        getTasks(),
        getPendingCompletions()
      ]);
      setTasks(tasksRes.data.data || []);
      setCompletions(completionsRes.data.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.link) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    try {
      await createTask({
        title: form.title,
        description: form.description,
        reward: parseFloat(form.reward),
        taskType: form.taskType,
        link: form.link
      });
      
      toast({ title: "Task created successfully" });
      setOpen(false);
      setForm({ title: "", description: "", link: "", reward: "0.7", taskType: "SOCIAL_TASK", proofRequired: false });
      loadData();
    } catch (error) {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  };

  const handleApprove = async (completionId: string) => {
    try {
      await approveCompletion(completionId);
      toast({ title: "Completion approved" });
      loadData();
    } catch (error) {
      toast({ title: "Failed to approve", variant: "destructive" });
    }
  };

  const handleReject = async (completionId: string) => {
    try {
      await rejectCompletion(completionId);
      toast({ title: "Completion rejected" });
      loadData();
    } catch (error) {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Task Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage earning tasks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenCompletions(true)} className="cursor-pointer">
            Pending Approvals ({completions.length})
          </Button>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary cursor-pointer"><Plus className="h-4 w-4 mr-1" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" /></div>
                <div className="space-y-2"><Label>Link</Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Reward (€)</Label><Input type="number" step="0.1" value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={form.taskType} onValueChange={v => setForm({ ...form, taskType: v })}>
                      <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="cursor-pointer">{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full gradient-primary cursor-pointer">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Completions Dialog */}
      <Dialog open={openCompletions} onOpenChange={setOpenCompletions}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Pending Task Approvals</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {completions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending approvals</p>
            ) : (
              completions.map((completion: any) => (
                <Card key={completion.id} className="shadow-card">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{completion.user?.full_name || completion.user?.username || "User"}</p>
                        <p className="text-sm text-muted-foreground">{completion.task?.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="cursor-pointer bg-green-600 hover:bg-green-700" onClick={() => handleApprove(completion.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => handleReject(completion.id)}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                    {completion.proof && (
                      <div className="text-sm mt-2 p-2 bg-muted rounded-md">
                        <span className="text-muted-foreground font-medium">Proof: </span>
                        {completion.proof.startsWith("data:image") ? (
                          <div className="mt-2">
                            <img 
                              src={completion.proof} 
                              alt="User Proof" 
                              style={{
                                maxWidth: "300px",
                                borderRadius: "8px",
                                border: "1px solid #ddd"
                              }} 
                            />
                            <a 
                              href={completion.proof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block mt-2 text-primary hover:underline text-xs"
                            >
                              Open Full Image
                            </a>
                          </div>
                        ) : (
                          <a 
                            href={completion.proof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono"
                          >
                            {completion.proof}
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tasks found</TableCell></TableRow>}
              {tasks.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.link}</TableCell>
                  <TableCell className="text-right">€{typeof t.reward === 'number' ? t.reward.toFixed(2) : t.reward}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "active" ? "default" : "secondary"} className={t.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="cursor-pointer text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
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
