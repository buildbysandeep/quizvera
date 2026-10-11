"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addQuizAdminDB, getQuizAdminsDB, removeQuizAdminDB } from "@/lib/actions/collaboration.actions";
import { error, success } from "@/lib/utils";

type AdminInfo = { id: string; name: string | null; email: string };
type Collaborator = { id: string; userId: string; name: string | null; email: string; createdAt: string | Date };

export default function QuizAdmins({ quizId }: { quizId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [mainAdmin, setMainAdmin] = useState<AdminInfo | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getQuizAdminsDB({ quizId });
      if (!response.ok || !response.data) throw new Error(response.error || "Unable to load quiz admins.");
      setMainAdmin(response.data.mainAdmin as AdminInfo);
      setCollaborators(response.data.collaborators as Collaborator[]);
      setCanManage(Boolean(response.data.canManage));
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to load quiz admins.");
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => { if (open) void loadAdmins(); }, [open, loadAdmins]);

  const addAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const response = await addQuizAdminDB({ quizId, email });
      if (!response.ok) throw new Error(response.error || "Could not share this quiz.");
      setEmail("");
      await loadAdmins();
      success("Quiz shared with this account.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not share this quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeAdmin = async (collaborator: Collaborator) => {
    if (!canManage || removingUserId) return;
    if (!window.confirm(`Remove ${collaborator.email}'s access to this quiz?`)) return;
    setRemovingUserId(collaborator.userId);
    try {
      const response = await removeQuizAdminDB({ quizId, collaboratorUserId: collaborator.userId });
      if (!response.ok) throw new Error(response.error || "Could not remove this admin.");
      setCollaborators((current) => current.filter((item) => item.userId !== collaborator.userId));
      success("Quiz access removed.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not remove this admin.");
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="gap-2 rounded-lg"><Users className="h-4 w-4" /> Quiz admins</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[calc(100%-1.25rem)] max-w-xl overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader><DialogTitle>Quiz admins</DialogTitle><DialogDescription>Share access with another existing Quizvera account. The primary admin who created this quiz is permanent and cannot be removed.</DialogDescription></DialogHeader>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div> : <>
          <section className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white"><ShieldCheck className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{mainAdmin?.name || "Primary admin"}</p><span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">Primary admin</span></div><p className="mt-1 break-all text-xs text-slate-600">{mainAdmin?.email}</p><p className="mt-2 text-[11px] text-slate-500">Always retains access; cannot be removed from this quiz.</p></div></div>
          </section>
          <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Shared admins</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{collaborators.length}</span></div>
            {collaborators.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No other admins have access yet.</p> : <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">{collaborators.map((person) => <div key={person.userId} className="flex items-center gap-3 p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{(person.name || person.email).slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{person.name || "Quizvera user"}</p><p className="break-all text-xs text-slate-500">{person.email}</p></div>{canManage ? <Button type="button" variant="ghost" size="icon" disabled={removingUserId === person.userId} onClick={() => void removeAdmin(person)} aria-label={`Remove ${person.email}`} className="shrink-0 text-slate-500 hover:bg-rose-50 hover:text-rose-700">{removingUserId === person.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button> : null}</div>)}</div>}
          </section>
          {canManage ? <form onSubmit={addAdmin} className="space-y-3 border-t border-slate-200 pt-4"><label htmlFor="quiz-admin-email" className="text-sm font-semibold text-slate-900">Share with a Quizvera account</label><div className="flex flex-col gap-2 sm:flex-row"><Input id="quiz-admin-email" type="email" autoComplete="email" placeholder="teammate@example.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required className="rounded-xl" /><Button type="submit" disabled={isSaving} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add admin</Button></div><p className="text-[11px] leading-5 text-slate-500">Only the primary admin can add or remove collaborators. The invitee must already have a Quizvera account.</p></form> : <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Only the primary admin can change the admin list.</p>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
