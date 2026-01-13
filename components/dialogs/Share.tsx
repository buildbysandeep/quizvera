"use client";

import { CopyIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect } from "react";
import { publishQuizDB, unPublishQuizDB } from "@/lib/actions/quiz.actions";
import { error, success } from "@/lib/utils";
import { IQuiz } from "@/types";

export function PublishQuiz({
  id,
  isPublished,
  setData,
}: {
  id: string;
  isPublished: boolean;
  setData: React.Dispatch<React.SetStateAction<IQuiz | null>>;
}) {
  const [open, setOpen] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);
  const [unlinked, setUnlinked] = React.useState(false);

  const app_url = process.env.NEXT_PUBLIC_APP_URL;

  const stopSharing = async () => {
    setUnlinked(true);
    const res = await unPublishQuizDB({ quizId: id });
    if (!res.ok) return error(res.error!);
    setData((prev) => (prev ? { ...prev, published: false } : null));
    setUnlinked(false);
    // success("Link removed successfully");
    setOpen(false);
  };

  const handlePublish = async () => {
    if (isPublished) return;
    setGenerated(true);
    const res = await publishQuizDB({ quizId: id });
    if (!res.ok) return error(res.error!);
    setData((prev) => (prev ? { ...prev, published: true } : null));
    setGenerated(false);
    // success("Link generated successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="">
        <Button variant="outline" className="w-fit" onClick={handlePublish}>
          {isPublished ? "Unpublish" : "Publish"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{!generated ? "Share" : "generating"} link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this quiz.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            {!generated ? (
              <Input id="link" defaultValue={app_url + "/share/quiz/" + id} readOnly />
            ) : (
              <ReloadIcon className="h-4 w-4 animate-spin" />
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-row items-center justify-between">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button type="button" size={"sm"} onClick={stopSharing}>
            {unlinked ? <ReloadIcon className="h-4 w-4 animate-spin" /> : "Stop sharing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
