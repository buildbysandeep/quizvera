"use client";

import React from "react";
import { Check, Copy, Link2, Loader2, Share2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publishQuizDB, unPublishQuizDB } from "@/lib/actions/quiz.actions";
import { error, success } from "@/lib/utils";
import { IQuiz } from "@/types";

export function PublishQuiz({ id, slug, isPublished, setData }: { id: string; slug: string; isPublished: boolean; setData: React.Dispatch<React.SetStateAction<IQuiz | null>> }) {
  const [open, setOpen] = React.useState(false);
  const [published, setPublished] = React.useState(isPublished);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const shareUrl = `${appUrl || (typeof window !== "undefined" ? window.location.origin : "")}/share/quiz/${slug}`;

  React.useEffect(() => setPublished(isPublished), [isPublished]);

  const handleOpen = async () => {
    if (published) { setOpen(true); return; }
    if (loading) return;
    setLoading(true);
    try {
      const result = await publishQuizDB({ quizId: id });
      if (!result.ok) { error(result.error || "Could not publish quiz."); return; }
      setPublished(true);
      setData((current) => current ? { ...current, published: true, publishedAt: result.data.publishedAt, availabilityStartedAt: result.data.availabilityStartedAt } : null);
      success("Quiz published successfully");
      setOpen(true);
    } catch {
      error("A network error occurred while publishing the quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await unPublishQuizDB({ quizId: id });
      if (!result.ok) { error(result.error || "Could not unpublish quiz."); return; }
      setPublished(false);
      setData((current) => current ? { ...current, published: false, publishedAt: null, availabilityStartedAt: null } : null);
      setCopied(false);
      success("Quiz unpublished successfully");
      setOpen(false);
    } catch {
      error("A network error occurred while unpublishing the quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      success("Quiz link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      error("Unable to copy the link. Copy it from the field instead.");
    }
  };

  return (
    <>
      <Button type="button" variant={published ? "outline" : "default"} size="sm" onClick={handleOpen} disabled={loading} className={`h-9 gap-2 rounded-xl ${published ? "border-slate-200 bg-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        {published ? "Share settings" : "Publish quiz"}
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
        <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
          <DialogHeader>
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Link2 className="h-5 w-5" /></div>
            <DialogTitle className="text-lg font-bold text-slate-900">Share your quiz</DialogTitle>
            <DialogDescription>Anyone with this link can open the participant-facing quiz page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={`share-link-${id}`} className="text-sm font-semibold text-slate-700">Quiz link</Label>
            <div className="flex gap-2">
              <Input id={`share-link-${id}`} readOnly value={shareUrl} className="h-10 min-w-0 rounded-xl bg-slate-50" onFocus={(event) => event.currentTarget.select()} />
              <Button type="button" onClick={handleCopy} variant="outline" className="shrink-0 rounded-xl" aria-label="Copy quiz link"><span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>{copied ? <Check className="h-4 w-4 sm:ml-2" /> : <Copy className="h-4 w-4 sm:ml-2" />}</Button>
            </div>
            <p className="text-xs leading-5 text-slate-500">Publishing makes the quiz available through its share link. Unpublishing disables sharing through that link.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Done</Button>
            {published && <Button type="button" variant="destructive" onClick={handleUnpublish} disabled={loading} className="rounded-xl"><ShieldOff className="mr-2 h-4 w-4" /> Stop sharing</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
