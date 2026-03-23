import { useState, useEffect } from "react";
import { getTransactions } from "@/api/walletApi";
import BackButton from "@/components/BackButton";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const res = await getTransactions();
        setTransactions(res.data.data);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <BackButton />
      <h1 className="text-xl font-display font-bold mb-1">History</h1>
      <p className="text-sm text-muted-foreground mb-6">Your earnings history</p>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-card border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No earnings yet. Start completing tasks to see your history!
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b bg-muted/50 text-xs font-semibold text-muted-foreground">
            <span>Date</span>
            <span>Activity</span>
            <span>Amount</span>
            <span>Wallet</span>
          </div>
          {transactions.map((t) => (
            <div key={t.id || t._id} className="grid grid-cols-4 gap-2 px-4 py-3 border-b last:border-0 text-sm">
              <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs font-medium truncate">{t.type}</span>
              <span className={`text-xs font-bold ${t.amount >= 0 ? "text-primary" : "text-red-500"}`}>
                {t.amount >= 0 ? "+" : ""}€{Math.abs(t.amount).toFixed(2)}
              </span>
              <span className="text-xs capitalize text-muted-foreground">{t.wallet_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
