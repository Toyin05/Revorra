import { useState, useEffect } from "react";
import { getTasks, completeTask } from "@/api/tasksApi";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ExternalLink, CheckCircle, Share2, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  taskType?: string;
  shareMessage?: string;
  shareLink?: string;
  status?: string;
}

interface TaskWithStatus extends Task {
  completionStatus?: "pending" | "approved" | "rejected";
}

export default function TasksPage() {
  const { user, refreshWallet } = useAuth();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasks();
      const tasksData = res.data.data;

      // Extract completed task IDs and their statuses
      const completedMap = new Map<string, string>();
      tasksData.forEach((t: any) => {
        if (t.status === "completed" || t.is_completed) {
          completedMap.set(t.id, "approved");
        } else if (t.status === "pending") {
          completedMap.set(t.id, "pending");
        } else if (t.status === "rejected") {
          completedMap.set(t.id, "rejected");
        }
      });

      setTasks(tasksData);
      setCompletedTasks(completedMap);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (!user) return null;

  const isSponsoredTask = (task: Task) => task.taskType === "SPONSORED_POST";
  const isCompleted = (taskId: string) => completedTasks.has(taskId);
  const getStatus = (taskId: string) => completedTasks.get(taskId);

  const handleShare = (task: Task) => {
    const shareText = task.shareMessage || "Check out this post!";
    const shareUrl = task.shareLink || (task.link?.startsWith('http') ? task.link : `https://${task.link}`);
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

  const renderRegularTask = (task: Task, i: number) => {
    const done = isCompleted(task.id);

    const handleComplete = async (taskId: string) => {
      if (isCompleted(taskId)) return;

      try {
        const res = await completeTask(taskId, 'auto-approved');
        const updatedWallet = res.data.data.wallet;
        if (updatedWallet) {
          refreshWallet(updatedWallet);
        }
        setCompletedTasks(new Map(completedTasks.set(taskId, "approved")));
        toast.success("Task completed! Balance updated.");
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to complete task.');
      }
    };

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`bg-card border rounded-2xl p-4 ${done ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
            {done ? <CheckCircle className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{task.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            <p className="text-xs font-semibold text-primary mt-1">Reward: €{(task.reward ?? 0).toFixed(2)}</p>
          </div>
        </div>

        {!done && (
          <div className="flex gap-2 mt-3">
            <a
              href={task.link?.startsWith('http') ? task.link : `https://${task.link}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleComplete(task.id)}
              className="flex-1 border rounded-xl py-2 text-center text-xs font-medium cursor-pointer hover:bg-muted transition"
            >
              Visit Link
            </a>
          </div>
        )}

        {done && <p className="text-xs text-green-600 font-medium mt-2">✓ Completed</p>}
      </motion.div>
    );
  };

  const renderSponsoredTask = (task: Task, i: number) => {
    const done = isCompleted(task.id);

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`bg-card border rounded-2xl p-4 ${done ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
            {done ? <CheckCircle className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
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
      </motion.div>
    );
  };

  // Separate sponsored and regular tasks
  const sponsoredTasks = tasks.filter(isSponsoredTask);
  const regularTasks = tasks.filter(t => !isSponsoredTask(t));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">Tasks</h1>
      <p className="text-sm text-muted-foreground mb-6">Complete tasks to earn rewards</p>

      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '2px solid #fca5a5'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>
              IMPORTANT WARNING — READ BEFORE PROCEEDING
            </p>
            <p style={{ fontSize: '13px', lineHeight: '1.6', opacity: '0.95' }}>
              All task completions are monitored. Users who submit fake proof,
              complete tasks without following instructions, or attempt to farm
              rewards dishonestly will be <strong>permanently suspended</strong> without
              warning and any pending earnings will be forfeited. By completing
              a task, you confirm that you have genuinely performed the required
              action. Integrity is required to remain on this platform.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
      ) : (
        <div className="space-y-6">
          {/* Sponsored Tasks Section */}
          {sponsoredTasks.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Sponsored Posts
              </h2>
              <div className="space-y-3">
                {sponsoredTasks.map((task, i) => renderSponsoredTask(task, i))}
              </div>
            </div>
          )}

          {/* Regular Tasks Section */}
          {regularTasks.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Regular Tasks
              </h2>
              <div className="space-y-3">
                {regularTasks.map((task, i) => renderRegularTask(task, i))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tasks available at the moment. Check back later!
            </div>
          )}
        </div>
      )}
    </div>
  );
}