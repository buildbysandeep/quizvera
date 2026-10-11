"use client";

import { redirect } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { error, success } from "@/lib/utils";
import { IQuiz } from "@/types";
import { getQuizBySlugDB } from "@/lib/actions/quiz.actions";
import { Button } from "@/components/ui/button";
import { Pencil1Icon } from "@radix-ui/react-icons";
import QuizHeader from "@/app/(protected)/quiz/components/QuizHeader";
import UserInputs from "@/app/(protected)/quiz/components/UserInputs";
import QuizInfo from "@/app/(protected)/quiz/components/QuizInfo";
import QuizDesc from "@/app/(protected)/quiz/components/QuizDesc";
import QuizFooter from "@/app/(protected)/quiz/components/QuizFooter";
import Link from "next/link";
import DeleteQuiz from "@/components/dialogs/DeleteQuiz";
import { PublishQuiz } from "@/components/dialogs/Share";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizAdmins from "@/components/dialogs/QuizAdmins";
import MoveQuizGroup from "@/components/dialogs/MoveQuizGroup";
import DuplicateQuiz from "@/components/dialogs/DuplicateQuiz";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Loading from "@/components/shared/Loading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock3,
  CopyIcon,
  Download,
  FileQuestion,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  Trash2,
} from "lucide-react";
import { convertJsonToCsv, downloadFile } from "@/lib/download";
import { SiGmail } from "react-icons/si";
import { successResultWithNote } from "@/lib/templates/success-result-with-note";
import { rejectResultWithNote } from "@/lib/templates/rejectResult";
import { CodeBlock } from "@/components/shared/CodeBlock";
import QuizAvailabilitySettings from "@/components/quiz/QuizAvailabilitySettings";

const Page = ({ params }: { params: { slug: string } }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<IQuiz | null>(null);

  const app_url = process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    const fetchData = async () => {
      if (params.slug) {
        const res = await getQuizBySlugDB({ slug: params.slug });
        setIsLoading(false);
        if (!res.ok) return error(res.error!);
        const quiz = res.data as IQuiz & { legacyRedirectSlug?: string };
        if (quiz.legacyRedirectSlug) {
          window.location.replace(`/quiz/${quiz.legacyRedirectSlug}`);
          return;
        }
        setData(quiz);
      }
    };
    fetchData();
  }, [params.slug]);

  if (!params.slug || (!isLoading && !data)) return redirect("/");

  if (isLoading || !data) {
    return (
      <span className="gap-2 mt-10 flex items-center justify-center">
        <Loading />
      </span>
    );
  }

  return (
    <Tabs defaultValue="details" className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                  Quiz management
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    data.published
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${data.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {data.published ? "Published" : "Draft"}
                </span>

                {data.isStrictMode && (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Strict mode
                  </span>
                )}
              </div>

              <h1 className="max-w-3xl break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {data.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage quiz content, configure assessment settings, and review participant performance.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <FileQuestion className="h-4 w-4 text-indigo-600" />
                  {data.questions.length} questions
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  {data.duration} min
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <ListChecks className="h-4 w-4 text-indigo-600" />
                  {data.maxMarks} total marks
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <Users className="h-4 w-4 text-indigo-600" />
                  {data.participantCount ?? 0} participants
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                  Created{" "}
                  {new Date(data.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {data.groupName ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                    Group: {data.groupName}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Page actions */}
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Link
                href={`/quiz/${data.slug}/edit`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Pencil1Icon className="h-4 w-4" />
                Edit quiz
              </Link>
              <QuizAdmins quizId={data.id} />
              <MoveQuizGroup
                quizId={data.id}
                groupId={data.groupId}
                isMainAdmin={Boolean(data.isMainAdmin)}
                onMoved={(groupId, groupName) =>
                  setData((current) => (current ? { ...current, groupId, groupName } : current))
                }
              />
              <DuplicateQuiz quizId={data.id} title={data.title} />
              {data.isMainAdmin ? (
                <div className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 shadow-sm">
                  <DeleteQuiz quizId={data.id} groupId={data.groupId} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Manage content and settings here. Participant reporting has its own dedicated workspace.
            </p>
            <Link
              href={`/quiz/${data.slug}/participants`}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Users className="h-4 w-4" /> View participants
            </Link>
          </div>
        </div>
      </div>

      <QuizAvailabilitySettings quiz={data} setData={setData} />

      {/* Quiz details */}
      <TabsContent value="details" className="mt-0 space-y-6">
        {/* Publication actions */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50">
              {data.published ? (
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              ) : (
                <Sparkles className="h-5 w-5 text-indigo-600" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {data.published ? "Your quiz is live" : "Your quiz is not published"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {data.published
                  ? "Manage distribution or copy the quiz link to share it."
                  : "Publish the quiz when its content and settings are ready."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PublishQuiz id={data.id} slug={data.slug || data.id} isPublished={data.published} setData={setData} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                try {
                  const shareUrl = `${app_url || window.location.origin}/share/quiz/${data.slug || data.id}`;

                  await navigator.clipboard.writeText(shareUrl);
                  success("Link copied to clipboard");
                } catch {
                  error("Unable to copy link");
                }
              }}
            >
              <CopyIcon className="h-4 w-4" />
              Copy link
            </Button>
          </div>
        </section>

        {/* Main layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <main className="min-w-0 space-y-6">
            {/* Quiz cover */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Quiz cover</h2>
                <p className="mt-1 text-xs text-slate-500">Manage the quiz header and associated images.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizHeader title={data.title} images={data.images || []} editable />
              </div>
            </section>

            {/* Quiz description */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Description</h2>
                <p className="mt-1 text-xs text-slate-500">Explain the assessment to participants.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizDesc desc={data.desc} editable />
              </div>
            </section>

            {/* Question bank */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <ListChecks className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">Question bank</h2>
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {data.questions.length} {data.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-500">
                      Questions have their own workspace, keeping quiz settings and content editing separate.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/quiz/${data.slug || params.slug}/questions`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <ListChecks className="h-4 w-4" /> Manage question bank
                </Link>
              </div>
            </section>

            {/* Quiz footer */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Footer content</h2>
                <p className="mt-1 text-xs text-slate-500">Configure the additional content shown in your quiz footer.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizFooter
                  data={{
                    footerHeading1: data.footerHeading1,
                    footerHeading2: data.footerHeading2,
                    footerText1: data.footerText1,
                    footerText2: data.footerText2,
                    footerLink: data.footerLink,
                  }}
                  editable
                />
              </div>
            </section>
          </main>

          {/* Settings sidebar */}
          <aside className="min-w-0 space-y-6 xl:sticky xl:top-[70px]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Assessment settings</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">Duration and scoring.</p>
              </div>

              <div className="p-4 sm:p-5">
                <QuizInfo duration={data.duration} maxMarks={data.maxMarks} editable />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Participant fields</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">Information collected from quiz participants.</p>
              </div>

              <div className="p-4 sm:p-5">
                <UserInputs inputs={data.userInputs} editable />
              </div>
            </section>
          </aside>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Page;
