"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import { error, success } from "@/lib/utils";
import { IParticipantQuizAnswer, IUser } from "@/types";
import { submitParticipantQuizDB } from "@/lib/actions/user.action";
import { useRouter } from "next/navigation";

const SUBMIT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))]);
}

export function QuizSubmit({
  user,
  quizInputs,
  userInputs,
  questions,
  answers,
  quizId,
  groupId,
}: {
  user: IUser;
  quizInputs: { key: string; value: string }[];
  userInputs: number;
  questions: number;
  answers: IParticipantQuizAnswer[];
  quizId: string;
  groupId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const submitHandler = async () => {
    if (quizInputs.length !== userInputs) {
      error("Please fill all inputs", 2000, true);
      setOpen(false);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      error("You're offline. Please check your connection and try again.", 3000, true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await withTimeout(
        submitParticipantQuizDB({
          userId: user.id,
          quizId,
          groupId,
          answers,
          quizInputs,
          isQualified: true,
        }),
        SUBMIT_TIMEOUT_MS,
      );

      if (!res.ok) {
        if (res.redirectTo) {
          router.replace(res.redirectTo);
          return;
        }
        error(res.error!, 3000, true);
        setOpen(false);
        return;
      }

      success("Quiz submitted successfully");
      setOpen(false);
      router.replace(`/share/quiz/sb?quizId=${quizId}`);
    } catch (e) {
      const message =
        e instanceof Error && e.message === "TIMEOUT"
          ? "Request timed out. Please check your connection and try again."
          : "Something went wrong. Please try again.";
      error(message, 3000, true);
      // keep dialog open so user can retry without re-triggering the trigger button
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit mt-10">Submit Quiz</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quiz Submit</DialogTitle>
          <DialogDescription>Are you sure you want to submit this quiz?</DialogDescription>
          <div className="flex items-center space-x-2">
            {answers.length === questions ? (
              <p className="text-sm text-green-600">You have answered all {questions} questions</p>
            ) : (
              <p className="text-sm">
                You have answered {answers.length} / {questions} questions.
              </p>
            )}
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" size={"sm"} onClick={() => setOpen(false)} disabled={isSubmitting}>
            No
          </Button>
          <Button size={"sm"} onClick={submitHandler} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
