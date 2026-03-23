import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Users, Zap, Trophy } from "lucide-react";
import { TOP_EARNERS } from "@/lib/data";

const steps = [
  { icon: <Users className="h-6 w-6" />, title: "Create Account", desc: "Sign up in seconds and get your welcome bonus." },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Complete Tasks", desc: "Simple tasks like following pages and visiting links." },
  { icon: <Zap className="h-6 w-6" />, title: "Invite Friends", desc: "Earn from every friend who joins with your link." },
  { icon: <Trophy className="h-6 w-6" />, title: "Earn Rewards", desc: "Withdraw your earnings to your bank or crypto wallet." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition cursor-pointer">Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium gradient-primary text-primary-foreground rounded-xl cursor-pointer hover:opacity-90 transition">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            Start Earning Today
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Upgrade your lifestyle by{" "}
            <span className="text-gradient">earning on the go</span>
          </h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-lg mx-auto">
            Complete tasks, share content, play games and invite friends — turn your time into real money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/register" className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="border-2 border-foreground text-foreground px-8 py-3.5 rounded-xl font-semibold cursor-pointer hover:bg-foreground hover:text-background transition">
              Login
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">How Revorra Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border shadow-card text-center"
              >
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground mx-auto mb-4">{s.icon}</div>
                <h3 className="font-display font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Earners */}
      <section className="py-16 container">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">Top Earners</h2>
        <div className="max-w-md mx-auto space-y-3">
          {TOP_EARNERS.map((e, i) => (
            <div key={i} className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-card">
              <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{e.avatar}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{e.name}</p>
              </div>
              <span className="font-display font-bold text-primary">€{e.earnings.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-16">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Join thousands of users already earning rewards on Revorra.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3.5 rounded-xl font-bold cursor-pointer hover:opacity-90 transition">
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-display font-bold text-gradient text-lg mb-3">Revorra</h3>
              <p className="text-xs text-muted-foreground">Upgrade your lifestyle by earning on the go.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground cursor-pointer">About</Link>
                <Link to="/blog" className="block hover:text-foreground cursor-pointer">Blog</Link>
                <Link to="/contact" className="block hover:text-foreground cursor-pointer">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground cursor-pointer">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground cursor-pointer">Terms & Conditions</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Get Started</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/register" className="block hover:text-foreground cursor-pointer">Register</Link>
                <Link to="/login" className="block hover:text-foreground cursor-pointer">Login</Link>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-8">© {new Date().getFullYear()} Revorra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
