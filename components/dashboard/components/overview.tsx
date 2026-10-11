"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardOverview } from "@/types/dashboard";

type OverviewProps = {
  overview: DashboardOverview;
};

export function Overview({ overview }: OverviewProps) {
  const total = overview.data.reduce((sum, point) => sum + point.total, 0);
  const tickInterval = overview.granularity === "day" && overview.data.length > 18 ? Math.ceil(overview.data.length / 9) : 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <p className="text-sm font-semibold text-slate-800">Quiz submissions</p>
          <p className="mt-1 text-xs text-slate-500">
            Submissions per {overview.granularity === "day" ? "day" : "month"} in the selected period
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-slate-950">{total.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total in range</p>
        </div>
      </div>

      <div className="h-[280px] w-full sm:h-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={overview.data} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              interval={tickInterval}
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "#eef2ff", radius: 6 }}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgb(15 23 42 / 0.08)",
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value ?? 0)} submissions`, "Submissions"]}
              labelStyle={{ color: "#0f172a", fontWeight: 600, marginBottom: 4 }}
            />
            <Bar dataKey="total" name="Submissions" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {total === 0 && (
        <p className="mt-2 text-center text-xs text-slate-500">
          No submissions were recorded during this period. The chart shows zero for each date bucket.
        </p>
      )}
    </div>
  );
}
