export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "").slice(0, 10);
  const parts = cleaned.match(/.{1,2}/g);
  return parts ? parts.join(" ") : "";
}

export function getProgressPercent(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generatePromoCode(name: string): string {
  const prefix =
    name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "AGT";
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}${suffix}`;
}
