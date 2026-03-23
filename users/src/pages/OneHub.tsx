import { Link } from "react-router-dom";
import { Gamepad2, RotateCw } from "lucide-react";
import { getTodayGamePlays } from "@/lib/data";

export default function OneHubPage() {
  const tttPlays = getTodayGamePlays("tic-tac-toe");
  const spinPlays = getTodayGamePlays("spin-win");

  const games = [
    { id: "tic-tac-toe", name: "Tic Tac Toe", desc: "Beat the AI and win rewards", icon: <Gamepad2 className="h-8 w-8" />, plays: tttPlays, to: "/onehub/tic-tac-toe" },
    { id: "spin-win", name: "Spin & Win", desc: "Spin the wheel for instant prizes", icon: <RotateCw className="h-8 w-8" />, plays: spinPlays, to: "/onehub/spin-win" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-display font-bold mb-1">OneHub Games</h1>
      <p className="text-sm text-muted-foreground mb-6">Play games and earn rewards (2 plays per game daily)</p>

      <div className="grid gap-4">
        {games.map(g => (
          <Link key={g.id} to={g.to} className="bg-card border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition group">
            <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
              {g.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold">{g.name}</h3>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
              <p className="text-xs text-primary font-medium mt-1">{2 - g.plays} plays remaining today</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
