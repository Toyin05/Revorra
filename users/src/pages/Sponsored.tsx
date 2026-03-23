import { useAuth } from "@/context/AuthContext";
import { getTasks, completeTask } from "@/api/tasksApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Share2, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SponsoredTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Map<string, string>>(new Map());
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [proofMode, setProofMode] = useState<"upload" | "link">("link");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofLink, setProofLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
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
    loadTasks();
  }, []);

  if (!user) return null;

  const getStatus = (taskId: string) => completedTasks.get(taskId);

  const handleShare = (task: SponsoredTask) => {
    const shareText = task.shareMessage || "Check out this post!";
    const shareUrl = task.shareLink || "";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageError("File size must be less than 5MB");
      return;
    }

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
      setActiveTask(null);
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

  const isCompleted = (taskId: string) => completedTasks.has(taskId);

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
            const isActive = activeTask === task.id;

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
                      onClick={() => setActiveTask(task.id)} 
                      className="flex-1 gradient-primary text-primary-foreground rounded-xl py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition"
                    >
                      Submit Proof
                    </button>
                  </div>
                )}

                {isActive && (
                  <div className="mt-3 space-y-2">
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
                        Upload
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
                          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition"
                        >
                          {proofImage ? (
                            <img src={proofImage} alt="Preview" className="h-full w-full object-contain rounded-lg p-1" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Upload screenshot</span>
                            </>
                          )}
                        </label>
                        {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        value={proofLink} 
                        onChange={(e) => setProofLink(e.target.value)} 
                        placeholder="Paste your proof link"
                        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background" 
                      />
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setActiveTask(null); setProofImage(null); setProofLink(""); setImageError(null); }} 
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
