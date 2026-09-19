"use client";

import { useEffect, useState } from "react";
import PinInput from "@/components/PinInput";
import { formatPhone } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import type { AdminRow } from "./AdminsTable";

interface AdminModalProps {
  open: boolean;
  mode: "create" | "edit";
  admin?: AdminRow | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onCreate: (data: { name: string; phone: string; pin: string }) => void;
  onUpdate: (data: { pin: string }) => void;
}

export default function AdminModal({
  open,
  mode,
  admin,
  loading,
  error,
  onClose,
  onCreate,
  onUpdate,
}: AdminModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open && mode === "create") {
      setName("");
      setPhone("");
      setPin("");
    }
    if (open && mode === "edit") {
      setNewPin("");
    }
  }, [open, mode]);

  if (!open) return null;

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(formatPhone(digits));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "create" ? "Nouvel administrateur" : `Modifier le PIN — ${admin?.name}`}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {mode === "create" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate({ name, phone: phone.replace(/\D/g, ""), pin });
            }}
            className="space-y-4"
          >
            <Field label="Nom complet" value={name} onChange={setName} placeholder="Jean Dupont" required />
            <div>
              <label className="mb-1 block text-sm text-gray-500">Numéro de téléphone</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                placeholder="07 00 00 00 00"
                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 tracking-wide focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-center text-sm text-gray-500">
                Code PIN (4 chiffres)
              </label>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>
            {error && <ErrorBox message={error} />}
            <ModalActions loading={loading || pin.length !== 4} onClose={onClose} submitLabel="Créer l'administrateur" />
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdate({ pin: newPin });
            }}
            className="space-y-4"
          >
            {admin && <p className="text-sm text-gray-400">{formatPhone(admin.phone)}</p>}
            <div>
              <label className="mb-2 block text-center text-sm text-gray-500">
                Nouveau code PIN (4 chiffres)
              </label>
              <PinInput value={newPin} onChange={setNewPin} disabled={loading} />
            </div>
            {error && <ErrorBox message={error} />}
            <ModalActions
              loading={loading || newPin.length !== 4}
              onClose={onClose}
              submitLabel="Enregistrer le nouveau PIN"
            />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{message}</div>
  );
}

function ModalActions({
  loading,
  onClose,
  submitLabel,
}: {
  loading: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-medium text-gray-600"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : submitLabel}
      </button>
    </div>
  );
}
