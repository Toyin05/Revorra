import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { playTicTacToe, getTicTacToeStatus } from "@/api/gamesApi";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
  // Try to win
  for (const i of empty) { const t = [...b]; t[i] = "O"; if (checkWinner(t) === "O") return i; }
  // Block
  for (const i of empty) { const t = [...b]; t[i] = "X"; if (checkWinner(t) === "X") return i; }
  // Center
  if (empty.includes(4)) return 4;
  // Random
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToePage() {
  const { user, updateUser } = useAuth();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string>("");
  const [remainingPlays, setRemainingPlays] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const canPlay = remainingPlays > 0;

  // Load initial status from backend
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await getTicTacToeStatus();
        setRemainingPlays(res.data.remainingPlays);
      } catch (error) {
        console.error("Failed to load Tic-Tac-Toe status:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, []);

  const handleClick = useCallback(async (i: number) => {
    if (board[i] || gameOver || !canPlay || !user) return;
    const nb = [...board];
    nb[i] = "X";
    const w = checkWinner(nb);
    
    if (w === "X") {
      // Player wins - call backend API
      try {
        const res = await playTicTacToe(nb);
        const reward = res.data.reward;
        setRemainingPlays(res.data.remainingPlays);
        updateUser({ onehub_balance: (user.onehub_balance || 0) + reward });
        setBoard(nb); setGameOver(true); setResult(`You win! +€${reward.toFixed(2)}`);
        toast.success(`You won €${reward.toFixed(2)}! 🎉`);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to play game";
        toast.error(errorMessage);
      }
      return;
    }
    
    if (nb.every(c => c !== null)) {
      // Draw - call backend API
      try {
        await playTicTacToe(nb);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to record game";
        toast.error(errorMessage);
      }
      setBoard(nb); setGameOver(true); setResult("It's a draw!");
      return;
    }
    
    const ai = aiMove(nb);
    nb[ai] = "O";
    const w2 = checkWinner(nb);
    
    if (w2 === "O") {
      // AI wins - call backend API
      try {
        await playTicTacToe(nb);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to record game";
        toast.error(errorMessage);
      }
      setBoard(nb); setGameOver(true); setResult("AI wins! Try again.");
      return;
    }
    
    if (nb.every(c => c !== null)) {
      // Draw - call backend API
      try {
        await playTicTacToe(nb);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to record game";
        toast.error(errorMessage);
      }
      setBoard(nb); setGameOver(true); setResult("It's a draw!");
      return;
    }
    
    setBoard(nb);
  }, [board, gameOver, canPlay, user, updateUser]);

  const reset = () => { setBoard(Array(9).fill(null)); setGameOver(false); setResult(""); };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <Link to="/onehub" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 cursor-pointer hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-xl font-display font-bold mb-1">Tic Tac Toe</h1>
      {loading ? (
        <p className="text-sm text-muted-foreground mb-6">Loading...</p>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          {canPlay ? `${remainingPlays} play${remainingPlays !== 1 ? 's' : ''} remaining today` : "No plays remaining today"}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!cell || gameOver || !canPlay}
            className={`h-[85px] rounded-xl text-2xl font-bold border-2 transition cursor-pointer
              ${cell === "X" ? "text-primary border-primary bg-primary/5" : ""}
              ${cell === "O" ? "text-foreground border-foreground bg-foreground/5" : ""}
              ${!cell && !gameOver && canPlay ? "hover:bg-muted border-border" : "border-border"}
            `}
          >
            {cell}
          </button>
        ))}
      </div>

      {result && (
        <div className="text-center mt-6">
          <p className="font-display font-bold text-lg">{result}</p>
          {canPlay && (
            <button onClick={reset} className="mt-3 gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition">
              Play Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
