import { useAuth } from "@/context/AuthContext";
import { getMyReferrals } from "@/api/authApi";
import { Copy, Check, Users, TrendingUp, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

interface ReferredUser {
  id: string;
  createdAt: string;
  referredUser: {
    id: string;
    username: string;
    createdAt: string;
    taskCompletions: { id: string }[];
  };
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  if (!user) return null;

  const link = `revorra.com/register?ref=${user.username}`;

  const copy = () => {
    navigator.clipboard.writeText(`https://${link}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await getMyReferrals();
        if (res.data.success && res.data.data) {
          setReferrals(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch referrals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const getStatus = (referredUser: ReferredUser['referredUser']) => {
    const tasksCompleted = referredUser.taskCompletions?.length || 0;
    if (tasksCompleted > 0) return { label: 'Active', class: 'bg-green-100 text-green-700' };
    return { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">Referrals</h1>
      <p className="text-sm text-muted-foreground mb-6">Invite friends and earn €0.50 per referral</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border rounded-2xl p-4 text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">{referrals.length}</p>
          <p className="text-xs text-muted-foreground">Total Invites</p>
        </div>
        <div className="bg-card border rounded-2xl p-4 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">€{(user.referral_balance || 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Referral Earnings</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-card border rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-sm mb-3">Your Referral Link</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground truncate">
            {link}
          </div>
          <button onClick={copy} className="gradient-primary text-primary-foreground px-4 rounded-xl flex items-center gap-1 text-sm font-medium cursor-pointer hover:opacity-90 transition shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-4 p-3 bg-primary/5 rounded-xl">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> Share your link → Friend registers → You earn €0.50 instantly. Plus, earn €0.20 when your friend refers someone else!
          </p>
        </div>
      </div>

      {/* My Referrals */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          My Referrals
        </h3>
        
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : referrals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">No referrals yet</p>
            <p className="text-xs text-muted-foreground mb-4">Share your link to start earning €0.50 per referral!</p>
            <button onClick={copy} className="text-primary text-sm font-medium cursor-pointer hover:underline">
              Share Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => {
              const status = getStatus(ref.referredUser);
              return (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {ref.referredUser.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">@{ref.referredUser.username}</p>
                      <p className="text-xs text-muted-foreground">Joined: {formatDate(ref.referredUser.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.class}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tasks: {ref.referredUser.taskCompletions?.length || 0}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
