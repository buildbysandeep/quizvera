"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { FilePenLine, Loader2, Save } from "lucide-react";
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
import type { IGroup } from "@/types";

type EditGroupProps = {
  group: Pick<IGroup, "id" | "slug" | "name" | "desc">;
};

export default function EditGroup({ group }: EditGroupProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const groups = useDataStore((state) => state.groups ?? []);
  const setGroups = useDataStore((state) => state.setGroups);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(group.name ?? "");
  const [description, setDescription] = React.useState(group.desc ?? "");
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setName(group.name ?? "");
      setDescription(group.desc ?? "");
      setFormError("");
    }
  }, [open, group.name, group.desc]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanDescription = description.trim();
    if (!cleanName) return setFormError("Folder name is required.");
    if (cleanName.length > 100) return setFormError("Folder name must be 100 characters or fewer.");
    if (cleanDescription.length > 500) return setFormError("Description must be 500 characters or fewer.");

    setLoading(true);
    setFormError("");
    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(group.slug || group.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, description: cleanDescription }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.data) {
        const message = result?.error || "Could not update folder details.";
        setFormError(message);
        return;
      }

      const updated = result.data as { id: string; slug: string | null; name: string; desc: string };
      setGroups(
        groups.map((item) =>
          item.id === updated.id ? { ...item, slug: updated.slug, name: updated.name, desc: updated.desc } : item,
        ),
      );
      setOpen(false);
      success("Folder details updated.");
      await mutate("/api/groups");
      await mutate((key) => typeof key === "string" && key.startsWith("/api/groups/"));
      router.replace(`/group/${updated.slug || updated.id}`);
      router.refresh();
    } catch {
      setFormError("A network error occurred. Please try again.");
      showError("Could not update folder details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3 shadow-sm">
          <FilePenLine className="h-4 w-4" />
          <span>Edit details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-[480px]">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/70 px-6 py-5">
          <DialogHeader>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <FilePenLine className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">Edit group details</DialogTitle>
            <DialogDescription className="text-sm leading-5 text-slate-500">
              Update the folder name or description. Renaming also updates its URL; the previous URL will continue to
              redirect.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name" className="text-sm font-semibold text-slate-700">
              Folder name
            </Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
              autoFocus
              disabled={loading}
              maxLength={100}
              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-group-description" className="text-sm font-semibold text-slate-700">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="edit-group-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFormError("");
              }}
              rows={4}
              disabled={loading}
              maxLength={500}
              className="resize-none rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
            <p className="text-right text-[11px] text-slate-400">{description.length}/500</p>
          </div>
          {formError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
