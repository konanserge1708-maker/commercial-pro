"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { X, Loader2, Users } from "lucide-react";

interface Prospect {
  id: string;
  name: string;
  phone: string;
  paymentRef?: string | null;
  rewardAmount: number;
  createdAt: string;
}

interface AgentProspectsModalProps {
  open: boolean;
  agentId: string | null;
  agentName?: string;
  onClose: () => void;
}

export default function AgentProspectsModal({
  open,
  agentId,
  agentName,
  onClose,
}: AgentProspectsModalProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [totalReward, setTotalReward] = useState(0);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !agentId) return;
    setLoading(true);
    fetch(`/api/admin/prospects?agentId=${encodeURIComponent(agentId)}`)
      .then((r) => r.json())
      .then((data) => {
        setProspects(data.prospects || []);
        setTotalReward(data.totalReward || 0);
        setPromoCode(data.agent?.promoCode || null);
      })
      .finally(() => setLoading(false));
  }, [open, agentId]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Prospects — {agentName}
            </h2>
            <p className="text-sm text-gray-400">
              {promoCode && (
                <span className="mr-2 font-mono font-semibold text-primary">{promoCode}</span>
              )}
              {prospects.length} prospect(s) · {formatCurrency(totalReward)} gagnés
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-400">Aucun prospect pour cet agent</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                    <th className="pb-3 pr-3">Client</th>
                    <th className="pb-3 pr-3">Téléphone</th>
                    <th className="pb-3 pr-3">Récompense</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-xs font-bold text-green-600">
                            {(p.name || p.phone).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {p.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-sm text-gray-600">
                        {formatPhone(p.phone)}
                      </td>
                      <td className="py-3 pr-3 text-sm font-semibold text-green-600">
                        +{formatCurrency(p.rewardAmount)}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
