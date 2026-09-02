import Link from "next/link";
import { getAllAgents, getAllWithdrawals } from "@/lib/db";
import { formatCurrency, formatPhone, getProgressPercent } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/admin/StatCard";
import { Users, Wallet, TrendingUp, ArrowDownToLine, UserPlus } from "lucide-react";

export default async function AdminPage() {
  const agents = await getAllAgents();
  const withdrawals = await getAllWithdrawals();
  const totalBalance = agents.reduce((sum, a) => sum + a.balance, 0);
  const totalAchieved = agents.reduce((sum, a) => sum + a.monthlyAchieved, 0);
  const activeAgents = agents.filter((a) => a.monthlyAchieved > 0).length;
  const activePct = agents.length > 0 ? Math.round((activeAgents / agents.length) * 100) : 0;

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre équipe commerciale"
        actions={
          <Link
            href="/admin/agents"
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark"
          >
            <UserPlus size={18} />
            Ajouter un agent
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total agents"
          value={String(agents.length)}
          icon={Users}
          trend={agents.length > 0 ? `+${activePct}% actifs` : undefined}
        />
        <StatCard
          label="Soldes totaux"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
        />
        <StatCard
          label="Ventes du mois"
          value={formatCurrency(totalAchieved)}
          icon={TrendingUp}
          trend="+ ce mois"
        />
        <StatCard
          label="Retraits effectués"
          value={String(withdrawals.length)}
          icon={ArrowDownToLine}
        />
      </div>

      <div className="mb-4 flex gap-1 border-b border-white/40">
        <span className="border-b-2 border-primary px-4 py-2 text-sm font-semibold text-primary">
          Vue d&apos;ensemble
        </span>
        <Link
          href="/admin/agents"
          className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-primary"
        >
          Tous les agents
        </Link>
        <Link
          href="/admin/withdrawals"
          className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-primary"
        >
          Retraits
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-800">Agents récents</h2>
          <p className="text-sm text-gray-400">Performance et statut de votre équipe</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Solde</th>
                <th className="px-5 py-3">Progression</th>
              </tr>
            </thead>
            <tbody>
              {agents.slice(0, 6).map((agent) => {
                const pct = getProgressPercent(agent.monthlyAchieved, agent.monthlyTarget);
                const status =
                  pct >= 80
                    ? { label: "Performant", cls: "bg-green-50 text-green-700" }
                    : agent.monthlyAchieved > 0
                      ? { label: "En cours", cls: "bg-blue-50 text-primary" }
                      : { label: "Inactif", cls: "bg-gray-100 text-gray-500" };

                return (
                  <tr key={agent.id} className="border-b border-gray-50 hover:bg-primary/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{agent.name}</p>
                          <p className="text-xs text-gray-400">{formatPhone(agent.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      {formatCurrency(agent.balance)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">
                    Aucun agent.{" "}
                    <Link href="/admin/agents" className="font-medium text-primary">
                      Créer le premier compte
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {agents.length > 6 && (
          <div className="border-t border-gray-100 px-5 py-3 text-center">
            <Link href="/admin/agents" className="text-sm font-medium text-primary">
              Voir tous les agents ({agents.length})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
