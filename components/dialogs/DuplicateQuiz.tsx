"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { Copy, FolderPlus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGroups } from "@/hooks/useGroups";
import { duplicateQuizDB } from "@/lib/actions/collaboration.actions";
import { createGroupDB } from "@/lib/actions/group.actions";
import { useDataStore } from "@/stores/data";
import { error, success } from "@/lib/utils";
import type { IGroup } from "@/types";

export default function DuplicateQuiz({ quizId, title }: { quizId: string; title: string }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { groups, isLoading } = useGroups();
  const storedGroups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(`${title} (copy)`.slice(0, 160));
  const [groupId, setGroupId] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const matchingGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    return groups.filter((group) => !query || group.name.toLowerCase().includes(query));
  }, [groups, groupSearch]);
  const exactMatch = groups.some((group) => group.name.trim().toLowerCase() === groupSearch.trim().toLowerCase());

  const duplicateInto = async (destinationGroupId: string) => {
    const response = await duplicateQuizDB({ quizId, groupId: destinationGroupId, title: newTitle });
    if (!response.ok || !response.data) throw new Error(response.error || "Unable to duplicate quiz.");
    await mutate("/api/groups");
    success("Quiz duplicated as a draft. Questions and settings were copied; participant data was not.");
    setOpen(false);
    router.push(`/quiz/${response.data.slug}/edit`);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupId || !newTitle.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await duplicateInto(groupId);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to duplicate quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  const createAndDuplicate = async () => {
    const name = groupSearch.trim();
    if (!name || exactMatch || isSaving || !newTitle.trim()) return;
    setIsSaving(true);
    try {
      const created = await createGroupDB({ name });
      if (!created.ok || !created.data) throw new Error(created.error || "Unable to create folder.");
      const newGroup = { ...created.data, quizzes: [] } as IGroup;
      setGroups([...storedGroups.filter((item) => item.id !== newGroup.id), newGroup]);
      await duplicateInto(newGroup.id);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to create folder and duplicate quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) {
          setOpen(nextOpen);
          if (!nextOpen) setGroupSearch("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-lg">
          <Copy className="h-4 w-4" /> Duplicate
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.25rem)] max-w-lg rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Duplicate quiz</DialogTitle>
          <DialogDescription>
            Copy settings, cover images, questions and options into a new draft. Participant submissions are never copied.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="duplicate-quiz-title" className="text-sm font-medium text-slate-700">
              New quiz title
            </label>
            <Input
              id="duplicate-quiz-title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              maxLength={160}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="duplicate-group-search" className="text-sm font-medium text-slate-700">
              Destination folder
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="duplicate-group-search"
                value={groupSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setGroupSearch(value);
                  const exact = groups.find((group) => group.name.trim().toLowerCase() === value.trim().toLowerCase());
                  setGroupId(exact?.id ?? "");
                }}
                placeholder="Search or create a folder"
                className="h-10 rounded-xl pl-9"
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading folders…
            </div>
          ) : matchingGroups.length ? (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5">
              {matchingGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${groupId === group.id ? "bg-indigo-50 font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-200" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span>{group.name}</span>
                  {groupId === group.id ? <span className="text-xs">Selected</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-center text-sm text-slate-500">
              No folders match that name.
            </p>
          )}
          {groupSearch.trim() && !exactMatch ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
              <p className="text-xs leading-5 text-indigo-900">
                Folder “{groupSearch.trim()}” doesn’t exist. Create it and duplicate the quiz directly into it.
              </p>
              <Button
                type="button"
                onClick={() => void createAndDuplicate()}
                disabled={isSaving || isLoading || !newTitle.trim()}
                className="mt-3 w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Create folder
                & duplicate
              </Button>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isLoading || !groupId || !newTitle.trim()}
              className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Duplicate to selected
              folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
