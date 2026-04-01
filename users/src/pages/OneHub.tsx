import { Link } from "react-router-dom";
import { Gamepad2, RotateCw, Clock, Gift } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getTicTacToeStatus, getSpinStatus } from "@/api/gamesApi";

export default function OneHubPage() {
  const { user } = useAuth();
  const [tttPlays, setTttPlays] = useState(0);
  const [spinPlays, setSpinPlays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchGameStatus = async () => {
        try {
          setLoading(true);
          
          // Fetch TicTacToe status
          const tttRes = await getTicTacToeStatus();
          if (tttRes.data.success) {
            setTttPlays(tttRes.data.data.playsUsed);
          }
          
          // Fetch Spin status
          const spinRes = await getSpinStatus();
          if (spinRes.data.success) {
            setSpinPlays(spinRes.data.data.playsUsed);
          }
        } catch (error) {
          console.error('Failed to fetch game status:', error);
          // Fallback to local storage if API fails
          const getTodayGamePlays = (game: string) => {
            const today = new Date().toDateString();
            const plays = JSON.parse(localStorage.getItem('revorra_game_plays') || '[]');
            return plays.filter(g => g.game === game && new Date(g.played_at).toDateString() === today).length;
          };
          setTttPlays(getTodayGamePlays("tic-tac-toe"));
          setSpinPlays(getTodayGamePlays("spin-win"));
        } finally {
          setLoading(false);
        }
      };
      
      fetchGameStatus();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-display font-bold mb-1">OneHub Games</h1>
        <p className="text-sm text-muted-foreground mb-6">Loading games...</p>
      </div>
    );
  }

  const games = [
    { 
      id: "tic-tac-toe", 
      name: "Tic Tac Toe", 
      desc: "Beat the AI and win rewards", 
      icon: <Gamepad2 className="h-8 w-8" />, 
      plays: tttPlays, 
      maxPlays: 2,
      reward: "€0.10 - €0.30",
      to: "/onehub/tic-tac-toe" 
    },
    { 
      id: "spin-win", 
      name: "Spin & Win", 
      desc: "Spin the wheel for instant prizes", 
      icon: <RotateCw className="h-8 w-8" />, 
      plays: spinPlays, 
      maxPlays: 2,
      reward: "€0 - €0.50",
      to: "/onehub/spin-win" 
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-display font-bold">OneHub Games</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Play games and earn rewards (2 plays per game daily)</p>

      {/* Daily Summary Banner */}
      <div className="rounded-xl p-4 mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Today's Progress</p>
            <p className="text-xs text-muted-foreground mt-1">
              {4 - (games[0].plays + games[1].plays)} of 4 total plays remaining
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {Math.max(0, games[0].maxPlays - games[0].plays) + Math.max(0, games[1].maxPlays - games[1].plays)}
            </p>
            <p className="text-xs text-muted-foreground">plays left</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-500"
            style={{ width: `${((4 - (games[0].plays + games[1].plays)) / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {games.map(g => {
          const remaining = Math.max(0, g.maxPlays - g.plays);
          const isExhausted = remaining === 0;
          
          return (
            <Link 
              key={g.id} 
              to={g.to} 
              className={`bg-card border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition group ${isExhausted ? 'opacity-70' : ''}`}
            >
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform ${
                isExhausted 
                  ? "bg-muted text-muted-foreground" 
                  : "gradient-primary"
              }`}>
                {isExhausted ? <Clock className="h-8 w-8" /> : g.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold">{g.name}</h3>
                  {isExhausted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      Tomorrow
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className={`text-xs font-medium ${isExhausted ? 'text-amber-600' : 'text-green-600'}`}>
                    {isExhausted 
                      ? "No plays remaining today" 
                      : `${remaining} play${remaining !== 1 ? 's' : ''} remaining today`}
                  </p>
                  {!isExhausted && (
                    <span className="text-xs text-muted-foreground">• {g.reward}</span>
                  )}
                </div>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                isExhausted 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-primary/10 text-primary"
              }`}>
                <RotateCw className={`h-4 w-4 ${!isExhausted ? 'group-hover:rotate-180 transition-transform' : ''}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info section */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground mb-2">How it works</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• You get 2 free plays per game every day</li>
          <li>• Plays reset at midnight (UTC)</li>
          <li>• Winnings are credited to your OneHub wallet</li>
        </ul>
      </div>
    </div>
  );
}
