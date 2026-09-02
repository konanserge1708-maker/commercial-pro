import { LucideIcon, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp = true,
}: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white/90 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <Icon size={20} className="text-primary" />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            <TrendingUp size={12} className={trendUp ? "" : "rotate-180"} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-400">{label}</p>
    </div>
  );
}
