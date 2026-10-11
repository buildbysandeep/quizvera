"use client";

import { fetcher, fetcherOpt } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import QuizHeader from "./components/QuizHeader";
import UserInputs from "./components/UserInputs";
import QuizInfo from "./components/QuizInfo";
import QuizDesc from "./components/QuizDesc";
import QuizQuestions from "./components/QuizQuestions";
import QuizFooter from "./components/QuizFooter";
import { IParticipantQuizAnswer, IUser } from "@/types";
import { UserRegistration } from "@/components/dialogs/UserRegistration";
import Loading from "@/components/shared/Loading";
import { submitParticipantQuizDB } from "@/lib/actions/user.action";
import { useRouter } from "next/navigation";
import TimeOut from "@/components/dialogs/TimeOut";
import TimeLeft from "@/components/dialogs/TimeLeft";
import { Checkbox } from "@/components/ui/checkbox";
import CountDown from "./components/CountDown";
import { useWakeLock } from "@/hooks/useWakeLock";
import { AlertTriangle, ArrowRight, CheckCircle2, FileWarning, ShieldCheck, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizSubmit } from "@/components/dialogs/QuizSubmit";

const Page = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [user, setUser] = React.useState<IUser | null>(null);
  const { data, isLoading, error: requestError } = useSWR(`/api/quiz/share/${params.id}`, fetcher, fetcherOpt);
  const [answers, setAnswers] = React.useState<IParticipantQuizAnswer[]>([]);
  const [quizInputs, setQuizInputs] = React.useState<{ key: string; value: string }[]>([]);
  const [openTimeOutDialog, setOpenTimeOutDialog] = React.useState(false);
  const [openTimeLeftDialog, setOpenTimeLeftDialog] = React.useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = React.useState(false);
  const hasDisqualified = useRef(false);

  // Strict-mode enforcement. Avoid submitting twice when blur and fullscreen events occur together.
  useEffect(() => {
    if (!data?.ok || !data?.quiz?.isStrictMode || !user) return;

    const disqualify = async (reason: string, destination: string) => {
      if (hasDisqualified.current) return;
      hasDisqualified.current = true;
      try {
        await submitParticipantQuizDB({
          userId: user.id,
          quizId: data.quiz.id,
          groupId: data.quiz.groupId,
          answers,
          quizInputs,
          isQualified: false,
          reason,
        });
      } catch (disqualificationError) {
        console.error("Could not save disqualification record:", disqualificationError);
      } finally {
        router.replace(destination);
      }
    };

    const checkFullScreen = () => {
      if (!document.fullscreenElement) {
        void disqualify("You have exited full-screen mode!", "/share/quiz/disqualified?exitFullScreen=true");
      }
    };

    const handleWindowBlur = () => {
      void disqualify(
        "You switched away from the quiz! Possible reason: Tried to switch tabs or minimize the browser.",
        "/share/quiz/disqualified?lostFocus=true",
      );
    };

    document.addEventListener("fullscreenchange", checkFullScreen);
    document.addEventListener("webkitfullscreenchange", checkFullScreen);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("fullscreenchange", checkFullScreen);
      document.removeEventListener("webkitfullscreenchange", checkFullScreen);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [data, user, answers, quizInputs, router]);

  useEffect(() => {
    if (data?.ok && data?.quiz && !data.quiz.published) {
      router.replace(`/share/quiz/expired?quizId=${data.quiz.id}`);
    }
  }, [data, router]);

  useWakeLock(Boolean(user));

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-16">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <Loading />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">Loading your quiz</p>
          <p className="mt-1 text-xs text-slate-500">Preparing the assessment and questions…</p>
        </div>
      </main>
    );
  }

  if (requestError || !data?.ok || !data?.quiz) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-12">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <FileWarning className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Quiz unavailable</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {requestError
              ? "We could not load this quiz. Check your connection and try again."
              : data?.error || "This quiz link may be invalid or no longer available."}
          </p>
          <Button variant="outline" className="mt-5" onClick={() => router.refresh()}>
            Try again
          </Button>
        </section>
      </main>
    );
  }

  const quiz = data.quiz;
  const totalQuestions = quiz.questions?.length ?? 0;
  const attemptedQuestions = answers.length;

  return (
    <div className="pb-12">
      <TimeLeft open={openTimeLeftDialog} setOpen={setOpenTimeLeftDialog} />
      <TimeOut
        open={openTimeOutDialog}
        answers={answers}
        quizInputs={quizInputs}
        quizId={quiz.id}
        groupId={quiz.groupId}
        userId={user?.id ?? ""}
      />
      <CountDown
        duration={Number(quiz.duration ?? 0) * 60}
        user={user}
        setOpenTimeOutDialog={setOpenTimeOutDialog}
        setOpenTimeLeftDialog={setOpenTimeLeftDialog}
      />

      <main className="mx-auto w-full max-w-5xl px-3 pt-4 sm:px-6 sm:pt-6">
        <QuizHeader title={quiz.title} images={quiz.images ?? []} />

        <div className="space-y-4 sm:space-y-5">
          <QuizInfo duration={quiz.duration} maxMarks={quiz.maxMarks} totalQuestions={totalQuestions} />
          <QuizDesc desc={quiz.desc} />

          {user ? (
            <>
              <UserInputs inputs={quiz.userInputs ?? []} user={user} setQuizInputs={setQuizInputs} />
              <QuizQuestions
                translationEnabled={quiz.translationEnabled}
                questions={quiz.questions ?? []}
                answers={answers}
                setAnswers={setAnswers}
              />

              <section className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ready to submit?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    You have answered {attemptedQuestions} of {totalQuestions} questions. Review your selections before
                    submitting.
                  </p>
                </div>
                <div className="shrink-0">
                  <QuizSubmit
                    user={user}
                    quizInputs={quizInputs}
                    userInputs={(quiz.userInputs ?? []).length}
                    questions={totalQuestions}
                    answers={answers}
                    quizId={quiz.id}
                    groupId={quiz.groupId}
                  />
                </div>
              </section>
            </>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/70 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">Before you begin</h2>
                      {quiz.isStrictMode && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                          Strict mode
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Read the instructions and confirm that you are ready to start.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <p className="text-sm leading-5 text-slate-700">
                      Make sure you have a stable internet connection before starting.
                    </p>
                  </div>
                  {quiz.isStrictMode ? (
                    <>
                      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <p className="text-sm leading-5 text-rose-900">
                          This assessment uses strict mode. Exiting full-screen or switching away from the quiz may
                          disqualify you.
                        </p>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <p className="text-sm leading-5 text-slate-700">
                          Close other applications and enable Do Not Disturb on your phone if applicable.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <p className="text-sm leading-5 text-slate-700">
                        Keep this page open while answering. Your available time is shown at the top.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="quiz-rules-agreement"
                      checked={isAgreementChecked}
                      onCheckedChange={(checked) => setIsAgreementChecked(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="quiz-rules-agreement" className="cursor-pointer text-sm leading-5 text-slate-700">
                      I have read and agree to follow the quiz instructions above.
                    </label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                      You will be asked to register before the timer starts.
                    </p>
                    <UserRegistration visible={isAgreementChecked} setUser={setUser} quizId={quiz.id} />
                  </div>
                </div>
              </div>
            </section>
          )}

          <QuizFooter
            data={{
              footerHeading1: quiz.footerHeading1,
              footerHeading2: quiz.footerHeading2,
              footerText1: quiz.footerText1,
              footerText2: quiz.footerText2,
              footerLink: quiz.footerLink,
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Page;
