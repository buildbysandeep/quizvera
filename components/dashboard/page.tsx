"use client";

import * as React from "react";
import { addMonths, endOfDay, startOfDay, startOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Activity, CheckCircle2, ClipboardList, Layers3, ListChecks, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataStore } from "@/stores/data";
import { CalendarDateRangePicker } from "@/components/dashboard/components/date-range-picker";
import GroupSwitcher from "@/components/dashboard/components/group-switcher";
import { Overview } from "@/components/dashboard/components/overview";
import { RecentScores } from "@/components/dashboard/components/recent-scores";
import { TopScores } from "@/components/dashboard/components/top-scores";
import { StatCard } from "@/components/dashboard/components/stat-card";
import type { DashboardData } from "@/types/dashboard";

function makeDefaultDateRange(): DateRange {
  const today = new Date();
  return {
    from: startOfMonth(addMonths(today, -11)),
    to: today,
  };
}

type DashboardApiResponse = {
  ok: boolean;
  data?: DashboardData;
  error?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export default function DashboardPage() {
  const groups = useDataStore((state) => state.groups ?? []);
  const groupOptions = React.useMemo(() => groups.map((group) => ({ id: group.id, name: group.name })), [groups]);

  const [selectedGroupId, setSelectedGroupId] = React.useState("all");
  const [dateRange, setDateRange] = React.useState<DateRange>(makeDefaultDateRange);
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!dateRange.from || !dateRange.to) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      // Send actual local-day boundaries as ISO instants. Sending date-only
      // strings makes a UTC server miss the first few hours of dates in timezones
      // such as Asia/Kolkata.
      const params = new URLSearchParams({
        from: startOfDay(dateRange.from!).toISOString(),
        to: endOfDay(dateRange.to!).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });

      if (selectedGroupId !== "all") {
        params.set("groupId", selectedGroupId);
      }

      try {
        const response = await fetch(`/api/dashboard?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as DashboardApiResponse;

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error || "Unable to load dashboard data.");
        }

        setDashboard(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setErrorMessage(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => controller.abort();
  }, [dateRange.from, dateRange.to, selectedGroupId, refreshKey]);

  const handleDateRangeChange = React.useCallback((range: DateRange | undefined) => {
    setDateRange(range ?? makeDefaultDateRange());
  }, []);

  const selectedGroupName =
    selectedGroupId === "all"
      ? "all your groups"
      : (groupOptions.find((group) => group.id === selectedGroupId)?.name ?? "selected group");

  if (isLoading && !dashboard) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
          <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (errorMessage && !dashboard) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-xl items-center justify-center p-5">
        <Card className="w-full rounded-2xl border-rose-200 shadow-sm">
          <CardHeader>
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-rose-50">
              <Activity className="h-5 w-5 text-rose-600" />
            </div>
            <CardTitle className="text-lg">Dashboard data unavailable</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setRefreshKey((value) => value + 1)} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, overview, recentScores, topScores } = dashboard;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      {/* Heading and controls */}
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
            <Activity className="h-3.5 w-3.5" />
            Admin overview
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            A live view of quiz activity, submissions, and participant performance across {selectedGroupName}.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GroupSwitcher groups={groupOptions} value={selectedGroupId} onValueChange={setSelectedGroupId} />
          <CalendarDateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Refresh dashboard"
            disabled={isLoading}
            onClick={() => setRefreshKey((value) => value + 1)}
            className="h-10 w-10 shrink-0 rounded-xl border-slate-200 bg-white shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </section>

      {errorMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{errorMessage} Showing the last successfully loaded data.</span>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((value) => value + 1)}>
            Retry
          </Button>
        </div>
      )}

      {/* {!dateRange.from || !dateRange.to ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Select both a start date and an end date to refresh the date-filtered dashboard data.
        </div>
      ) : null} */}

      {/* Metric cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4">
        <StatCard title="Total groups" value={formatNumber(stats.totalGroups)} description="Groups in this workspace" icon={Layers3} tone="indigo" />
        <StatCard title="Total quizzes" value={formatNumber(stats.totalQuizzes)} description={`${formatNumber(stats.publishedQuizzes)} published · ${formatNumber(stats.draftQuizzes)} drafts`} icon={ClipboardList} tone="violet" />
        <StatCard title="Published quizzes" value={formatNumber(stats.publishedQuizzes)} description="Available when shared" icon={CheckCircle2} tone="emerald" />
        <StatCard title="Draft quizzes" value={formatNumber(stats.draftQuizzes)} description="Not yet published" icon={ListChecks} tone="amber" />
        <StatCard title="Total questions" value={formatNumber(stats.totalQuestions)} description="Across quizzes in scope" icon={ListChecks} tone="slate" />
        <StatCard title="Total submissions" value={formatNumber(stats.totalSubmissions)} description="All-time quiz submissions" icon={Users} tone="indigo" />
        <StatCard title="Qualified submissions" value={formatNumber(stats.qualifiedSubmissions)} description="Submissions marked qualified" icon={ShieldCheck} tone="emerald" />
        <StatCard title="Submissions in range" value={formatNumber(stats.submissionsInRange)} description="Within the selected dates" icon={Activity} tone="rose" />
      </section>

      {/* Activity chart */}
      <section>
        <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Activity overview</CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-5">
                  Quiz submissions during the selected date range and group scope.
                </CardDescription>
              </div>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Per {overview.granularity}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Overview overview={overview} />
          </CardContent>
        </Card>
      </section>

      {/* Recent submissions and leaderboard */}
      <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Recent submissions</CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-5">
                  The five latest submissions within the selected date range.
                </CardDescription>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <RecentScores scores={recentScores} />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Top-scoring students</CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-5">
                  Each student appears once, ranked by their best quiz accuracy in this period.
                </CardDescription>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <TopScores scores={topScores} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
