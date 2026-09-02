"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WeeklyChartProps {
  data: { day: string; amount: number }[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <Bar dataKey="amount" radius={[8, 8, 8, 8]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.amount === maxAmount && entry.amount > 0 ? "#2E5BFF" : "#E8EDFF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
