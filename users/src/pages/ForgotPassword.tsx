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
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="container flex items-center h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-6 md:p-8 border">
          <h1 className="text-2xl font-display font-bold mb-1">Reset Password</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter your email to receive reset instructions</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
            </div>
            <button type="submit" className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition">
              Send Reset Link
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            <Link to="/login" className="text-primary font-medium cursor-pointer">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
