import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { playTicTacToe, getTicTacToeStatus } from "@/api/gamesApi";
import { toast } from "sonner";
import { ArrowLeft, Clock, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";

type Cell = "X" | "O" | null;
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWinner(b: Cell[]): Cell {
  for (const [a, bb, c] of lines) {
    if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a];
  }
  return null;
}

function aiMove(b: Cell[]): number {
  const empty = b.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  if (empty.length === 0) return -1;
  
  // Add some randomness - 50% chance AI makes a random move (easier game)
  if (Math.random() < 0.50) {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  
  // First, try to win
  for (const i of empty) { 
    const t = [...b]; t[i] = "O"; if (checkWinner(t) === "O") return i; 
  }
  
  // Second, block player's winning move
  for (const i of empty) { 
    const t = [...b]; t[i] = "X"; if (checkWinner(t) === "X") return i; 
  }
  
  // Take center if available
  if (empty.includes(4)) return 4;
  
  // Take corners if available
  const corners = [0, 2, 6, 8].filter(i => empty.includes(i));
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }
  
  // Take any available edge
  const edges = [1, 3, 5, 7].filter(i => empty.includes(i));
  if (edges.length > 0) {
    return edges[Math.floor(Math.random() * edges.length)];
  }
  
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToePage() {
  const { user, wallet, updateUser, updateWallet, refreshWallet } = useAuth();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string>("");
  const [remainingPlays, setRemainingPlays] = useState<number>(2);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState("");
  const canPlay = remainingPlays > 0;
  
  // Fetch remaining plays from API on mount
  useEffect(() => {
    if (user) {
      const fetchStatus = async () => {
        try {
          setLoadingStatus(true);
          const res = await getTicTacToeStatus();
          if (res.data.success) {
            setRemainingPlays(res.data.data.playsRemaining);
          }
        } catch (error) {
          console.error("Failed to fetch TicTacToe status:", error);
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
  
  const handleClick = useCallback(async (i: number) => {
    if (!user || board[i] || gameOver || !canPlay) return;
    
    const nb = [...board];
    nb[i] = "X";
    const w = checkWinner(nb);
    
    if (w === "X") {
      try {
        const res = await playTicTacToe(nb);
        if (res.data.success) {
          const reward = res.data.data?.reward || 0;
          const newRemainingPlays = res.data.data?.remainingPlays;
          const updatedWallet = res.data.data.wallet;
          setRemainingPlays(newRemainingPlays);
          if (updatedWallet) {
            refreshWallet(updatedWallet);
          }
          setBoard(nb); 
          setGameOver(true); 
          setResult(`You win! +€${reward.toFixed(2)}`);
          if (reward > 0) {
            toast.success(`You won €${reward.toFixed(2)}! 🎉`);
          }
        }
      } catch (error) {
        // Fallback: random reward between 0.2 and 0.5 if API fails
        const reward = 0.2 + Math.random() * 0.3;
        setRemainingPlays(prev => Math.max(0, prev - 1));
        updateWallet({ onehubBalance: (wallet?.onehubBalance || 0) + reward });
        setBoard(nb); 
        setGameOver(true); 
        setResult(`You win! +€${reward.toFixed(2)}`);
        toast.success(`You won €${reward.toFixed(2)}! 🎉`);
      }
      return;
    }
    
    if (nb.every(c => c !== null)) {
      try {
        await playTicTacToe(nb);
      } catch (error) {
        // Ignore API error for draw scenario
      }
      setRemainingPlays(prev => Math.max(0, prev - 1));
      setBoard(nb); setGameOver(true); setResult("It's a draw!");
      return;
    }
    
    const ai = aiMove(nb);
    if (ai === -1) {
      setRemainingPlays(prev => Math.max(0, prev - 1));
      setBoard(nb); setGameOver(true); setResult("It's a draw!");
      return;
    }
    nb[ai] = "O";
    const w2 = checkWinner(nb);
    
    if (w2 === "O") {
      try {
        await playTicTacToe(nb);
      } catch (error) {
        // Ignore API error for AI win scenario
      }
      setRemainingPlays(prev => Math.max(0, prev - 1));
      setBoard(nb); setGameOver(true); setResult("AI wins! Try again.");
      return;
    }
    
    if (nb.every(c => c !== null)) {
      try {
        await playTicTacToe(nb);
      } catch (error) {
        // Ignore API error for draw scenario
      }
      setRemainingPlays(prev => Math.max(0, prev - 1));
      setBoard(nb); setGameOver(true); setResult("It's a draw!");
      return;
    }
    
    setBoard(nb);
  }, [board, gameOver, canPlay, user, wallet, updateUser, updateWallet]);

  // If not authenticated, show login message
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto text-center">
        <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Games
        </Link>
        <h1 className="text-xl font-display font-bold mb-1">Tic Tac Toe</h1>
        <p className="text-sm text-muted-foreground mb-6">Please log in to play</p>
        <Link to="/login" className="mt-3 gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition">
          Log In
        </Link>
      </div>
    );
  }

  const reset = () => { setBoard(Array(9).fill(null)); setGameOver(false); setResult(""); };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      
      <h1 className="text-xl font-display font-bold mb-2">Tic Tac Toe</h1>
      
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
                <Gamepad2 className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">
                {canPlay 
                  ? `${remainingPlays} play${remainingPlays !== 1 ? 's' : ''} remaining today` 
                  : "No plays remaining today"}
              </p>
              <p className="text-xs text-muted-foreground">
                {canPlay 
                  ? "Beat the AI to win rewards" 
                  : `Resets in ${timeLeft}`}
              </p>
            </div>
          </div>
          
          {!canPlay && (
            <div className="text-right">
              <div className="text-xs text-amber-600 font-medium">Next play</div>
              <div className="text-xs text-muted-foreground">{timeLeft}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!cell || gameOver || !canPlay}
            className={`h-[85px] rounded-xl text-3xl font-bold border-2 transition cursor-pointer flex items-center justify-center bg-background ${
              cell === "X" ? "text-red-500 bg-red-100 border-red-500" :
              cell === "O" ? "text-blue-500 bg-blue-100 border-blue-500" :
              (!cell && !gameOver && canPlay) ? "border-gray-300 hover:bg-gray-100 text-gray-400" :
              "border-gray-200 text-gray-300"
            }`}
          >
            {cell === "X" && (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10L30 30M30 10L10 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            )}
            {cell === "O" && (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="4"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      {result && (
        <div className="text-center mt-6">
          <p className="font-display font-bold text-lg">{result}</p>
          {canPlay && remainingPlays > 0 && (
            <button onClick={reset} className="mt-3 gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition">
              Play Again
            </button>
          )}
        </div>
      )}

      {/* No plays message */}
      {!canPlay && !gameOver && (
        <div className="text-center mt-4 p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground">
            You've used all your plays for today. Come back tomorrow!
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your next play will be available in {timeLeft}
          </p>
        </div>
      )}
    </div>
  );
}