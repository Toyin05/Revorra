import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { ArrowRight, CheckCircle, Users, Zap, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TOP_EARNERS } from "@/lib/data";

const steps = [
  { icon: <Users className="h-5 w-5" />, title: "Create Account", desc: "Sign up in seconds and get your welcome bonus." },
  { icon: <CheckCircle className="h-5 w-5" />, title: "Complete Tasks", desc: "Simple tasks like following pages and visiting links." },
  { icon: <Zap className="h-5 w-5" />, title: "Invite Friends", desc: "Earn from every friend who joins with your link." },
  { icon: <Trophy className="h-5 w-5" />, title: "Earn Rewards", desc: "Withdraw your earnings to your bank or crypto wallet." },
];

const ease = [0.22, 1, 0.36, 1] as const;

/* Pill button with the arrow tucked in a circle, the way Tessel does it */
function PillCta({ to, children, dark = false, light = false }: { to: string; children: React.ReactNode; dark?: boolean; light?: boolean }) {
  const base = "group inline-flex items-center justify-center gap-3 rounded-full pl-6 pr-1.5 py-1.5 h-12 text-[15px] font-medium transition-all duration-300 active:scale-[0.98]";
  const skin = light
    ? "bg-white text-foreground hover:bg-white/90"
    : dark
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "gradient-primary text-white shadow-[0_8px_24px_-8px_rgba(234,88,12,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(234,88,12,0.7)]";
  const dot = light ? "bg-foreground text-white" : "bg-white/20 text-white";
  return (
    <Link to={to} className={`${base} ${skin}`}>
      {children}
      <span className={`grid place-items-center h-9 w-9 rounded-full ${dot} transition-transform duration-300 group-hover:translate-x-0.5`}>
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

/* Number that counts up once it scrolls into view */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, value, { duration: 1.4, ease, onUpdate: v => { el.textContent = Math.round(v).toLocaleString(); } });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>{value.toLocaleString()}</span>;
}

/* Wordless illustrations for each step, built from the product's own shapes */
function StepVisual({ i }: { i: number }) {
  const bar = (w: string, o = "bg-foreground/10") => <div className={`h-2 rounded-full ${o}`} style={{ width: w }} />;
  if (i === 0) return (
    <div className="w-full max-w-[300px] rounded-2xl bg-white border border-black/[0.06] shadow-elevated p-5 space-y-4">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full gradient-primary grid place-items-center text-white"><Users className="h-5 w-5" /></div><div className="flex-1 space-y-2">{bar("60%")}{bar("35%", "bg-foreground/[0.06]")}</div></div>
      {[0, 1].map(k => <div key={k} className="h-10 rounded-xl border border-black/[0.08] bg-neutral-50 px-3 flex items-center">{bar(k ? "40%" : "55%", "bg-foreground/[0.07]")}</div>)}
      <div className="h-10 rounded-xl gradient-primary" />
    </div>
  );
  if (i === 1) return (
    <div className="w-full max-w-[300px] rounded-2xl bg-white border border-black/[0.06] shadow-elevated p-5 space-y-3">
      {[1, 1, 0].map((done, k) => (
        <div key={k} className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3">
          <div className={`h-6 w-6 rounded-full grid place-items-center ${done ? "gradient-primary text-white" : "border-2 border-dashed border-foreground/20"}`}>{done ? <CheckCircle className="h-3.5 w-3.5" /> : null}</div>
          <div className="flex-1">{bar(["70%", "50%", "62%"][k], done ? "bg-foreground/15" : "bg-foreground/[0.07]")}</div>
          <div className={`h-5 w-12 rounded-full ${done ? "bg-primary/15" : "bg-foreground/[0.05]"}`} />
        </div>
      ))}
    </div>
  );
  if (i === 2) {
    const pts = [[18, 20], [82, 20], [18, 80], [82, 80]];
    return (
      <div className="relative w-full max-w-[300px] md:max-w-[380px] aspect-[4/3]">
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          {pts.map(([x, y], k) => (
            <line key={k} className="dash-flow" x1="50" y1="50" x2={x} y2={y} stroke="hsl(17 90% 48% / .5)" strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-2xl gradient-primary shadow-elevated grid place-items-center text-white"><Zap className="h-7 w-7" /></div>
        {pts.map(([x, y], k) => (
          <motion.div key={k} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 + k * 0.08, duration: 0.4, ease }}
            className="absolute h-11 w-11 -ml-[22px] -mt-[22px] rounded-full bg-white border border-black/[0.06] shadow-card grid place-items-center text-[11px] font-semibold text-foreground" style={{ left: `${x}%`, top: `${y}%` }}>
            {TOP_EARNERS[k + 1].avatar}
          </motion.div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full max-w-[300px] rounded-2xl gradient-primary p-5 text-white shadow-[0_24px_48px_-16px_rgba(234,88,12,0.55)]">
      <div className="flex justify-between items-start"><Trophy className="h-6 w-6" /><div className="h-6 w-10 rounded-md bg-white/25" /></div>
      <div className="mt-8 font-display text-4xl font-semibold tracking-tight">€<CountUp value={TOP_EARNERS[0].earnings} /></div>
      <div className="mt-4 flex gap-1.5 items-end h-12">{[30, 45, 38, 60, 52, 75, 90].map((h, k) => <motion.div key={k} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: k * 0.05, duration: 0.6, ease }} className="flex-1 rounded-sm bg-white/35" />)}</div>
    </div>
  );
}

function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  useEffect(() => {
    if (paused || !inView) return;
    const t = setTimeout(() => setActive(a => (a + 1) % steps.length), 4200);
    return () => clearTimeout(t);
  }, [active, paused, inView]);

  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-6xl">
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} className="text-3xl md:text-5xl font-display font-semibold tracking-[-0.005em] text-center">How Revorra Works</motion.h2>
        <div ref={ref} className="mt-12 md:mt-16 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 lg:gap-10 items-stretch">
          <div className="space-y-2" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {steps.map((s, i) => {
              const on = i === active;
              return (
                <button key={i} type="button" onClick={() => { setActive(i); setPaused(true); }} className={`relative w-full text-left rounded-2xl px-5 py-4 transition-all duration-500 overflow-hidden ${on ? "bg-white border border-black/[0.06] shadow-elevated" : "hover:bg-foreground/[0.03]"}`}>
                  <div className="flex items-center gap-4">
                    <span className={`grid place-items-center h-9 w-9 shrink-0 rounded-full text-xs font-semibold tabular-nums transition-colors duration-500 ${on ? "gradient-primary text-white" : "bg-foreground/[0.06] text-muted-foreground"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={`font-display text-lg font-medium transition-colors ${on ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</h3>
                  </div>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="pl-[52px] text-[15px] text-muted-foreground overflow-hidden">
                        <span className="block pt-2">{s.desc}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {on && !paused && inView && <motion.span key={`p${active}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4.2, ease: "linear" }} className="absolute left-0 bottom-0 h-[2px] w-full origin-left gradient-primary" />}
                </button>
              );
            })}
          </div>
          <div className="relative rounded-[28px] overflow-hidden min-h-[320px] md:min-h-[420px] grid place-items-center p-8 bg-[radial-gradient(120%_90%_at_80%_0%,hsl(34_95%_88%),transparent_60%),radial-gradient(90%_80%_at_0%_100%,hsl(17_95%_90%),transparent_60%)] bg-neutral-50 border border-black/[0.05]">
            <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(0_0%_0%/.12)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.45, ease }} className="relative w-full grid place-items-center">
                <StepVisual i={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-50 px-3 pt-3">
        <div className="container max-w-6xl flex items-center justify-between h-14 rounded-full bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] pl-5 pr-2">
          <Link to="/" aria-label="Revorra home" className="text-foreground"><Logo className="h-[14px]" /></Link>
          <div className="flex items-center gap-1">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition rounded-full">Login</Link>
            <Link to="/register" className="px-5 h-10 inline-flex items-center text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition active:scale-[0.98]">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative -mt-[68px] pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-[0.5] [background-image:linear-gradient(hsl(0_0%_0%/.04)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_0%/.04)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container relative pt-20 pb-12 md:pt-28 md:pb-16">
          <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-4xl mx-auto">
            <motion.span variants={{ h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }} className="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white border border-black/[0.06] shadow-card text-[13px] font-medium text-foreground/80">
              <span className="relative grid place-items-center h-5 w-5 rounded-full bg-primary/10"><span className="absolute h-2 w-2 rounded-full bg-primary animate-ping opacity-60" /><span className="h-2 w-2 rounded-full bg-primary" /></span>
              Start Earning Today
            </motion.span>
            <motion.h1 variants={{ h: { opacity: 0, y: 24 }, s: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }} className="mt-7 text-[44px] leading-[1.02] md:text-7xl md:leading-[0.98] font-display font-semibold tracking-[-0.01em] text-balance">
              Upgrade your lifestyle by{" "}
              <span className="relative inline-block">
                <span className="relative text-gradient">earning on the go</span>
              </span>
            </motion.h1>
            <motion.p variants={{ h: { opacity: 0, y: 16 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="mt-6 text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              Complete tasks, share content, play games and invite friends - turn your time into real money.
            </motion.p>
            <motion.div variants={{ h: { opacity: 0, y: 16 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
              <PillCta to="/register">Get Started</PillCta>
              <Link to="/login" className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white border border-black/[0.08] text-[15px] font-medium text-foreground shadow-card hover:border-black/20 transition active:scale-[0.98]">Login</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <HowItWorks />

      {/* Top Earners */}
      <section className="py-20 md:py-28 bg-neutral-50 border-y border-black/[0.04]">
        <div className="container max-w-6xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} className="text-3xl md:text-5xl font-display font-semibold tracking-[-0.005em] text-center">Top Earners</motion.h2>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease }} className="mt-12 max-w-xl mx-auto rounded-[24px] bg-white border border-black/[0.06] shadow-elevated p-2">
            {TOP_EARNERS.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease }}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 ${i === 0 ? "bg-gradient-to-r from-orange-50 to-amber-50/40" : ""} ${i > 0 ? "border-t border-black/[0.05]" : ""}`}>
                <span className={`w-7 text-sm font-semibold tabular-nums ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>#{i + 1}</span>
                <div className={`h-10 w-10 rounded-full grid place-items-center font-semibold text-sm ${i === 0 ? "gradient-primary text-white ring-4 ring-orange-100" : "bg-foreground/[0.06] text-foreground"}`}>{e.avatar}</div>
                <p className="flex-1 font-medium text-[15px]">{e.name}</p>
                <span className="font-display text-lg font-semibold tabular-nums tracking-tight">€<CountUp value={e.earnings} /></span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, ease }} className="relative overflow-hidden rounded-[32px] gradient-primary px-7 py-14 md:px-16 md:py-20">
            <div aria-hidden className="absolute -right-16 -bottom-24 md:-right-10 md:-bottom-32 text-white/[0.12] pointer-events-none"><Logo icon className="h-[300px] md:h-[440px]" /></div>
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_100%_at_0%_0%,hsl(0_0%_100%/.18),transparent_60%)]" />
            <div className="relative max-w-xl">
              <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-[-0.01em] leading-[1.02] text-white">Ready to Start Earning?</h2>
              <p className="mt-5 text-white/85 text-lg max-w-md">Join thousands of users already earning rewards on Revorra.</p>
              <div className="mt-9"><PillCta to="/register" light>Create Free Account</PillCta></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] pt-14 overflow-hidden">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-y-10 gap-x-6">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 text-foreground"><Logo className="h-[14px]" /></div>
              <p className="text-sm text-muted-foreground max-w-[240px]">Upgrade your lifestyle by earning on the go.</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Company</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground transition">About</Link>
                <Link to="/blog" className="block hover:text-foreground transition">Blog</Link>
                <Link to="/contact" className="block hover:text-foreground transition">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Legal</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground transition">Terms & Conditions</a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Get Started</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <Link to="/register" className="block hover:text-foreground transition">Register</Link>
                <Link to="/login" className="block hover:text-foreground transition">Login</Link>
              </div>
            </div>
          </div>
          <div aria-hidden className="mt-16 text-foreground/[0.06] select-none"><Logo fluid className="h-auto w-full" /></div>
          <p className="text-xs text-muted-foreground border-t border-black/[0.06] py-6">© {new Date().getFullYear()} Revorra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
