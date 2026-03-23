import { useState, useEffect } from "react";
import { getTasks, completeTask } from "@/api/tasksApi";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ExternalLink, CheckCircle, Share2, Upload, Clock, XCircle, CheckCircle2 } from "lucide-react";
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeProofTask, setActiveProofTask] = useState<string | null>(null);
  const [proofMode, setProofMode] = useState<"upload" | "link">("link");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofLink, setProofLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
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
    loadTasks();
  }, []);

  if (!user) return null;

  const isSponsoredTask = (task: Task) => task.taskType === "SPONSORED_POST";
  const isCompleted = (taskId: string) => completedTasks.has(taskId);
  const getStatus = (taskId: string) => completedTasks.get(taskId);

  const handleShare = (task: Task) => {
    const shareText = task.shareMessage || "Check out this post!";
    const shareUrl = task.shareLink || task.link;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageError("File size must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.onerror = () => {
      setImageError("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (taskId: string) => {
    let proof: string;

    if (proofMode === "upload") {
      if (!proofImage) {
        toast.error("Please upload a screenshot");
        return;
      }
      proof = proofImage;
    } else {
      if (!proofLink.trim()) {
        toast.error("Please provide a proof link");
        return;
      }
      proof = proofLink;
    }

    setSubmitting(true);
    try {
      await completeTask(taskId, proof);
      setCompletedTasks(new Map(completedTasks.set(taskId, "pending")));
      setActiveProofTask(null);
      setProofImage(null);
      setProofLink("");
      setProofMode("link");
      toast.success("Task submitted for review!");
    } catch (err) {
      console.error("Failed to submit task:", err);
      toast.error("Failed to submit task. Please try again.");
    } finally {
      setSubmitting(false);
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
            <a href={task.link} target="_blank" rel="noopener noreferrer" className="flex-1 border rounded-xl py-2 text-center text-xs font-medium cursor-pointer hover:bg-muted transition">
              Visit Link
            </a>
            <button onClick={() => handleComplete(task.id, task.reward)} className="flex-1 gradient-primary text-primary-foreground rounded-xl py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition">
              Confirm Done
            </button>
          </div>
        )}
        {done && <p className="text-xs text-green-600 font-medium mt-2">✓ Completed</p>}
      </motion.div>
    );
  };

  const handleComplete = async (taskId: string, reward: number) => {
    if (isCompleted(taskId)) return;
    try {
      await completeTask(taskId, "");
      setCompletedTasks(new Map(completedTasks.set(taskId, "pending")));
      toast.success("Task submitted for review!");
    } catch (err) {
      console.error("Failed to complete task:", err);
      toast.error("Failed to submit task. Please try again.");
    }
  };

  const renderSponsoredTask = (task: Task, i: number) => {
    const done = isCompleted(task.id);
    const isActive = activeProofTask === task.id;

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

        {!done && !isActive && (
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => handleShare(task)} 
              className="flex-1 border rounded-xl py-2 text-center text-xs font-medium cursor-pointer hover:bg-muted transition flex items-center justify-center gap-1"
            >
              <Share2 className="h-3 w-3" />
              Share on WhatsApp
            </button>
            <button 
              onClick={() => setActiveProofTask(task.id)} 
              className="flex-1 gradient-primary text-primary-foreground rounded-xl py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition"
            >
              Submit Proof
            </button>
          </div>
        )}

        {isActive && (
          <div className="mt-3 space-y-2">
            {/* Toggle between Upload and Link */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setProofMode("upload"); setImageError(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-xl transition ${
                  proofMode === "upload" 
                    ? "gradient-primary text-primary-foreground" 
                    : "border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Upload className="h-3 w-3 inline mr-1" />
                Upload Screenshot
              </button>
              <button
                type="button"
                onClick={() => { setProofMode("link"); setImageError(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-xl transition ${
                  proofMode === "link" 
                    ? "gradient-primary text-primary-foreground" 
                    : "border text-muted-foreground hover:bg-muted"
                }`}
              >
                Paste Link
              </button>
            </div>

            {proofMode === "upload" ? (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id={`proof-upload-${task.id}`}
                />
                <label
                  htmlFor={`proof-upload-${task.id}`}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition"
                >
                  {proofImage ? (
                    <img 
                      src={proofImage} 
                      alt="Proof preview" 
                      className="h-full w-full object-contain rounded-lg p-1"
                    />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Click to upload screenshot</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5MB)</span>
                    </>
                  )}
                </label>
                {imageError && (
                  <p className="text-xs text-red-500 mt-1">{imageError}</p>
                )}
              </div>
            ) : (
              <div>
                <input 
                  type="text" 
                  value={proofLink} 
                  onChange={(e) => setProofLink(e.target.value)} 
                  placeholder="Paste your proof link here"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
                />
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => { setActiveProofTask(null); setProofImage(null); setProofLink(""); setImageError(null); }} 
                className="flex-1 border rounded-xl py-2 text-xs font-medium cursor-pointer hover:bg-muted transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSubmitProof(task.id)} 
                disabled={submitting}
                className="flex-1 gradient-primary text-primary-foreground rounded-xl py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
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
