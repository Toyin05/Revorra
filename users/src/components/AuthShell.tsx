import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TOP_EARNERS } from "@/lib/data";

const ease = [0.22, 1, 0.36, 1] as const;

/* Shared frame for login, register and reset: form on the left, brand panel on the right (desktop) */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2">
      <div className="flex flex-col px-5 sm:px-10 py-6 lg:py-8">
        <Link to="/" aria-label="Revorra home" className="text-foreground self-start"><Logo className="h-[14px]" /></Link>
        <div className="flex-1 flex items-center justify-center py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="w-full max-w-[400px]">
            {children}
          </motion.div>
        </div>
      </div>
      <div className="hidden lg:block p-3">
        <div className="relative h-full min-h-[600px] rounded-[28px] overflow-hidden gradient-primary">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_70%_at_0%_0%,hsl(0_0%_100%/.22),transparent_60%)]" />
          <div aria-hidden className="absolute -right-24 -bottom-24 text-white/[0.12]"><Logo icon className="h-[520px]" /></div>
          <div className="relative h-full flex flex-col justify-between p-12">
            <h2 className="max-w-md text-5xl font-display font-semibold leading-[1.02] text-white">Upgrade your lifestyle by earning on the go.</h2>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease }} className="w-[320px] rounded-[22px] bg-white/95 backdrop-blur p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
              {TOP_EARNERS.slice(0, 3).map((e, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${i === 0 ? "bg-orange-50" : ""} ${i > 0 ? "border-t border-black/[0.05]" : ""}`}>
                  <span className="w-6 text-xs font-semibold text-primary tabular-nums">#{i + 1}</span>
                  <div className={`h-9 w-9 rounded-full grid place-items-center text-xs font-semibold ${i === 0 ? "gradient-primary text-white" : "bg-foreground/[0.06]"}`}>{e.avatar}</div>
                  <p className="flex-1 text-sm font-medium">{e.name}</p>
                  <span className="font-display font-semibold tabular-nums">€{e.earnings.toLocaleString()}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
