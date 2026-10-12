"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loading from "@/components/shared/Loading";
import { getSharedQuizzesDB } from "@/lib/actions/collaboration.actions";
import { BookOpenCheck, FileQuestion, FolderKanban, Users } from "lucide-react";

type SharedQuiz = {
  id: string;
  slug?: string | null;
  title: string;
  desc?: string | null;
  published: boolean;
  createdAt: string | Date;
  groupId: string;
  groupName: string;
  ownerName: string;
  _count: { questions: number; participants: number };
};

export default function SharedQuizzesPage() {
  const [quizzes, setQuizzes] = useState<SharedQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getSharedQuizzesDB();
        if (cancelled) return;
        if (!response.ok) setLoadError(response.error || "Could not load shared quizzes.");
        else setQuizzes((response.data ?? []) as SharedQuiz[]);
      } catch {
        if (!cancelled) setLoadError("Could not load shared quizzes. Please refresh and try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <Users className="h-3.5 w-3.5" /> Collaboration
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Shared with me</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          Quizzes another Quizvera admin has shared with your account. You can edit content and review participant
          submissions.
        </p>
      </header>
      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{loadError}</div>
      ) : null}
      {!loadError && quizzes.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No shared quizzes yet</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
            When another Quizvera admin shares a quiz with your account email, it will appear here.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((quiz) => (
          <article
            key={quiz.id}
            className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                <FileQuestion className="h-5 w-5" />
              </div>
              <Badge
                variant="outline"
                className={
                  quiz.published
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {quiz.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <h2 className="mt-4 line-clamp-2 break-words text-base font-semibold leading-6 text-slate-900">{quiz.title}</h2>
            <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
              {quiz.desc || "No description provided."}
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-indigo-600" /> Primary admin: {quiz.ownerName}
              </p>
              <p className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-indigo-600" /> {quiz.groupName}
              </p>
              <p className="flex items-center gap-2">
                <FileQuestion className="h-3.5 w-3.5 text-indigo-600" /> {quiz._count.questions} questions ·{" "}
                {quiz._count.participants} participants
              </p>
            </div>
            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
              <Button asChild className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Link href={`/quiz/${quiz.slug || quiz.id}`}>Open quiz</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/quiz/${quiz.slug || quiz.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
