"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { error, success } from "@/lib/utils";
import { IParticipantQuizAnswer, IUser } from "@/types";
import { submitParticipantQuizDB } from "@/lib/actions/user.action";

type QuizSubmitProps = {
  user: IUser;
  quizInputs: { key: string; value: string }[];
  userInputs: number;
  questions: number;
  answers: IParticipantQuizAnswer[];
  quizId: string;
  groupId: string;
  attemptToken: string;
  quizSlug: string;
};

const SUBMIT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (reason) => { window.clearTimeout(timer); reject(reason); },
    );
  });
}

export function QuizSubmit({ user, quizInputs, userInputs, questions, answers, quizId, groupId, attemptToken, quizSlug }: QuizSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const unanswered = Math.max(0, questions - answers.length);

  const submitHandler = async () => {
    if (isSubmitting) return;
    if (quizInputs.length !== userInputs) {
      error("Please fill all participant fields", 2000, true);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      error("You are offline. Check your connection and try again.", 3000, true);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await withTimeout(submitParticipantQuizDB({ userId: user.id, attemptToken, quizId, groupId, answers, quizInputs, isQualified: true }), SUBMIT_TIMEOUT_MS);
      if (!result.ok) {
        if (result.redirectTo) { router.replace(result.redirectTo); return; }
        error(result.error || "Could not submit quiz", 3000, true);
        return;
      }
      success(result.timedOut ? "Time limit reached. Your recorded answers were saved." : "Quiz submitted successfully");
      setOpen(false);
      router.replace(`/share/quiz/${quizSlug}/result${result.timedOut ? "?timeOut=true" : ""}`);
    } catch (err) {
      error(err instanceof Error && err.message === "TIMEOUT" ? "Request timed out. Check your connection and try again." : "Something went wrong. Please try again.", 3000, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button type="button" className="mt-8 h-11 gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm hover:bg-indigo-700"><Send className="h-4 w-4" /> Submit quiz</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Send className="h-5 w-5" /></div>
          <DialogTitle className="text-lg font-bold text-slate-900">Submit your quiz?</DialogTitle>
          <DialogDescription>After submission, you may not be able to change your answers.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">Questions answered</span><span className="font-semibold text-slate-900">{answers.length} / {questions}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${questions > 0 ? Math.min(100, (answers.length / questions) * 100) : 0}%` }} /></div>
          <div className="mt-3 flex items-start gap-2 text-xs leading-5">
            {unanswered === 0 ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
            <span className={unanswered === 0 ? "text-emerald-700" : "text-amber-800"}>{unanswered === 0 ? "All questions have been answered." : `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. You can still submit your quiz.`}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="rounded-xl">Continue quiz</Button>
          <Button type="button" onClick={submitHandler} disabled={isSubmitting} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Confirm submission"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
