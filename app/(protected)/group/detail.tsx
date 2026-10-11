"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileQuestion,
  FolderKanban,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/shared/Loading";
import DeleteGroup from "@/components/dialogs/DeleteGroup";
import { error, fetcher, fetcherOpt } from "@/lib/utils";
import { IQuiz } from "@/types";

type QuizFilter = "all" | "published" | "drafts";

const formatDate = (value: IQuiz["createdAt"]) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Detail = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const { data, isLoading } = useSWR(slug ? `/api/groups/${slug}` : null, fetcher, fetcherOpt);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<QuizFilter>("all");

  const group = data?.ok ? data.group : null;
  const quizzes: IQuiz[] = Array.isArray(group?.quizzes) ? group.quizzes : [];
  const publishedCount = quizzes.filter((quiz) => quiz.published).length;
  const draftCount = quizzes.length - publishedCount;

  useEffect(() => {
    if (!isLoading && data?.ok && data.group && data.legacyRedirectSlug && data.legacyRedirectSlug !== slug) {
      router.replace(`/group/${data.legacyRedirectSlug}`);
      return;
    }
    if (!isLoading && (!data || !data.ok || !data.group)) {
      error("No page found! Redirecting...", 1000);
      router.replace("/");
    }
  }, [data, isLoading, router, slug]);

  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch =
        !normalizedQuery ||
        quiz.title?.toLowerCase().includes(normalizedQuery) ||
        quiz.desc?.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === "all" || (filter === "published" && quiz.published) || (filter === "drafts" && !quiz.published);

      return matchesSearch && matchesFilter;
    });
  }, [quizzes, searchQuery, filter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!group) return null;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-7 p-3 sm:p-5 lg:p-7">
      {/* Group header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-indigo-50/80" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Quiz workspace
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
                </span>
              </div>

              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                {group.name}
              </h1>
              <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:text-base">
                {group.desc || "Manage your assessments and keep all related quizzes organized in one place."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  Managed by <span className="font-semibold text-slate-700">{group.admin?.name || "Workspace admin"}</span>
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  Quiz administration
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start">
              <Button asChild className="h-10 gap-2 rounded-xl px-4 shadow-sm">
                <Link href={`/quiz/create?group=${group.id}`}>
                  <Plus className="h-4 w-4" />
                  Create quiz
                </Link>
              </Button>

              <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-1 shadow-sm [&_button]:rounded-lg">
                <DeleteGroup id={group.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview metrics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total quizzes"
          value={quizzes.length}
          detail="In this workspace"
          icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <MetricCard
          label="Published"
          value={publishedCount}
          detail="Available to participants"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <MetricCard
          label="Drafts"
          value={draftCount}
          detail="Not published yet"
          icon={<FileQuestion className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </section>

      {/* Quiz library */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-indigo-600" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">Content library</p>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">All quizzes</h2>
            <p className="mt-1 text-sm text-slate-500">Open a quiz to manage questions, settings, and submissions.</p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search quizzes..."
              aria-label="Search quizzes"
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 shadow-sm placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { value: "all", label: "All quizzes", count: quizzes.length },
              { value: "published", label: "Published", count: publishedCount },
              { value: "drafts", label: "Drafts", count: draftCount },
            ] as const
          ).map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
          <span className="ml-auto text-xs text-slate-400">
            Showing {filteredQuizzes.length} of {quizzes.length}
          </span>
        </div>

        {filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.slug || quiz.id}`}
                className="group relative flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 transition-colors group-hover:border-indigo-100 group-hover:bg-indigo-50">
                    <BookOpen className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      quiz.published
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${quiz.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {quiz.published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="mt-4 min-w-0 flex-1">
                  <h3 className="line-clamp-2 break-words text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-indigo-700">
                    {quiz.title || "Untitled quiz"}
                  </h3>
                  <p className="mt-2 line-clamp-3 min-h-[3.75rem] break-words text-sm leading-5 text-slate-500">
                    {quiz.desc || "No description has been added to this quiz yet."}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">Created {formatDate(quiz.createdAt)}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 opacity-100 transition-all sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
              {searchQuery || filter !== "all" ? (
                <Search className="h-6 w-6 text-slate-400" />
              ) : (
                <BookOpen className="h-6 w-6 text-indigo-600" />
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {searchQuery || filter !== "all" ? "No matching quizzes" : "No quizzes created yet"}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
              {searchQuery || filter !== "all"
                ? "Try a different search term or choose another filter."
                : "Create the first quiz in this workspace to start organizing your assessments."}
            </p>
            {searchQuery || filter !== "all" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild className="mt-4 gap-2 rounded-xl">
                <Link href={`/quiz/create?group=${group.id}`}>
                  <Plus className="h-4 w-4" />
                  Create your first quiz
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

const MetricCard = ({
  label,
  value,
  detail,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  iconBg: string;
}) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>
    </div>
  </div>
);

export default Detail;
