"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CalendarDays, CheckCircle2, Clock3, FileQuestion, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/shared/Loading";
import { getMyParticipatedQuizzesDB } from "@/lib/actions/collaboration.actions";

type ParticipatedQuiz = {
  participantId: string;
  quizId: string;
  slug?: string | null;
  participatedAt: string | Date;
  isQualified: boolean;
  statusReason?: string | null;
  id: string;
  title: string;
  desc?: string | null;
  duration?: number | null;
  published: boolean;
  createdAt: string | Date;
  groupName: string;
  questionCount: number;
};

type Filter = "all" | "completed" | "disqualified";

export default function MyQuizzesPage() {
  const [quizzes, setQuizzes] = useState<ParticipatedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getMyParticipatedQuizzesDB();
        if (cancelled) return;
        if (!result.ok) setLoadError(result.error || "Could not load your quiz history.");
        else setQuizzes((result.data ?? []) as ParticipatedQuiz[]);
      } catch {
        if (!cancelled) setLoadError("Could not load your quiz history. Please refresh and try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredQuizzes = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const matchesQuery =
          !normalizedQuery ||
          quiz.title.toLowerCase().includes(normalizedQuery) ||
          (quiz.desc ?? "").toLowerCase().includes(normalizedQuery) ||
          quiz.groupName.toLowerCase().includes(normalizedQuery);
        const matchesFilter = filter === "all" || (filter === "completed" ? quiz.isQualified : !quiz.isQualified);
        return matchesQuery && matchesFilter;
      }),
    [quizzes, normalizedQuery, filter],
  );

  if (isLoading)
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Loading />
      </div>
    );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-3 sm:p-5 lg:p-7">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
          <BookOpenCheck className="h-3.5 w-3.5" /> Participant history
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">My quizzes</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          Only quizzes you have participated in appear here. This list is based on the email associated with your Quizvera
          account.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Quizzes taken</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{quizzes.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-medium text-emerald-700">Completed / qualified</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
            {quizzes.filter((quiz) => quiz.isQualified).length}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:col-span-1">
          <p className="text-xs font-medium text-rose-700">Disqualified</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-800">
            {quizzes.filter((quiz) => !quiz.isQualified).length}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search quiz or group…"
              aria-label="Search participated quizzes"
              className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                { value: "all", label: "All attempts" },
                { value: "completed", label: "Qualified" },
                { value: "disqualified", label: "Disqualified" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${filter === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{loadError}</div>
        ) : null}
        {!loadError && filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
              {quizzes.length === 0 ? <BookOpenCheck className="h-6 w-6" /> : <Search className="h-6 w-6" />}
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              {quizzes.length === 0 ? "No quiz participation yet" : "No quizzes match this search"}
            </h2>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
              {quizzes.length === 0
                ? "After you take a Quizvera quiz using the email on this account, it will appear here."
                : "Try another search term or change the status filter."}
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <article
                key={`${quiz.quizId}-${quiz.participantId}`}
                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      quiz.isQualified
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
                    }
                  >
                    {quiz.isQualified ? "Qualified" : "Disqualified"}
                  </Badge>
                </div>
                <h2 className="mt-4 line-clamp-2 break-words text-base font-semibold leading-6 text-slate-900">
                  {quiz.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                  {quiz.desc || "No description provided."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    {quiz.groupName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileQuestion className="h-3.5 w-3.5" />
                    {quiz.questionCount} questions
                  </span>
                  {quiz.duration ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {quiz.duration} min
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(quiz.participatedAt).toLocaleDateString()}
                  </span>
                  {quiz.slug ? (
                    <Link
                      href={`/my-quizes/${quiz.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      View my result <CheckCircle2 className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                      Result unavailable
                    </span>
                  )}
                </div>
                {quiz.statusReason ? <p className="mt-2 text-xs text-rose-600">{quiz.statusReason}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
