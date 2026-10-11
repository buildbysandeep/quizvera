"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ChevronRight, FileQuestion, Folder, FolderOpen, Users } from "lucide-react";
import type { IGroup } from "@/types";

type FolderQuiz = {
  id: string;
  slug?: string | null;
  title: string;
  published?: boolean;
  _count?: { questions?: number; participants?: number };
};

type FolderRecord = {
  id: string;
  slug?: string | null;
  name: string;
  desc?: string | null;
  quizzes?: FolderQuiz[] | null;
};

export default function FolderStructure({ groups, selectedGroupId }: { groups: IGroup[]; selectedGroupId: string }) {
  const folders = (groups as unknown as FolderRecord[]).filter((group) => selectedGroupId === "all" || group.id === selectedGroupId);
  const quizTotal = folders.reduce((total, folder) => total + (folder.quizzes?.length ?? 0), 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><FolderOpen className="h-5 w-5" /></span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your folder structure</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Folders organize quizzes. Each quiz keeps its questions, sharing settings, and participant submissions together.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">{folders.length} {folders.length === 1 ? "folder" : "folders"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">{quizTotal} {quizTotal === 1 ? "quiz" : "quizzes"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">Submissions</span>
        </div>
      </div>

      {folders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">No folders available in this view.</div>
      ) : (
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {folders.map((folder) => {
            const quizzes = folder.quizzes ?? [];
            const displayQuizzes = quizzes.slice(0, 4);
            return (
              <article key={folder.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-indigo-200">
                <Link href={`/group/${folder.slug || folder.id}`} className="group flex items-center gap-3 border-b border-slate-100 bg-amber-50/40 px-3.5 py-3 transition-colors hover:bg-amber-50">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-white text-amber-700 shadow-sm"><Folder className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{folder.name}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} · folder</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
                </Link>

                <div className="space-y-1.5 p-2.5">
                  {quizzes.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center">
                      <FileQuestion className="mx-auto h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-medium text-slate-600">No quizzes yet</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-400">Open this folder to add one.</p>
                    </div>
                  ) : (
                    <>
                      <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Quizzes inside</p>
                      {displayQuizzes.map((quiz) => (
                        <Link key={quiz.id} href={`/quiz/${quiz.slug || quiz.id}`} className="group flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${quiz.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><FileQuestion className="h-3.5 w-3.5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-slate-800 group-hover:text-indigo-700">{quiz.title}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                              <span>{quiz._count?.questions ?? 0} questions</span><span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{quiz._count?.participants ?? 0}</span>
                            </span>
                          </span>
                          <span className={`shrink-0 rounded-md px-1.5 py-1 text-[9px] font-semibold ${quiz.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{quiz.published ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Live</span> : "Draft"}</span>
                        </Link>
                      ))}
                      {quizzes.length > displayQuizzes.length && (
                        <Link href={`/group/${folder.slug || folder.id}`} className="block rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">View {quizzes.length - displayQuizzes.length} more {quizzes.length - displayQuizzes.length === 1 ? "quiz" : "quizzes"}</Link>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
