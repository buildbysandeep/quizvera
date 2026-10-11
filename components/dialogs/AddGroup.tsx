"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2, Users } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { error as showError, success } from "@/lib/utils";
import { useDataStore } from "@/stores/data";

type AddGroupProps = { fullWidth?: boolean };

export default function AddGroup({ fullWidth = false }: AddGroupProps) {
  const router = useRouter();
  const groups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [formError, setFormError] = React.useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormError("");
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError("Folder name is required.");
      return;
    }

    setIsLoading(true);
    setFormError("");
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, description: description.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        const message = result?.error || "Could not create folder.";
        setFormError(message);
        return;
      }

      setGroups([...groups, { ...result.data, quizzes: result.data.quizzes ?? [] }]);
      success(result.message || "Group created successfully");
      setOpen(false);
      resetForm();
      router.push(`/group/${result.data.slug || result.data.id}`);
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`${fullWidth ? "w-full" : ""} h-10 gap-2 rounded-xl border-slate-200 bg-white font-medium shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700`}
        >
          <FolderPlus className="h-4 w-4" />
          <span>Add Folder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-[460px]">
        <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-300/70 to-white px-6 py-5">
          <DialogHeader>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">Create a folder</DialogTitle>
            <DialogDescription className="text-sm leading-5 text-slate-500">
              Organize quizzes by class, course, team, or project.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-sm font-semibold text-slate-700">
              Folder name
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
              placeholder="e.g. BCA Semester 3"
              autoFocus
              disabled={isLoading}
              aria-invalid={Boolean(formError)}
              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description" className="text-sm font-semibold text-slate-700">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this folder used for?"
              rows={3}
              disabled={isLoading}
              className="resize-none rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          {formError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" /> Create folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
