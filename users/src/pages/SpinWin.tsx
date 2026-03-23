import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { SPIN_REWARDS } from "@/lib/data";
import { spinWheel, getSpinStatus } from "@/api/gamesApi";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SpinWinPage() {
  const { user, updateUser } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [remainingPlays, setRemainingPlays] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);
  const canPlay = remainingPlays > 0;

  // Load initial status from backend
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await getSpinStatus();
        setRemainingPlays(res.data.remainingPlays);
      } catch (error) {
        console.error("Failed to load spin status:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, []);

  const spin = async () => {
    if (spinning || !canPlay || !user) return;
    setSpinning(true);
    setResult(null);
    const newRotation = rotation + 1800 + Math.random() * 360;
    setRotation(newRotation);

    try {
      // Call backend API
      const res = await spinWheel();
      const reward = res.data.reward;
      
      // Update remaining plays from backend
      setRemainingPlays(res.data.remainingPlays);
      
      // Update user balance
      updateUser({ onehub_balance: (user.onehub_balance || 0) + reward });
      setResult(reward);
      toast.success(`You won €${reward.toFixed(2)}! 🎉`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to spin wheel";
      toast.error(errorMessage);
    } finally {
      setSpinning(false);
    }
  };

  const segments = SPIN_REWARDS.slice(0, 12);
  const segAngle = 360 / segments.length;

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-xl font-display font-bold mb-1">Spin & Win</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground mb-6">Loading...</p>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          {canPlay ? `${remainingPlays} spin${remainingPlays !== 1 ? 's' : ''} remaining today` : "No spins remaining today"}
        </p>
      )}

      {/* Wheel */}
      <div className="relative w-[280px] h-[280px] mx-auto mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
        
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-foreground/10 overflow-hidden relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {segments.map((value, i) => {
            const angle = i * segAngle;
            const isOrange = i % 2 === 0;
            return (
              <div
                key={i}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className={`absolute top-0 left-1/2 origin-bottom h-1/2 w-full -translate-x-1/2 flex items-start justify-center pt-4`}
                  style={{
                    clipPath: `polygon(50% 100%, ${50 - Math.tan((segAngle / 2) * Math.PI / 180) * 50}% 0%, ${50 + Math.tan((segAngle / 2) * Math.PI / 180) * 50}% 0%)`,
                    background: isOrange ? "hsl(17, 90%, 48%)" : "hsl(34, 90%, 48%)",
                  }}
                >
                  <span className="text-[10px] font-bold text-primary-foreground mt-1">€{value}</span>
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-background border-2 shadow-elevated z-10 flex items-center justify-center">
              <span className="text-[10px] font-bold">SPIN</span>
            </div>
          </div>
        </div>
      </div>

      {result !== null && (
        <div className="text-center mb-4">
          <p className="text-2xl font-display font-bold text-primary">€{result.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Added to your OneHub balance!</p>
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning || !canPlay}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer
          ${spinning || !canPlay ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground hover:opacity-90 animate-pulse-glow"}`}
      >
        {spinning ? "Spinning..." : !canPlay ? "No Spins Left Today" : "Spin the Wheel"}
      </button>
    </div>
  );
}
