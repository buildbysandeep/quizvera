import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "slate" | "violet";
};

const tones = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
} satisfies Record<NonNullable<StatCardProps["tone"]>, string>;

export function StatCard({ title, value, description, icon: Icon, tone = "indigo" }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="pr-2 text-sm font-medium text-slate-600">{title}</CardTitle>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-950">{value}</div>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
