import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
          <Link to="/login" className="px-4 py-2 text-sm font-medium gradient-primary text-primary-foreground rounded-xl cursor-pointer">Login</Link>
        </div>
      </header>
      <div className="container py-12 max-w-md">
        <h1 className="text-3xl font-display font-bold mb-6">Contact Us</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <textarea rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none" />
          </div>
          <button type="submit" className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
