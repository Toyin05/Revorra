import { cn } from "@/lib/utils";

interface BalanceCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "dark" | "muted";
}

export function BalanceCard({ label, amount, icon, variant = "muted" }: BalanceCardProps) {
  const safeAmount = (amount ?? 0);
  return (
    <div
      className={cn(
        "rounded-2xl p-4 flex flex-col gap-2 shadow-card transition-transform hover:scale-[1.02]",
        variant === "primary" && "gradient-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "dark" && "gradient-dark text-primary-foreground",
        variant === "muted" && "bg-card border"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium uppercase tracking-wide", variant === "muted" ? "text-muted-foreground" : "opacity-80")}>{label}</span>
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", variant === "muted" ? "bg-muted" : "bg-background/20")}>
          {icon}
        </div>
      </div>
      <span className="text-2xl font-display font-bold">€{safeAmount.toFixed(2)}</span>
    </div>
  );
}
