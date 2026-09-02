"use client";

import { useState } from "react";
import { formatCurrency, formatPhone, getProgressPercent } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Pencil, Users } from "lucide-react";

export interface AgentRow {
  id: string;
  name: string;
  phone: string;
  promoCode?: string | null;
  balance: number;
  monthlyTarget: number;
  monthlyAchieved: number;
}

interface AgentsTableProps {
  agents: AgentRow[];
  onEdit: (agent: AgentRow) => void;
  onViewProspects: (agent: AgentRow) => void;
  pageSize?: number;
}

function getStatus(agent: AgentRow) {
  const pct = getProgressPercent(agent.monthlyAchieved, agent.monthlyTarget);
  if (pct >= 80) return { label: "Performant", className: "bg-green-50 text-green-700" };
  if (agent.monthlyAchieved > 0) return { label: "En cours", className: "bg-blue-50 text-primary" };
  return { label: "Inactif", className: "bg-gray-100 text-gray-500" };
}

export default function AgentsTable({
  agents,
  onEdit,
  onViewProspects,
  pageSize = 8,
}: AgentsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search.replace(/\D/g, ""))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Tous · {agents.length}
          </span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
            Actifs · {agents.filter((a) => a.monthlyAchieved > 0).length}
          </span>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un agent..."
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Code promo</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Solde</th>
              <th className="px-4 py-3">Objectif</th>
              <th className="px-4 py-3">Progression</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((agent) => {
              const status = getStatus(agent);
              const pct = getProgressPercent(agent.monthlyAchieved, agent.monthlyTarget);
              return (
                <tr
                  key={agent.id}
                  className="border-b border-gray-50 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{agent.name}</p>
                        <p className="text-xs text-gray-400">{formatPhone(agent.phone)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                      {agent.promoCode || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-800">
                    {formatCurrency(agent.balance)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800">
                      {formatCurrency(agent.monthlyAchieved)}
                    </p>
                    <p className="text-xs text-gray-400">
                      / {formatCurrency(agent.monthlyTarget)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewProspects(agent)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                        title="Voir les prospects"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(agent)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  Aucun agent trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400">
          Page {currentPage} sur {totalPages} · {filtered.length} agent(s)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Précédent
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
