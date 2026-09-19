import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getActivitiesByUser } from "@/lib/db";
import { formatCurrency, getProgressPercent } from "@/lib/utils";
import CircularProgress from "@/components/CircularProgress";
import Card from "@/components/Card";
import Link from "next/link";
import { TrendingUp, ArrowDownToLine, Tag, Users } from "lucide-react";
import { getProspectRewardAmount } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import ReferralLinkActions from "@/components/ReferralLinkActions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  const percent = getProgressPercent(user.monthlyAchieved, user.monthlyTarget);
  const activities = await getActivitiesByUser(user.id);
  const rewardPerProspect = await getProspectRewardAmount();
  const growth = user.monthlyAchieved > 0 ? user.monthlyAchieved * 0.15 : 0;

  return (
    <div className="px-5 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Bonjour,</p>
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        </div>
        <LogoutButton />
      </header>

      <Card blue className="mb-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium opacity-90">Performance du mois</span>
          </div>
          <p className="text-lg font-semibold leading-snug">
            Vos ventes ont progressé de{" "}
            <span className="font-bold">{formatCurrency(growth)}</span> ce mois.
          </p>
        </div>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 right-8 h-16 w-16 rounded-full bg-white/10" />
      </Card>

      {user.promoCode && (
        <Card className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Tag size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Votre code promo</p>
                <p className="font-mono text-lg font-bold text-primary">{user.promoCode}</p>
              </div>
            </div>
            <Link
              href="/dashboard/prospects"
              className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
            >
              <Users size={14} />
              Prospects
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            +{formatCurrency(rewardPerProspect)} crédité par prospect qualifié via WhatsApp
          </p>
          <ReferralLinkActions promoCode={user.promoCode} />
        </Card>
      )}

      <Card className="mb-5 text-center">
        <CircularProgress percent={percent} />
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(user.monthlyAchieved)}
          </p>
          <p className="text-sm text-gray-400">
            sur {formatCurrency(user.monthlyTarget)} d&apos;objectif
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 py-3">
            <p className="text-xs text-gray-400">Solde disponible</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(user.balance)}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 py-3">
            <p className="text-xs text-gray-400">Objectif restant</p>
            <p className="text-lg font-bold text-gray-700">
              {formatCurrency(Math.max(0, user.monthlyTarget - user.monthlyAchieved))}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/wallet"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary py-3.5 font-semibold text-primary transition-all hover:bg-primary/5"
        >
          <ArrowDownToLine size={20} />
          Retirer
        </Link>
      </Card>

      {activities.length > 0 && (
        <Card>
          <h2 className="mb-4 font-semibold text-gray-800">Activité récente</h2>
          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      act.amount >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {act.amount >= 0 ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{act.label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(act.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    act.amount >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {act.amount >= 0 ? "+" : ""}
                  {formatCurrency(act.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
