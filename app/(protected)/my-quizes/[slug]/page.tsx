"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleX,
  FileQuestion,
  ShieldCheck,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { getMyQuizResultDB } from "@/lib/actions/collaboration.actions";
import { error } from "@/lib/utils";

type ResultQuestion = {
  id: string;
  title: string;
  snippet?: string | null;
  snippetLang?: string | null;
  correctAnswer: string | null;
  selectedAnswer: string | null;
  isCorrect: boolean;
  options: { id: string; key: string; value: string }[];
};
type ResultData = {
  slug: string;
  title: string;
  desc?: string | null;
  duration?: number | null;
  maxMarks?: number | null;
  participantName?: string;
  participantEmail: string;
  createdAt: string | Date;
  isQualified: boolean;
  statusReason?: string | null;
  correctCount: number;
  attemptedCount: number;
  questionCount: number;
  score: number;
  percentage: number;
  questions: ResultQuestion[];
  inputs: { key: string; value: string }[];
};

export default function MyQuizResultPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getMyQuizResultDB({ slug: params.slug });
        if (cancelled) return;
        if (!response.ok || !response.data) throw new Error(response.error || "Your result was not found.");
        setResult(response.data as ResultData);
      } catch (cause) {
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : "Could not load your result.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading />
      </div>
    );
  if (loadError || !result)
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-7">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-lg font-bold text-rose-900">Result unavailable</h1>
          <p className="mt-2 text-sm text-rose-800">{loadError || "No matching submission was found."}</p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link href="/my-quizes">Back to My quizzes</Link>
          </Button>
        </div>
      </main>
    );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-3 sm:p-5 lg:p-7">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:p-7">
        <div className="min-w-0">
          <Link
            href="/my-quizes"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" /> My quizzes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
              Your result
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${result.isQualified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
            >
              {result.isQualified ? "Qualified" : "Not qualified"}
            </span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{result.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {result.desc || "Review your submitted answers and see what you got right."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Submitted {new Date(result.createdAt).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />
              {result.questionCount} questions
            </span>
            <span>{result.participantEmail}</span>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0 rounded-xl">
          <Link href="/my-quizes">Back to history</Link>
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
          <p className="text-xs font-medium text-indigo-700">Your score</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-900">
            {result.score}
            {result.maxMarks ? <span className="text-sm font-semibold text-indigo-600"> / {result.maxMarks}</span> : null}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Percentage</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{result.percentage}%</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-medium text-emerald-700">Correct answers</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
            {result.correctCount}
            <span className="text-sm font-semibold text-emerald-700"> / {result.questionCount}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Attempted</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">
            {result.attemptedCount}
            <span className="text-sm font-semibold text-slate-400"> / {result.questionCount}</span>
          </p>
        </div>
      </section>

      {result.statusReason ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Attempt note</p>
            <p className="mt-1">{result.statusReason}</p>
          </div>
        </div>
      ) : null}

      {result.inputs.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Submitted details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.inputs.map((input, index) => (
              <div key={`${input.key}-${index}`} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{input.key}</p>
                <p className="mt-1 break-words text-sm text-slate-900">{input.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Answer review</h2>
          <p className="mt-1 text-sm text-slate-500">
            Correct choices are marked in green. Your selection is shown for every question.
          </p>
        </div>
        {result.questions.map((question, index) => {
          const selectedOption = question.options.find((option) => option.key === question.selectedAnswer);
          const correctOption = question.options.find((option) => option.key === question.correctAnswer);
          return (
            <article key={question.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold leading-6 text-slate-900">{question.title}</h3>
                    {question.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Correct
                      </span>
                    ) : question.selectedAnswer ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                        <CircleX className="h-3 w-3" /> Incorrect
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        Not attempted
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option) => {
                      const correct = option.key === question.correctAnswer;
                      const selected = option.key === question.selectedAnswer;
                      return (
                        <div
                          key={option.id}
                          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${correct ? "border-emerald-200 bg-emerald-50/70 text-emerald-900" : selected ? "border-rose-200 bg-rose-50/70 text-rose-900" : "border-slate-100 bg-slate-50 text-slate-600"}`}
                        >
                          <span className="mt-0.5 shrink-0 text-[11px] font-bold uppercase">{option.key}.</span>
                          <span className="min-w-0 flex-1 break-words">{option.value}</span>
                          {correct ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : selected ? (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Your answer:{" "}
                      <strong className="text-slate-700">
                        {selectedOption ? `${selectedOption.key.toUpperCase()}. ${selectedOption.value}` : "Not attempted"}
                      </strong>
                    </span>
                    {correctOption ? (
                      <span>
                        Correct answer:{" "}
                        <strong className="text-emerald-700">
                          {correctOption.key.toUpperCase()}. {correctOption.value}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
