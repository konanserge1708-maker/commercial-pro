"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatPhone } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Check, X, Loader2 } from "lucide-react";

interface WithdrawalRow {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  agentName: string;
  agentPhone: string;
}

const statusStyle: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const statusLabel: Record<string, string> = {
  pending: "En attente",
  completed: "Validé",
  rejected: "Refusé",
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");

  const fetchWithdrawals = () => {
    fetch("/api/withdrawals")
      .then((r) => r.json())
      .then((data) => setWithdrawals(data.withdrawals || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: string, status: "completed" | "rejected") => {
    const confirmMsg =
      status === "completed"
        ? "Confirmez-vous avoir envoyé l'argent à l'agent ?"
        : "Refuser ce retrait ? Le solde sera remboursé à l'agent.";
    if (!confirm(confirmMsg)) return;

    setActionId(id);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur");
        return;
      }
      fetchWithdrawals();
    } catch {
      alert("Erreur serveur");
    } finally {
      setActionId(null);
    }
  };

  const filtered =
    filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const pendingTotal = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((s, w) => s + w.amount, 0);

  return (
    <>
      <AdminPageHeader
        title="Retraits"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} en attente · ${formatCurrency(pendingTotal)} à traiter`
            : `${withdrawals.length} retrait(s)`
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["pending", "En attente"],
            ["completed", "Validés"],
            ["rejected", "Refusés"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === key
                ? "bg-primary text-white"
                : "bg-white/80 text-gray-500 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {label}
            {key === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Montant</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((wd) => (
                  <tr key={wd.id} className="border-b border-gray-50 hover:bg-primary/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                          {wd.agentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{wd.agentName}</p>
                          <p className="text-xs text-gray-400">
                            {wd.agentPhone ? formatPhone(wd.agentPhone) : "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-red-500">
                      -{formatCurrency(wd.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[wd.status]}`}
                      >
                        {statusLabel[wd.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(wd.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {wd.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(wd.id, "completed")}
                            disabled={actionId === wd.id}
                            className="flex items-center gap-1 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                            title="Valider après envoi d'argent"
                          >
                            {actionId === wd.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Valider
                          </button>
                          <button
                            onClick={() => handleAction(wd.id, "rejected")}
                            disabled={actionId === wd.id}
                            className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            title="Refuser et rembourser"
                          >
                            <X size={14} />
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                    Aucun retrait dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
