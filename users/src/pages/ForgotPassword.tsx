import AuthShell from "@/components/AuthShell";
import Logo from "@/components/Logo";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    toast.success("Password reset instructions sent to your email");
  };

  return (
    <AuthShell>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-2">Reset Password</h1>
          <p className="text-[15px] text-muted-foreground mb-8">Enter your email to receive reset instructions</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-foreground/80">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 border border-black/10 rounded-xl px-4 text-[15px] bg-white placeholder:text-muted-foreground/60 hover:border-black/20 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition" />
            </div>
            <button type="submit" className="w-full h-12 gradient-primary text-white rounded-full font-medium cursor-pointer shadow-[0_8px_24px_-8px_rgba(234,88,12,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(234,88,12,0.7)] active:scale-[0.99] transition">
              Send Reset Link
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-8">
            <Link to="/login" className="text-primary font-medium cursor-pointer">Back to Login</Link>
          </p>
    </AuthShell>
  );
}
