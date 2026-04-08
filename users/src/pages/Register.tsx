import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    referral_code: searchParams.get("ref") || "",
  });

  // Validation states
  const [validation, setValidation] = useState({
    full_name: { valid: false, checked: false },
    username: { valid: false, checked: false, checking: false, available: null },
    email: { valid: false, checked: false },
    phone: { valid: false, checked: false },
    password: { valid: false, checked: false },
  });

  // Check username availability
  const checkUsername = async (username: string) => {
    if (username.length < 3 || username.length > 30) {
      setValidation(v => ({ ...v, username: { valid: false, checked: true, checking: false, available: false } }));
      return;
    }
    
    // Check format first
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      setValidation(v => ({ ...v, username: { valid: false, checked: true, checking: false, available: false } }));
      return;
    }

    setValidation(v => ({ ...v, username: { ...v.username, checking: true } }));

    try {
      // Try to check if username exists (this endpoint might not exist, so we'll handle that)
      // For now, we just validate format client-side
      setValidation(v => ({ ...v, username: { valid: true, checked: true, checking: false, available: true } }));
    } catch {
      setValidation(v => ({ ...v, username: { valid: true, checked: true, checking: false, available: true } }));
    }
  };

  // Real-time validation effects
  useEffect(() => {
    // Full name validation
    const fullNameValid = form.full_name.trim().length >= 2;
    setValidation(v => ({ ...v, full_name: { valid: fullNameValid, checked: form.full_name.length > 0 } }));

    // Username validation with debounce
    const timer = setTimeout(() => {
      if (form.username) {
        checkUsername(form.username);
      } else {
        setValidation(v => ({ ...v, username: { valid: false, checked: false, checking: false, available: null } }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username]);

  useEffect(() => {
    // Email validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    setValidation(v => ({ ...v, email: { valid: emailValid, checked: form.email.length > 0 } }));
  }, [form.email]);

  useEffect(() => {
    // Phone validation - at least 10 digits
    const phoneValid = form.phone.replace(/\D/g, '').length >= 10;
    setValidation(v => ({ ...v, phone: { valid: phoneValid, checked: form.phone.length > 0 } }));
  }, [form.phone]);

  useEffect(() => {
    // Password validation
    const passwordValid = form.password.length >= 6;
    setValidation(v => ({ ...v, password: { valid: passwordValid, checked: form.password.length > 0 } }));
  }, [form.password]);

  // Check if form is ready to submit
  const canSubmit = 
    validation.full_name.valid &&
    validation.username.valid &&
    validation.email.valid &&
    validation.phone.valid &&
    validation.password.valid &&
    !isSubmitting;

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      // Show specific error for first invalid field
      if (!validation.full_name.valid) {
        toast.error("Please enter your full name");
        return;
      }
      if (!validation.username.valid) {
        toast.error("Please enter a valid username (3-30 characters, letters, numbers, underscores, dots)");
        return;
      }
      if (!validation.email.valid) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!validation.phone.valid) {
        toast.error("Please enter a valid phone number");
        return;
      }
      if (!validation.password.valid) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      return;
    }

    setIsSubmitting(true);

    const result = await register(form);
    if (result.success) {
      toast.success("Welcome to Revorra! You earned a €1.50 bonus! 🎉");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
    
    setIsSubmitting(false);
  };

  // Validation icon component
  const ValidationIcon = ({ valid, checked, checking }: { valid: boolean; checked: boolean; checking?: boolean }) => {
    if (checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (!checked) return null;
    return valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (form.password.length === 0) return { level: 0, text: "", color: "" };
    if (form.password.length < 6) return { level: 1, text: "Too short", color: "bg-red-500" };
    if (form.password.length < 8) return { level: 2, text: "Weak", color: "bg-orange-500" };
    if (form.password.length < 12) return { level: 3, text: "Good", color: "bg-yellow-500" };
    return { level: 4, text: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Full Name</label>
                <ValidationIcon valid={validation.full_name.valid} checked={validation.full_name.checked} />
              </div>
              <input 
                type="text" 
                value={form.full_name} 
                onChange={e => update("full_name", e.target.value)} 
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${validation.full_name.checked && !validation.full_name.valid ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {validation.full_name.checked && !validation.full_name.valid && (
                <p className="text-xs text-red-500 mt-1">Name must be at least 2 characters</p>
              )}
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Username</label>
                <ValidationIcon valid={validation.username.valid} checked={validation.username.checked} checking={validation.username.checking} />
              </div>
              <input 
                type="text" 
                value={form.username} 
                onChange={e => update("username", e.target.value.toLowerCase())} 
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${validation.username.checked && !validation.username.valid ? 'border-red-500' : ''}`}
                placeholder="Choose a username"
              />
              {validation.username.checked && !validation.username.valid && (
                <p className="text-xs text-red-500 mt-1">3-30 chars, letters, numbers, underscores, dots only</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Email</label>
                <ValidationIcon valid={validation.email.valid} checked={validation.email.checked} />
              </div>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => update("email", e.target.value)} 
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${validation.email.checked && !validation.email.valid ? 'border-red-500' : ''}`}
                placeholder="your@email.com"
              />
              {validation.email.checked && !validation.email.valid && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Phone Number</label>
                <ValidationIcon valid={validation.phone.valid} checked={validation.phone.checked} />
              </div>
              <input 
                type="tel" 
                value={form.phone} 
                onChange={e => update("phone", e.target.value)} 
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${validation.phone.checked && !validation.phone.valid ? 'border-red-500' : ''}`}
                placeholder="Phone number"
              />
              {validation.phone.checked && !validation.phone.valid && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid phone number</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Password</label>
                <ValidationIcon valid={validation.password.valid} checked={validation.password.checked} />
              </div>
              <div className="relative">
                <input 
                  type={showPw ? "text" : "password"} 
                  value={form.password} 
                  onChange={e => update("password", e.target.value)} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition pr-10 ${validation.password.checked && !validation.password.valid ? 'border-red-500' : ''}`}
                  placeholder="Create a password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.level ? passwordStrength.color : 'bg-muted'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{passwordStrength.text}</p>
                </div>
              )}
              {validation.password.checked && !validation.password.valid && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Referral Code (optional)</label>
              <input 
                value={form.referral_code} 
                onChange={e => update("referral_code", e.target.value)} 
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                placeholder="Enter referral code"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={!canSubmit}
              className={`w-full py-3 rounded-xl font-semibold transition mt-2 flex items-center justify-center gap-2 ${
                canSubmit 
                  ? 'gradient-primary text-primary-foreground hover:opacity-90 cursor-pointer' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Help text when button is disabled */}
            {!canSubmit && !isSubmitting && (
              <p className="text-xs text-center text-muted-foreground">
                Fill in all fields correctly to enable registration
              </p>
            )}
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account? <Link to="/login" className="text-primary font-medium cursor-pointer hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
