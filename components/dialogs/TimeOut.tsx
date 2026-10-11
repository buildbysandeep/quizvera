"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ClockAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { error } from "@/lib/utils";
import { IParticipantQuizAnswer } from "@/types";
import { submitParticipantQuizDB } from "@/lib/actions/user.action";

type TimeOutProps = {
  open: boolean;
  answers: IParticipantQuizAnswer[];
  quizInputs: { key: string; value: string }[];
  quizId: string;
  groupId: string;
  userId: string;
  attemptToken: string;
};

const TimeOut = ({ open, answers, quizInputs, quizId, groupId, userId, attemptToken }: TimeOutProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const submittedRef = React.useRef(false);

  const payloadRef = React.useRef({ answers, quizInputs });
  payloadRef.current = { answers, quizInputs };

  React.useEffect(() => {
    if (!open) {
      submittedRef.current = false;
      setSaveFailed(false);
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;

    const save = async () => {
      setIsSaving(true);
      try {
        const payload = payloadRef.current;
        const result = await submitParticipantQuizDB({
          userId,
          attemptToken,
          quizId,
          groupId,
          answers: payload.answers,
          quizInputs: payload.quizInputs,
          isQualified: false,
          reason: "Time limit exceeded",
        });
        if (!result.ok) {
          setSaveFailed(true);
          error(result.error || "Could not save the timed-out quiz.");
        }
      } catch {
        setSaveFailed(true);
        error("Could not save the timed-out quiz. Please continue to the result page.");
      } finally {
        setIsSaving(false);
      }
    };
    void save();
  }, [open, quizId, groupId, userId, attemptToken]);

  return (
    <Dialog open={open}>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md" onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100"><ClockAlert className="h-5 w-5" /></div>
          <DialogTitle className="text-lg font-bold text-slate-900">Time is up</DialogTitle>
          <DialogDescription>Your quiz time has expired. Your current answers are being saved and the submission will be marked as timed out.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">{isSaving ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : null}<span>{isSaving ? "Saving your answers…" : saveFailed ? "Automatic save may have failed." : "Submission processed."}</span></div>
        </div>
        <DialogFooter><Button type="button" onClick={() => router.replace(`/share/quiz/sb?quizId=${quizId}&timeOut=true`)} disabled={isSaving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">{isSaving ? "Please wait…" : "View result"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOut;
