import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { spinWheel, getSpinStatus } from "@/api/gamesApi";
import { toast } from "sonner";
import { ArrowLeft, Clock, Gift } from "lucide-react";
import { Link } from "react-router-dom";

// Exact segment order - must match backend
const SEGMENTS = [
  { label: "€0", value: 0 },
  { label: "€0.20", value: 0.20 },
  { label: "€0.25", value: 0.25 },
  { label: "€0.30", value: 0.30 },
  { label: "€0.35", value: 0.35 },
  { label: "€0.40", value: 0.40 },
  { label: "€0.50", value: 0.50 },
];

const SEGMENT_DEGREES = 360 / SEGMENTS.length; // 51.43...

export default function SpinWinPage() {
  const { user, wallet, updateWallet } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [remainingPlays, setRemainingPlays] = useState(2);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);
  const canPlay = remainingPlays > 0;

  // Fetch remaining plays from API on mount
  useEffect(() => {
    if (user) {
      const fetchStatus = async () => {
        try {
          setLoadingStatus(true);
          const res = await getSpinStatus();
          if (res.data.success) {
            setRemainingPlays(res.data.data.playsRemaining);
          }
        } catch (error) {
          console.error("Failed to fetch spin status:", error);
        } finally {
          setLoadingStatus(false);
        }
      };
      
      fetchStatus();
    }
  }, [user]);

  // Countdown timer to midnight
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSpin = async () => {
    if (spinning || !canPlay || !user) return;
    
    setSpinning(true);
    setResult(null);
    
    try {
      // Step 1: Call backend FIRST to get the actual reward
      const res = await spinWheel();
      
      if (!res.data.success) {
        setSpinning(false);
        toast.error(res.data.message || "Spin failed. Please try again.");
        return;
      }
      
      // Get reward from backend
      const reward = res.data.data?.reward || 0;
      const newBalance = res.data.data?.oneHubBalance || 0;
      const newRemainingPlays = res.data.data?.remainingPlays || 0;
      
      const segmentIndex = SEGMENTS.findIndex(s => s.value === reward);
      const segmentDegrees = 360 / SEGMENTS.length;
      
      // Step 2: Calculate exact rotation using the correct formula
      // The pointer is at TOP (12 o'clock = 0 degrees)
      // Segment i CENTER is at: i * segmentDegrees + segmentDegrees/2
      // To bring segment i's center to the TOP (0 degrees):
      // rotationToAlignSegment = 360 - (segmentIndex * segmentDegrees + segmentDegrees/2)
      
      const segmentCenter = segmentIndex * segmentDegrees + (segmentDegrees / 2);
      const rotationToAlign = (360 - segmentCenter + 360) % 360;
      
      // Current normalized position
      const currentNormalized = currentRotation % 360;
      
      // How much extra we need to rotate from current position
      const extraRotation = (rotationToAlign - currentNormalized + 360) % 360;
      
      // Add 5 full spins minimum for good animation
      const totalRotation = currentRotation + (360 * 5) + extraRotation;
      
      setCurrentRotation(totalRotation);
      setRemainingPlays(newRemainingPlays);
      
      // Step 3: After animation completes (3 seconds), show result
      setTimeout(() => {
        setSpinning(false);
        setResult(reward);
        
        // Update wallet balance from backend response
        updateWallet({ onehubBalance: newBalance });
        
        if (reward > 0) {
          toast.success(`You won €${reward.toFixed(2)}! 🎉`);
        } else {
          toast("Better luck next time!", { icon: "🍀" });
        }
      }, 3000);
      
    } catch (error) {
      console.error("Spin error:", error);
      setSpinning(false);
      toast.error("Spin failed. Please try again.");
    }
  };

  // If not authenticated, show login message
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto text-center">
        <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </Link>
        <h1 className="text-xl font-display font-bold mb-1">Spin & Win</h1>
        <p className="text-sm text-muted-foreground mb-6">Please log in to play</p>
        <Link to="/login" className="mt-3 gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-display font-bold">Spin & Win</h1>
      </div>
      
      {/* Status Banner */}
      <div className={`rounded-xl p-4 mb-6 border ${
        canPlay 
          ? "bg-green-500/10 border-green-500/20" 
          : "bg-amber-500/10 border-amber-500/20"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {canPlay ? (
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">
                {canPlay 
                  ? `${remainingPlays} spin${remainingPlays !== 1 ? 's' : ''} remaining today` 
                  : "No spins remaining today"}
              </p>
              <p className="text-xs text-muted-foreground">
                {canPlay 
                  ? "Spin the wheel to win rewards!" 
                  : `Resets in ${timeLeft}`}
              </p>
            </div>
          </div>
          
          {!canPlay && (
            <div className="text-right">
              <div className="text-xs text-amber-600 font-medium">Next spin</div>
              <div className="text-xs text-muted-foreground">{timeLeft}</div>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-[280px] h-[280px] mx-auto mb-6">
        {/* Pointer at top - fixed, does NOT move */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-foreground/10 overflow-hidden relative shadow-2xl"
          style={{
            transform: `rotate(${currentRotation}deg)`,
            transition: spinning ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {SEGMENTS.map((segment, i) => {
            const angle = i * SEGMENT_DEGREES;
            // Unique colors for each segment
            const colors = [
              "hsl(50, 95%, 50%)",  // Yellow - €0
              "hsl(25, 95%, 55%)",  // Orange - €0.20
              "hsl(45, 90%, 55%)",  // Amber - €0.25
              "hsl(25, 95%, 55%)",  // Orange - €0.30
              "hsl(45, 90%, 55%)",  // Amber - €0.35
              "hsl(25, 95%, 55%)",  // Orange - €0.40
              "hsl(0, 80%, 50%)"    // Red - €0.50
            ];
            return (
              <div
                key={i}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className="absolute top-0 left-1/2 origin-bottom h-1/2 w-full -translate-x-1/2 flex items-start justify-center pt-3"
                  style={{
                    clipPath: `polygon(50% 100%, ${50 - Math.tan((SEGMENT_DEGREES / 2) * Math.PI / 180) * 50}% 0%, ${50 + Math.tan((SEGMENT_DEGREES / 2) * Math.PI / 180) * 50}% 0%)`,
                    background: colors[i] || "hsl(25, 95%, 55%)",
                  }}
                >
                  <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
                    {segment.label}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 border-4 border-white shadow-xl z-10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">SPIN</span>
            </div>
          </div>
        </div>
        
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full border-2 border-foreground/5 pointer-events-none" />
      </div>

      {result !== null && (
        <div className="text-center mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="text-3xl font-display font-bold text-primary">€{result.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Added to your OneHub balance!</p>
        </div>
      )}

      {/* No plays message */}
      {!canPlay && !spinning && (
        <div className="text-center mb-4 p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground">
            You've used all your spins for today. Come back tomorrow!
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your next spin will be available in {timeLeft}
          </p>
        </div>
      )}

      <button
        onClick={handleSpin}
        disabled={spinning || !canPlay}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition cursor-pointer
          ${spinning || !canPlay 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "gradient-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg"}`}
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Spinning...
          </span>
        ) : !canPlay ? "No Spins Left Today" : "Spin the Wheel"}
      </button>
    </div>
  );
}