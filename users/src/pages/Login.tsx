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
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="container flex items-center h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-6 md:p-8 border">
          <h1 className="text-2xl font-display font-bold mb-1">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mb-6">Login to your account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Link to="/forgot-password" className="text-xs text-primary font-medium cursor-pointer">Forgot password?</Link>
            <button type="submit" className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition">
              Login
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account? <Link to="/register" className="text-primary font-medium cursor-pointer">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
