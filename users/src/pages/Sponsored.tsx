import { useAuth } from "@/context/AuthContext";
import { getTasks, completeTask } from "@/api/tasksApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Share2, Clock, CheckCircle2, XCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

interface SponsoredTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  taskType: string;
  shareLink: string;
  shareMessage: string;
  status?: string;
}

export default function SponsoredPage() {
  const { user, refreshWallet } = useAuth();
  const [tasks, setTasks] = useState<SponsoredTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Map<string, string>>(new Map());

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasks();
      const allTasks = res.data.data;
      
      // Filter only SPONSORED_POST tasks
      const sponsored = allTasks.filter((t: any) => t.taskType === "SPONSORED_POST");
      
      // Get completion status
      const completedMap = new Map<string, string>();
      sponsored.forEach((t: any) => {
        if (t.status === "completed" || t.is_completed) {
          completedMap.set(t.id, "approved");
        } else if (t.status === "pending") {
          completedMap.set(t.id, "pending");
        } else if (t.status === "rejected") {
          completedMap.set(t.id, "rejected");
        }
      });
      
      setTasks(sponsored);
      setCompletedTasks(completedMap);
    } catch (err) {
      console.error("Failed to load sponsored tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (!user) return null;

  const getStatus = (taskId: string) => completedTasks.get(taskId);
  const isCompleted = (taskId: string) => completedTasks.has(taskId);

  const handleShare = (task: SponsoredTask) => {
    const shareText = task.shareMessage || "Check out this post!";
    const shareUrl = task.shareLink || "";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(whatsappUrl, "_blank");

    // Auto-complete the task after sharing
    if (!isCompleted(task.id)) {
      completeTask(task.id, 'auto-approved').then(res => {
        const updatedWallet = res.data.data.wallet;
        if (updatedWallet) {
          refreshWallet(updatedWallet);
        }
        setCompletedTasks(new Map(completedTasks.set(task.id, "approved")));
        toast.success("Task completed! Balance updated.");
        setTasks(prev => prev.filter(t => t.id !== task.id));
      }).catch(() => {
        // Silently fail - task might already be completed
      });
    }
  };

  const renderStatusBadge = (taskId: string) => {
    const status = getStatus(taskId);
    if (!status) return null;

    if (status === "approved") {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-2">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </div>
      );
    }
    if (status === "pending") {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium mt-2">
          <Clock className="h-3 w-3" />
          Pending Approval
        </div>
      );
    }
    if (status === "rejected") {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600 font-medium mt-2">
          <XCircle className="h-3 w-3" />
          Rejected - Try Again
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-display font-bold mb-1">Sponsored Posts</h1>
        <p className="text-sm text-muted-foreground mb-6">Share to WhatsApp and earn rewards</p>
        <div className="text-center py-8 text-muted-foreground">Loading sponsored posts...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">Sponsored Posts</h1>
      <p className="text-sm text-muted-foreground mb-6">Share to WhatsApp and earn rewards</p>

      {tasks.length === 0 ? (
        <div className="bg-card border rounded-2xl p-6 text-center">
          <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No sponsored posts available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const done = isCompleted(task.id);

            return (
              <div key={task.id} className={`bg-card border rounded-2xl p-4 ${done ? "opacity-75" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                    <p className="text-xs font-semibold text-primary mt-1">Reward: €{(task.reward ?? 0).toFixed(2)}</p>
                  </div>
                </div>

                {!done && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleShare(task)} 
                      className="flex-1 border rounded-xl py-2 text-center text-xs font-medium cursor-pointer hover:bg-muted transition flex items-center justify-center gap-1"
                    >
                      <Share2 className="h-3 w-3" />
                      Share on WhatsApp
                    </button>
                  </div>
                )}

                {done && renderStatusBadge(task.id)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}