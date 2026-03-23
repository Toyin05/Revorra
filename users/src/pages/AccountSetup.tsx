import { useState } from "react";
import { getPayout, savePayout, COUNTRIES } from "@/lib/data";
import { toast } from "sonner";

export default function AccountSetupPage() {
  const existing = getPayout();
  const [method, setMethod] = useState<"bank" | "crypto">(existing?.method || "bank");
  const [form, setForm] = useState({
    country: existing?.country || "",
    bank_name: existing?.bank_name || "",
    account_number: existing?.account_number || "",
    account_name: existing?.account_name || "",
    crypto_wallet: existing?.crypto_wallet || "",
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (method === "bank" && (!form.country || !form.bank_name || !form.account_number || !form.account_name)) {
      toast.error("Please fill all bank fields"); return;
    }
    if (method === "crypto" && !form.crypto_wallet) {
      toast.error("Please enter wallet address"); return;
    }
    savePayout({ method, ...form });
    toast.success("Payout details saved!");
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-display font-bold mb-1">Account Setup</h1>
      <p className="text-sm text-muted-foreground mb-6">Set up your payout method</p>

      <div className="bg-card border rounded-2xl p-5">
        <div className="flex gap-2 mb-5">
          {(["bank", "crypto"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize cursor-pointer transition ${
                method === m ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {m === "bank" ? "Bank Transfer" : "Crypto Wallet"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {method === "bank" ? (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Country</label>
                <select value={form.country} onChange={e => update("country", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition cursor-pointer">
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Bank Name</label>
                <input value={form.bank_name} onChange={e => update("bank_name", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Account Number</label>
                <input value={form.account_number} onChange={e => update("account_number", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">Account Name</label>
                <input value={form.account_name} onChange={e => update("account_name", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">Wallet Address</label>
              <input value={form.crypto_wallet} onChange={e => update("crypto_wallet", e.target.value)} placeholder="Enter your crypto wallet address" className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
            </div>
          )}
          <button onClick={handleSave} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold cursor-pointer hover:opacity-90 transition">
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}
