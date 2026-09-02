"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Card from "@/components/Card";
import { Loader2, Save, CheckCircle, Key, Coins } from "lucide-react";

export default function AdminSettingsPage() {
  const [rewardAmount, setRewardAmount] = useState("250");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setRewardAmount(String(data.settings.prospectRewardAmount));
          setApiKey(data.settings.apiKey || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectRewardAmount: Number(rewardAmount),
          apiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la sauvegarde");
        return;
      }
      setSuccess("Paramètres enregistrés avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Paramètres"
        subtitle="Configuration des récompenses et de l'API"
      />

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Coins className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Récompense par prospect</h2>
              <p className="text-sm text-gray-400">
                Montant crédité sur le solde de l&apos;agent pour chaque prospect qualifié
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              min={1}
              className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 py-3 pl-4 pr-16 text-lg font-bold focus:border-primary focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              FCFA
            </span>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Key className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Clé API WhatsApp</h2>
              <p className="text-sm text-gray-400">
                Clé requise pour les requêtes GET de la plateforme externe
              </p>
            </div>
          </div>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm focus:border-primary focus:outline-none"
            placeholder="commercial-api-key-change-me"
          />
        </Card>

        <Card className="bg-gray-50/80">
          <h3 className="mb-2 font-semibold text-gray-800">Documentation API</h3>
          <p className="mb-3 text-sm text-gray-500">
            Appeler cette URL en GET depuis la plateforme WhatsApp après un paiement :
          </p>
          <code className="block overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-green-400">
            {typeof window !== "undefined"
              ? `${window.location.origin}/api/prospects/register?code=CODE_PROMO&phone=0701020304&payment_ref=REF123&api_key=${apiKey || "VOTRE_CLE"}`
              : "/api/prospects/register?code=...&phone=...&payment_ref=...&api_key=..."}
          </code>
          <ul className="mt-3 space-y-1 text-xs text-gray-500">
            <li><strong>code</strong> — code promo de l&apos;agent</li>
            <li><strong>phone</strong> — numéro du client</li>
            <li><strong>payment_ref</strong> — référence unique du paiement (optionnel)</li>
            <li><strong>name</strong> — nom du client (optionnel)</li>
            <li><strong>api_key</strong> — clé API configurée ci-dessus</li>
          </ul>
        </Card>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save size={18} />
              Enregistrer les paramètres
            </>
          )}
        </button>
      </form>
    </>
  );
}
