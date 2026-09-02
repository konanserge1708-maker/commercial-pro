import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getWeeklyPerformance } from "@/lib/db";
import { formatCurrency, getProgressPercent } from "@/lib/utils";
import Card from "@/components/Card";
import WeeklyChart from "@/components/WeeklyChart";
import LogoutButton from "@/components/LogoutButton";

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default async function PerformancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  const weekly = await getWeeklyPerformance(user.id);
  const weeklyTotal = weekly.reduce((sum, d) => sum + d.amount, 0);
  const percent = getProgressPercent(user.monthlyAchieved, user.monthlyTarget);

  return (
    <div className="px-5 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
          <p className="text-sm text-gray-500">Suivi de vos indicateurs</p>
        </div>
        <LogoutButton />
      </header>

      <Card className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Ventes hebdomadaires</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(weeklyTotal)}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
            <p className="text-xs text-gray-500">Objectif</p>
            <p className="text-lg font-bold text-primary">{percent}%</p>
          </div>
        </div>
        <WeeklyChart data={weekly} />
      </Card>

      <Card className="mb-5">
        <h3 className="mb-4 font-semibold text-gray-800">Résumé du mois</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Réalisé</span>
            <span className="font-bold">{formatCurrency(user.monthlyAchieved)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Objectif</span>
            <span className="font-bold">{formatCurrency(user.monthlyTarget)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-400">
            {percent >= 100
              ? "Objectif atteint !"
              : `Encore ${formatCurrency(Math.max(0, user.monthlyTarget - user.monthlyAchieved))} pour l'objectif`}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-800">Détail journalier</h3>
        <div className="space-y-2">
          {weekly.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
            >
              <span className="text-sm text-gray-600">{DAY_LABELS[i]}</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
