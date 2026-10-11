"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { FolderInput, FolderPlus, Loader2, Search } from "lucide-react";
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
import { moveQuizToGroupDB } from "@/lib/actions/collaboration.actions";
import { createGroupDB } from "@/lib/actions/group.actions";
import { useDataStore } from "@/stores/data";
import { error, success } from "@/lib/utils";
import type { IGroup } from "@/types";

type Props = {
  quizId: string;
  groupId: string;
  isMainAdmin: boolean;
  onMoved: (groupId: string, groupName: string) => void;
};

export default function MoveQuizGroup({ quizId, groupId, isMainAdmin, onMoved }: Props) {
  const { groups, isLoading } = useGroups();
  const { mutate } = useSWRConfig();
  const storedGroups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const [open, setOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availableGroups = groups.filter((group) => group.id !== groupId);
  const matchingGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    return availableGroups.filter((group) => !query || group.name.toLowerCase().includes(query));
  }, [availableGroups, groupSearch]);
  const exactMatch = groups.some((group) => group.name.trim().toLowerCase() === groupSearch.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    setTargetGroupId((current) =>
      current && availableGroups.some((group) => group.id === current) ? current : (availableGroups[0]?.id ?? ""),
    );
  }, [open, availableGroups]);

  const finishMove = async (destinationId: string, destinationName: string) => {
    const response = await moveQuizToGroupDB({ quizId, groupId: destinationId });
    if (!response.ok) throw new Error(response.error || "Unable to move quiz.");
    onMoved(destinationId, destinationName);
    await mutate("/api/groups");
    setOpen(false);
    setGroupSearch("");
    success("Quiz moved. Participant history and share links were preserved.");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetGroupId || targetGroupId === groupId || isSaving) return;
    const target = availableGroups.find((group) => group.id === targetGroupId);
    if (!target) return;
    setIsSaving(true);
    try {
      await finishMove(target.id, target.name);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to move quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  const createAndMove = async () => {
    const name = groupSearch.trim();
    if (!name || exactMatch || isSaving) return;
    setIsSaving(true);
    try {
      const created = await createGroupDB({ name });
      if (!created.ok || !created.data) throw new Error(created.error || "Unable to create folder.");
      const newGroup = { ...created.data, quizzes: [] } as IGroup;
      setGroups([...storedGroups.filter((item) => item.id !== newGroup.id), newGroup]);
      await finishMove(newGroup.id, newGroup.name);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to create folder and move quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMainAdmin) return null;

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
          <FolderInput className="h-4 w-4" /> Move folder
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1.25rem)] max-w-lg rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Move quiz to another folder</DialogTitle>
          <DialogDescription>
            The quiz keeps its slug, submissions, answers, and shared-admin access. Only folders you own are available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="move-group-search" className="text-sm font-semibold text-slate-800">
              Find a destination folder
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="move-group-search"
                value={groupSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setGroupSearch(value);
                  const exact = availableGroups.find(
                    (group) => group.name.trim().toLowerCase() === value.trim().toLowerCase(),
                  );
                  setTargetGroupId(exact?.id ?? "");
                }}
                placeholder="Search folder name…"
                className="h-10 rounded-xl pl-9"
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading folders…
            </div>
          ) : matchingGroups.length ? (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5">
              {matchingGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setTargetGroupId(group.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${targetGroupId === group.id ? "bg-indigo-50 font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-200" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span>{group.name}</span>
                  {targetGroupId === group.id ? <span className="text-xs">Selected</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
              {availableGroups.length ? "No folders match that name." : "You don't have another group yet."}
            </div>
          )}
          {groupSearch.trim() &&
          exactMatch &&
          !availableGroups.some((group) => group.name.trim().toLowerCase() === groupSearch.trim().toLowerCase()) ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This quiz is already in “{groupSearch.trim()}”. Choose a different group.
            </p>
          ) : null}
          {groupSearch.trim() && !exactMatch ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
              <p className="text-xs leading-5 text-indigo-900">
                Folder “{groupSearch.trim()}” doesn’t exist. Create it and move the quiz directly into that folder.
              </p>
              <Button
                type="button"
                onClick={() => void createAndMove()}
                disabled={isSaving || isLoading}
                className="mt-3 w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Create folder
                & move here
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
              disabled={isSaving || isLoading || !targetGroupId || targetGroupId === groupId}
              className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderInput className="h-4 w-4" />} Move to
              selected folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
