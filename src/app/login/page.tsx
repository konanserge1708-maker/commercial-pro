"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, ArrowLeft } from "lucide-react";
import PinInput from "@/components/PinInput";
import { formatPhone } from "@/lib/utils";

type Step = 1 | 2;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanPhone = phone.replace(/\D/g, "");

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(formatPhone(digits));
  };

  const handlePhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cleanPhone.length < 8) {
      setError("Veuillez entrer un numéro valide");
      return;
    }

    setStep(2);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length !== 4) {
      setError("Le code PIN doit contenir 4 chiffres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      router.push(data.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setPin("");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
            <span className="text-2xl font-bold text-white">CP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Commercial Pro</h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1
              ? "Entrez votre numéro de téléphone"
              : "Entrez votre code PIN"}
          </p>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step >= 1 ? "bg-primary" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step >= 2 ? "bg-primary" : "bg-gray-200"
            }`}
          />
        </div>

        {step === 1 ? (
          <form
            onSubmit={handlePhoneNext}
            className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-xl"
          >
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="07 00 00 00 00"
                  autoFocus
                  maxLength={14}
                  className="w-full rounded-2xl border-2 border-gray-100 bg-white py-3.5 pl-12 pr-4 text-gray-800 tracking-wide transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark"
            >
              Continuer
            </button>
          </form>
        ) : (
          <form
            onSubmit={handlePinSubmit}
            className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={goBack}
              className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-primary"
            >
              <ArrowLeft size={16} />
              Modifier le numéro
            </button>

            <div className="mb-6 rounded-2xl bg-gray-50 py-3 text-center">
              <p className="text-xs text-gray-400">Numéro saisi</p>
              <p className="font-semibold text-gray-800">{formatPhone(cleanPhone)}</p>
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-center text-sm font-medium text-gray-600">
                Code PIN (4 chiffres)
              </label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
