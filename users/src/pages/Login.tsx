import AuthShell from "@/components/AuthShell";
import Logo from "@/components/Logo";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    const ok = await login(email, password);
    if (ok) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error("Invalid login credentials");
    }
  };

  return (
    <AuthShell>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-[15px] text-muted-foreground mb-8">Login to your account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-foreground/80">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 border border-black/10 rounded-xl px-4 text-[15px] bg-white placeholder:text-muted-foreground/60 hover:border-black/20 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition" />
            </div>
            <div>
              <label className="text-[13px] font-medium mb-1.5 block text-foreground/80">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 border border-black/10 rounded-xl px-4 text-[15px] bg-white placeholder:text-muted-foreground/60 hover:border-black/20 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Link to="/forgot-password" className="text-xs text-primary font-medium cursor-pointer">Forgot password?</Link>
            <button type="submit" className="w-full h-12 gradient-primary text-white rounded-full font-medium cursor-pointer shadow-[0_8px_24px_-8px_rgba(234,88,12,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(234,88,12,0.7)] active:scale-[0.99] transition">
              Login
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account? <Link to="/register" className="text-primary font-medium cursor-pointer">Register</Link>
          </p>
    </AuthShell>
  );
}
