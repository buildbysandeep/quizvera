"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileQuestion, ListChecks, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuizBySlugDB } from "@/lib/actions/quiz.actions";
import type { IQuiz } from "@/types";
import Loading from "@/components/shared/Loading";
import AddQuestion from "@/components/dialogs/AddQuestion";
import GenerateQuestions from "@/components/dialogs/GenerateQuestions";
import QuizQuestions from "@/app/(protected)/quiz/components/QuizQuestions";

type QuestionBankManagerProps = { slug: string };

export default function QuestionBankManager({ slug }: QuestionBankManagerProps) {
  const router = useRouter();
  const [data, setData] = useState<IQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getQuizBySlugDB({ slug });
        if (!active) return;
        if (!response.ok || !response.data) {
          setLoadError(response.error || "Could not load the quiz question bank.");
          return;
        }
        const quiz = response.data as IQuiz & { legacyRedirectSlug?: string };
        const canonicalSlug = quiz.legacyRedirectSlug || quiz.slug;
        if (canonicalSlug && canonicalSlug !== slug) {
          router.replace(`/quiz/${canonicalSlug}/questions`);
          return;
        }
        setData(quiz);
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Could not load the quiz question bank.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-7">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-bold text-rose-900">Question bank unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            {loadError || "This quiz could not be found or you do not have permission to manage it."}
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 sm:p-7">
          <Link
            href={`/quiz/${data.slug || slug}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to quiz details
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                <ListChecks className="h-3.5 w-3.5" /> Question bank
              </span>
              <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{data.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Build, review, generate, and maintain questions separately from quiz settings.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <FileQuestion className="h-4 w-4 text-indigo-600" />
                  {data.questions.length} questions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  {data.participantCount ?? 0} submissions
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/quiz/${data.slug || slug}/participants`}>
                  Participants <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/quiz/${data.slug || slug}/edit`}>Quiz settings</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
              <ListChecks className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">All questions</h2>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {data.questions.length}
                </span>
              </div>
              <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-500">
                Correct answers are visible only in this protected management workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GenerateQuestions quizId={data.id} isTranslationEnabled={data.translationEnabled} />
            <AddQuestion
              quizId={data.id}
              data={data}
              setData={setData}
              translate={{ enable: data.translationEnabled, source: data.sourceLanguage, target: data.targetLanguage }}
            />
          </div>
        </div>
        <div className="min-w-0 p-3 sm:p-5">
          {data.questions.length > 0 ? (
            <QuizQuestions questions={data.questions} data={data} setData={setData} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <FileQuestion className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Your question bank is empty</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
                Add a question manually or generate a first batch to start building this assessment.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <GenerateQuestions quizId={data.id} isTranslationEnabled={data.translationEnabled} />
                <AddQuestion
                  quizId={data.id}
                  data={data}
                  setData={setData}
                  translate={{ enable: data.translationEnabled, source: data.sourceLanguage, target: data.targetLanguage }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
