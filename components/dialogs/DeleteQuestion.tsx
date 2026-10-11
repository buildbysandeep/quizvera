"use client";

import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { error, success } from "@/lib/utils";
import { deleteQuestionDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";

const DeleteQuestion = ({ questionId, data, setData }: { questionId: string; data: IQuiz | null; setData?: React.Dispatch<React.SetStateAction<IQuiz | null>> }) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await deleteQuestionDB({ questionId });
      if (!result.ok) { error(result.error || "Could not delete question."); return; }
      setData?.((current) => current ? { ...current, questions: current.questions.filter((question) => question.id !== questionId) } : null);
      setOpen(false);
      success("Question deleted successfully");
    } catch {
      error("A network error occurred while deleting the question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Delete question" className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
          <DialogTitle className="text-lg font-bold text-slate-900">Delete question?</DialogTitle>
          <DialogDescription>This question will be removed from the quiz. Existing answers linked to it may also be deleted by your database cascade rules.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl">Cancel</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="rounded-xl">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete question</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteQuestion;
