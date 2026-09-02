"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, History } from "lucide-react";
import Card from "@/components/Card";
import LogoutButton from "@/components/LogoutButton";
import { formatCurrency } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setBalance(d.user?.balance ?? 0))
      .catch(console.error);

    fetch("/api/withdrawals")
      .then((r) => r.json())
      .then((d) => setWithdrawals(d.withdrawals || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du retrait.");
        return;
      }

      setSuccess(`Retrait de ${formatCurrency(Number(amount))} demandé. En attente de validation.`);
      setAmount("");
      loadData();
    } catch {
      setError("Impossible d'effectuer le retrait.");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [5000, 10000, 25000, 50000];

  return (
    <div className="px-5 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portefeuille</h1>
          <p className="text-sm text-gray-500">Consultez votre solde et retirez</p>
        </div>
        <LogoutButton />
      </header>

      <Card blue className="mb-5 text-center">
        <p className="text-sm opacity-80">Solde disponible</p>
        <p className="mt-1 text-4xl font-bold">{formatCurrency(balance)}</p>
      </Card>

      <Card className="mb-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <ArrowDownToLine size={20} className="text-primary" />
          Effectuer un retrait
        </h3>

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-500">Montant (FCFA)</label>
            <input
              type="number"
              min="1"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl border-2 border-gray-100 bg-white py-3.5 px-4 text-xl font-bold outline-none focus:border-primary"
              required
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(Math.min(q, balance)))}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
              >
                {formatCurrency(q)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(balance))}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
            >
              Tout
            </button>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) > balance}
            className="w-full rounded-2xl bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {loading ? "Traitement..." : "Retirer"}
          </button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <History size={20} className="text-gray-400" />
          Historique
        </h3>

        {withdrawals.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            Aucune transaction pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-800">Retrait</p>
                  <p className="text-xs text-gray-400">
                    {new Date(w.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-500">
                    -{formatCurrency(w.amount)}
                  </span>
                  <p
                    className={`mt-0.5 text-xs font-semibold ${
                      w.status === "pending"
                        ? "text-amber-600"
                        : w.status === "completed"
                          ? "text-green-600"
                          : "text-red-500"
                    }`}
                  >
                    {w.status === "pending"
                      ? "En attente"
                      : w.status === "completed"
                        ? "Validé"
                        : "Refusé"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
