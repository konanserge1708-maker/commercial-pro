import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getProspectsByAgent, getProspectRewardAmount } from "@/lib/db";
import { formatCurrency, formatPhone } from "@/lib/utils";
import Card from "@/components/Card";
import LogoutButton from "@/components/LogoutButton";
import { Users, UserCheck } from "lucide-react";

export default async function ProspectsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  const prospects = await getProspectsByAgent(user.id);
  const rewardPerProspect = await getProspectRewardAmount();
  const totalEarned = prospects.reduce((sum, p) => sum + p.rewardAmount, 0);

  return (
    <div className="px-5 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes prospects</h1>
          <p className="text-sm text-gray-500">
            Clients qualifiés via votre code promo
          </p>
        </div>
        <LogoutButton />
      </header>

      {user.promoCode && (
        <Card blue className="mb-5 text-center">
          <p className="text-sm opacity-80">Votre code promo</p>
          <p className="text-3xl font-bold tracking-widest">{user.promoCode}</p>
          <p className="mt-2 text-xs opacity-70">
            Partagez ce code sur WhatsApp pour enregistrer vos clients
          </p>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card>
          <Users className="mb-1 text-primary" size={22} />
          <p className="text-2xl font-bold text-gray-900">{prospects.length}</p>
          <p className="text-xs text-gray-400">Prospects qualifiés</p>
        </Card>
        <Card>
          <UserCheck className="mb-1 text-green-600" size={22} />
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-gray-400">Gains prospects</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Liste des prospects</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            +{formatCurrency(rewardPerProspect)} / prospect
          </span>
        </div>

        {prospects.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucun prospect pour le moment</p>
            <p className="mt-1 text-xs text-gray-400">
              Les clients qui paient via WhatsApp avec votre code apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-600">
                    {prospect.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{prospect.name}</p>
                    <p className="text-xs text-gray-400">{formatPhone(prospect.phone)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(prospect.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Qualifié
                  </span>
                  <p className="mt-1 text-sm font-bold text-green-600">
                    +{formatCurrency(prospect.rewardAmount)}
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
