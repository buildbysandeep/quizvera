"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { error, success } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import { useSWRConfig } from "swr";
import { deleteQuizDB } from "@/lib/actions/quiz.actions";

const DeleteQuiz = ({ quizId, groupId }: { quizId: string; groupId: string }) => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const groups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Delete the quiz first. Do not remove its hosted images if the DB deletion fails.
      const result = await deleteQuizDB({ quizId });
      if (!result.ok) {
        error(result.error || "Could not delete quiz.");
        return;
      }
      setOpen(false);
      setGroups(
        groups.map((group) =>
          group.id === groupId ? { ...group, quizzes: (group.quizzes ?? []).filter((quiz) => quiz.id !== quizId) } : group,
        ),
      );
      await mutate("/api/groups");
      if (result.warning) error(result.warning);
      else success("Quiz deleted successfully");
      const targetGroup = groups.find((group) => group.id === groupId);
      router.replace(targetGroup ? `/group/${targetGroup.slug || targetGroup.id}` : "/");
      router.refresh();
    } catch {
      error("A network error occurred while deleting the quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete quiz"
          className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">Delete this quiz?</DialogTitle>
          <DialogDescription>
            This permanently removes the quiz, its questions, and associated participant records. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="rounded-xl">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Delete quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteQuiz;
