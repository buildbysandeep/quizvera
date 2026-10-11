"use client";

import DashboardPage from "@/components/dashboard/page";
import Loading from "@/components/shared/Loading";
import AddGroup from "@/components/dialogs/AddGroup";
import { useGroups } from "@/hooks/useGroups";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { fetcher, fetcherOpt } from "@/lib/utils";
import { ArrowRight, File, FileQuestion, FolderPlus, Layers3, Sparkles, Users } from "lucide-react";

function Page() {
  const { data: session, status } = useSession();
  const { groups, isLoading } = useGroups();
  const { data: sharedData, isLoading: sharedLoading } = useSWR("/api/shared-quizzes", fetcher, fetcherOpt);
  const sharedQuizzes = Array.isArray(sharedData?.data) ? sharedData.data : [];

  if (isLoading || status === "loading" || (groups.length === 0 && sharedLoading)) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (groups.length === 0 && sharedData?.ok === true && sharedQuizzes.length === 0) {
    return <WelcomeScreen name={session?.user?.name} />;
  }

  return <DashboardPage />;
}

const WelcomeScreen = ({ name }: { name: string | null | undefined }) => {
  const firstName = name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-5xl items-center justify-center">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_0.8fr]">
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Your quiz workspace
          </span>

          <h1 className="max-w-lg text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Welcome, {firstName}.<span className="mt-1 block text-indigo-600">Start with a folder.</span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            Folders keep quizzes organized by class, subject, or project. Create your first folder, then add quizzes and
            review participant results from one place.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <AddGroup />
            <span className="text-xs text-slate-400">You can create more folders later.</span>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Layers3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800">Organize with folders</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">Keep each set in its own folder.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <FolderPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800">Build assessments</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">Add questions and share quizzes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[440px] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-2xl" />

          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur">
              <FolderPlus className="h-5 w-5" />
            </div>
            <h2 className="mt-6 max-w-xs text-2xl font-bold leading-tight text-white">
              One workspace for every assessment.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-indigo-100/80">
              Create a folder first. Your quiz library will appear here once you add one.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100/70">
              How your workspace is organized
            </p>
            <div className="rounded-xl border border-amber-200/30 bg-amber-300/10 p-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-200 text-amber-950">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Folder · BCA Semester 1</p>
                  <p className="mt-0.5 text-[10px] text-indigo-100/70">A subject, class, or project</p>
                </div>
                <ArrowRight className="h-4 w-4 text-indigo-100/80" />
              </div>
              <div className="ml-4 mt-3 space-y-2 border-l border-white/20 pl-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2">
                  <Layers3 className="h-4 w-4 shrink-0 text-indigo-200" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">HTML fundamentals quiz</span>
                  <span className="text-[9px] text-indigo-100/60">Quiz</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2">
                  <Layers3 className="h-4 w-4 shrink-0 text-indigo-200" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">
                    JavaScript fundamentals quiz
                  </span>
                  <span className="text-[9px] text-indigo-100/60">Quiz</span>
                </div>
                {/* <div className="ml-3 flex items-center gap-2 border-l border-white/15 pl-3 text-[10px] text-indigo-100/80">
                  <Users className="h-3.5 w-3.5" />
                  Participant submissions and results
                </div> */}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-indigo-100/70">
              <span>Folder → quizzes → results</span>
              <span className="rounded-md bg-white/10 px-2 py-1">Create folder first</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
