"use client";

import Link from "next/link";
import React from "react";
import { useDataStore } from "@/stores/data";
import { useGroups } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import AddGroup from "@/components/dialogs/AddGroup";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/shared/Loading";
import { BookOpenCheck, CalendarDays, ChevronRight, FileQuestion, FolderKanban, Plus, Search } from "lucide-react";

type QuizCardData = {
  id: string;
  title: string;
  desc?: string | null;
  published: boolean;
  createdAt: string | Date;
  groupId: string;
  groupName: string;
  questionCount?: number;
  participantCount?: number;
};

type QuizFilter = "all" | "published" | "drafts";

export default function MyQuizzesPage() {
  const storedGroups = useDataStore((state) => state.groups ?? []);
  const { groups: fetchedGroups, isLoading, error } = useGroups();
  const groups = storedGroups.length ? storedGroups : fetchedGroups;
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<QuizFilter>("all");

  const quizzes = React.useMemo<QuizCardData[]>(
    () =>
      groups.flatMap((group) =>
        (group.quizzes ?? []).map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          desc: quiz.desc,
          published: Boolean(quiz.published),
          createdAt: quiz.createdAt,
          groupId: group.id,
          groupName: group.name,
          questionCount: (quiz as typeof quiz & { _count?: { questions?: number } })._count?.questions,
          participantCount: (quiz as typeof quiz & { _count?: { participants?: number } })._count?.participants,
        })),
      ),
    [groups],
  );

  const publishedCount = quizzes.filter((quiz) => quiz.published).length;
  const draftCount = quizzes.length - publishedCount;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesQuery =
      !normalizedQuery ||
      quiz.title.toLowerCase().includes(normalizedQuery) ||
      (quiz.desc ?? "").toLowerCase().includes(normalizedQuery) ||
      quiz.groupName.toLowerCase().includes(normalizedQuery);
    const matchesFilter = filter === "all" || (filter === "published" ? quiz.published : !quiz.published);
    return matchesQuery && matchesFilter;
  });

  if (isLoading && groups.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:p-5 lg:p-7">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-3 sm:p-5 lg:p-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
            <BookOpenCheck className="h-3.5 w-3.5" /> Quiz library
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">My quizzes</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Find, open, and manage quizzes across all your groups.</p>
        </div>
        {groups[0] ? (
          <Button asChild className="gap-2 rounded-xl bg-indigo-600 shadow-sm hover:bg-indigo-700">
            <Link href={`/quiz/create?group=${groups[0].id}`}>
              <Plus className="h-4 w-4" /> Create quiz
            </Link>
          </Button>
        ) : (
          <AddGroup />
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">All quizzes</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{quizzes.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-medium text-emerald-700">Published</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">{publishedCount}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:col-span-1">
          <p className="text-xs font-medium text-amber-700">Drafts</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-800">{draftCount}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by quiz or group name…"
              aria-label="Search quizzes"
              className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {([
              { value: "all", label: "All" },
              { value: "published", label: "Published" },
              { value: "drafts", label: "Drafts" },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  filter === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
                aria-pressed={filter === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && groups.length === 0 ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{String(error)}</div>
        ) : null}

        {filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
              {quizzes.length === 0 ? <FolderKanban className="h-6 w-6" /> : <Search className="h-6 w-6" />}
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              {quizzes.length === 0 ? "No quizzes in your workspace yet" : "No quizzes match this search"}
            </h2>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
              {quizzes.length === 0
                ? "Create a group first, then add a quiz to start building your assessment library."
                : "Try another search term or change the status filter."}
            </p>
            {quizzes.length === 0 && (
              groups[0] ? (
                <Button asChild variant="outline" className="mt-5 gap-2 rounded-xl">
                  <Link href={`/group?id=${groups[0].id}`}><FolderKanban className="h-4 w-4" /> Open a group</Link>
                </Button>
              ) : (
                <div className="mt-5"><AddGroup /></div>
              )
            )}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz?id=${quiz.id}`}
                className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <Badge className={quiz.published ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"} variant="outline">
                    {quiz.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <h2 className="mt-4 line-clamp-2 break-words text-base font-semibold leading-6 text-slate-900 group-hover:text-indigo-700">{quiz.title}</h2>
                <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{quiz.desc || "No description provided."}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5" />{quiz.groupName}</span>
                  {typeof quiz.questionCount === "number" && <span className="inline-flex items-center gap-1.5"><FileQuestion className="h-3.5 w-3.5" />{quiz.questionCount} questions</span>}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarDays className="h-3.5 w-3.5" />{new Date(quiz.createdAt).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">Open quiz <ChevronRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
