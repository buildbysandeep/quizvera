"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileQuestion, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loading from "@/components/shared/Loading";
import QuizParticipantsHistory from "@/components/quiz/QuizParticipants";
import { getQuizBySlugDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";
import { error } from "@/lib/utils";

export default function QuizParticipantsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<IQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await getQuizBySlugDB({ slug: params.slug });
        if (cancelled) return;
        if (!result.ok || !result.data) throw new Error(result.error || "Quiz not found.");
        const payload = result.data as IQuiz & { legacyRedirectSlug?: string };
        if (payload.legacyRedirectSlug) {
          router.replace(`/quiz/${payload.legacyRedirectSlug}/participants`);
          return;
        }
        setQuiz(payload);
      } catch (cause) {
        if (!cancelled) {
          error(cause instanceof Error ? cause.message : "Unable to load quiz.");
          router.replace("/");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.slug, router]);

  if (isLoading || !quiz)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading />
      </div>
    );
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
        <div>
          <Link
            href={`/quiz/${quiz.slug}`}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to quiz
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">
            <Users className="h-4 w-4" /> Participant analytics
          </div>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{quiz.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review submissions, scores, qualification, and answer-level performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <FileQuestion className="h-4 w-4 text-indigo-600" />
            {quiz.questions?.length ?? 0} questions
          </span>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={`/quiz/${quiz.slug}`}>Quiz details</Link>
          </Button>
        </div>
      </header>
      <QuizParticipantsHistory quizId={quiz.id} questions={quiz.questions ?? []} />
    </main>
  );
}
