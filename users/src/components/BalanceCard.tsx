import { cn } from "@/lib/utils";

interface BalanceCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "dark" | "muted";
  className?: string;
}

export function BalanceCard({ label, amount, icon, variant = "muted", className }: BalanceCardProps) {
  const safeAmount = (amount ?? 0);
  const [whole, cents] = safeAmount.toFixed(2).split(".");
  const big = variant === "primary";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] flex flex-col justify-between gap-6 transition-transform duration-300 hover:-translate-y-0.5",
        big ? "p-5 md:p-6 min-h-[150px]" : "p-4 min-h-[112px]",
        variant === "primary" && "gradient-primary text-white shadow-[0_18px_40px_-18px_rgba(234,88,12,0.65)]",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "dark" && "bg-[#111] text-white",
        variant === "muted" && "bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {big && <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_90%_at_100%_0%,hsl(0_0%_100%/.22),transparent_60%)]" />}
      <div className="relative flex items-center justify-between">
        <span className={cn("text-[13px] font-medium truncate", variant === "muted" ? "text-muted-foreground" : "text-white/80")}>{label}</span>
        <div className={cn("h-8 w-8 shrink-0 rounded-full items-center justify-center", big ? "flex" : "hidden sm:flex", variant === "muted" ? "bg-foreground/[0.05]" : "bg-white/15")}>
          {icon}
        </div>
      </div>
      <span className={cn("relative font-display font-semibold tabular-nums tracking-tight leading-none", big ? "text-4xl md:text-5xl" : "text-2xl")}>
        €{Number(whole).toLocaleString()}<span className={cn(variant === "muted" ? "text-muted-foreground" : "text-white/60", big ? "text-2xl md:text-3xl" : "text-base")}>.{cents}</span>
      </span>
    </div>
  );
}
