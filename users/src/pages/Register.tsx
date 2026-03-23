import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    referral_code: searchParams.get("ref") || "",
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.username || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const ok = await register(form);
    if (ok) {
      toast.success("Welcome to Revorra! You earned a €1.50 bonus! 🎉");
      navigate("/dashboard");
    } else {
      toast.error("Registration failed. Please try again.");
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
          <h1 className="text-2xl font-display font-bold mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start earning rewards today</p>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {([
              ["full_name", "Full Name", "text"],
              ["username", "Username", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone Number", "tel"],
            ] as const).map(([key, label, type]) => (
              <div key={key}>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">{label}</label>
                <input type={type} value={form[key]} onChange={e => update(key, e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Referral Code (optional)</label>
              <input value={form.referral_code} onChange={e => update("referral_code", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" placeholder="Enter referral code" />
            </div>
            <button type="submit" className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition mt-2">
              Create Account
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account? <Link to="/login" className="text-primary font-medium cursor-pointer">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
