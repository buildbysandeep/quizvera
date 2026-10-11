"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import AddGroup from "@/components/dialogs/AddGroup";
import { useDataStore } from "@/stores/data";
import useSWR from "swr";
import { fetcher, fetcherOpt, formatDate } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  Circle,
  FileQuestion,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Users,
} from "lucide-react";
import { SiPlatformdotsh } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SidebarQuiz = {
  id: string;
  title: string;
  desc?: string | null;
  published?: boolean;
  createdAt: string | Date;
  _count?: {
    questions?: number;
    participants?: number;
  };
};

type SidebarGroup = {
  id: string;
  name: string;
  quizzes?: SidebarQuiz[] | null;
};

type SidenavProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const Sidenav = ({ collapsed = false, onToggleCollapsed }: SidenavProps) => {
  const groups = useDataStore((state) => state.groups ?? []) as SidebarGroup[];
  const setGroups = useDataStore((state) => state.setGroups);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeId = searchParams.get("id");
  const groupQueryId = searchParams.get("group");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [miniOpenGroupId, setMiniOpenGroupId] = useState<string | null>(null);

  const { data, isLoading, error: loadError } = useSWR("/api/groups", fetcher, fetcherOpt);

  useEffect(() => {
    if (data?.ok && Array.isArray(data.data)) {
      setGroups(data.data);
    }
  }, [data, setGroups]);

  const isDashboardActive = pathname === "/";
  const isMyQuizzesActive = pathname.startsWith("/my-quizes");
  const isGroupRoute = pathname.startsWith("/group");
  const isQuizRoute = pathname.startsWith("/quiz");
  const activeQuizId = isQuizRoute && pathname !== "/quiz/create" ? routeId : null;
  const activeGroupId = isGroupRoute ? routeId : pathname === "/quiz/create" ? groupQueryId : null;

  const activeQuizGroupId = activeQuizId
    ? groups.find((group) => (group.quizzes ?? []).some((quiz) => quiz.id === activeQuizId))?.id
    : undefined;
  const groupToAutoExpand = activeGroupId || activeQuizGroupId;

  useEffect(() => {
    if (!groupToAutoExpand) return;
    setExpandedGroups((current) => (current[groupToAutoExpand] ? current : { ...current, [groupToAutoExpand]: true }));
  }, [groupToAutoExpand]);

  // Close the compact group's popover after navigating to another route.
  useEffect(() => {
    setMiniOpenGroupId(null);
  }, [pathname, routeId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const getGroupInitial = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return (words[0]?.slice(0, 2) || "G").toUpperCase();
  };

  const renderGroupIcon = (group: SidebarGroup, highlighted: boolean) => (
    <span
      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold tracking-tight transition-colors ${
        highlighted
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : "border border-slate-200 bg-white text-slate-600 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700"
      }`}
    >
      {getGroupInitial(group.name)}
      {highlighted && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </span>
  );

  return (
    <div className={`flex h-full min-h-0 flex-col bg-white ${collapsed ? "items-center" : ""}`}>
      {/* Brand / collapse control */}
      <div
        className={`flex shrink-0 border-b border-slate-100 ${
          collapsed ? "h-[60px] w-full items-center justify-center gap-1 px-1" : "h-[60px] items-center justify-between px-4"
        }`}
      >
        <Link
          href="/"
          title="Quizvera dashboard"
          aria-label="Quizvera dashboard"
          className={`flex min-w-0 items-center gap-2 font-semibold text-slate-900 ${collapsed ? "justify-center" : ""}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <SiPlatformdotsh className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && <span className="truncate text-sm tracking-tight">Quizvera</span>}
        </Link>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`grid shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              collapsed ? "h-8 w-7" : "h-8 w-8"
            }`}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Dashboard */}
      <nav className={`w-full shrink-0 pt-4 ${collapsed ? "px-2" : "px-3"}`} aria-label="Main navigation">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        )}
        <Link
          href="/"
          title={collapsed ? "Dashboard" : undefined}
          aria-label="Dashboard"
          className={`group relative flex items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5"
          } ${isDashboardActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
        >
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="flex-1">Dashboard</span>}
          {!collapsed && isDashboardActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
          {collapsed && isDashboardActive && <span className="absolute -left-2 h-6 w-1 rounded-r-full bg-indigo-600" />}
        </Link>
        <Link
          href="/my-quizes"
          title={collapsed ? "My quizzes" : undefined}
          aria-label="My quizzes"
          className={`group relative mt-1 flex items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2.5"
          } ${isMyQuizzesActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
        >
          <BookOpenCheck className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="flex-1">My quizzes</span>}
          {!collapsed && isMyQuizzesActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
          {collapsed && isMyQuizzesActive && <span className="absolute -left-2 h-6 w-1 rounded-r-full bg-indigo-600" />}
        </Link>
      </nav>

      {/* Group navigation */}
      <section
        className={`mt-6 flex min-h-0 w-full flex-1 flex-col ${collapsed ? "px-2" : "px-3"}`}
        aria-label="Groups and quizzes"
      >
        <div className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          {!collapsed && <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Your workspace</p>}
          <span
            title={`${groups.length} groups`}
            className={`rounded-md bg-slate-100 text-[10px] font-semibold tabular-nums text-slate-500 ${
              collapsed ? "grid h-5 min-w-5 place-items-center px-1" : "px-1.5 py-0.5"
            }`}
          >
            {groups.length}
          </span>
        </div>

        <div className="min-h-0 w-full flex-1 space-y-1 overflow-y-auto overflow-x-hidden pb-3">
          {isLoading && groups.length === 0 && (
            <div className="space-y-2 px-1 py-2" aria-label="Loading groups">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className={`${collapsed ? "mx-auto h-9 w-9" : "h-9 w-full"} animate-pulse rounded-xl bg-slate-100`}
                />
              ))}
            </div>
          )}

          {!isLoading &&
            loadError &&
            groups.length === 0 &&
            (collapsed ? (
              <div
                title="Could not load groups. Refresh to try again."
                className="mx-auto grid h-9 w-9 place-items-center rounded-xl text-rose-600"
              >
                <FolderKanban className="h-4 w-4" />
              </div>
            ) : (
              <p className="px-3 py-2 text-xs leading-5 text-rose-600">Could not load groups. Refresh to try again.</p>
            ))}

          {!isLoading &&
            !loadError &&
            groups.length === 0 &&
            (collapsed ? (
              <div
                title="No groups yet"
                className="mx-auto grid h-9 w-9 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400"
              >
                <FolderKanban className="h-4 w-4" />
              </div>
            ) : (
              <div className="mx-1 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center">
                <FolderKanban className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-2 text-xs font-medium text-slate-700">No groups yet</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">Create a group to organize quizzes.</p>
              </div>
            ))}

          {groups.map((group) => {
            const quizzes = group.quizzes ?? [];
            const isGroupActive =
              (isGroupRoute && routeId === group.id) || (pathname === "/quiz/create" && groupQueryId === group.id);
            const containsActiveQuiz = Boolean(activeQuizId && quizzes.some((quiz) => quiz.id === activeQuizId));
            const groupIsHighlighted = isGroupActive || containsActiveQuiz;
            const isExpanded = Boolean(expandedGroups[group.id]);

            if (collapsed) {
              return (
                <div key={group.id} className="flex justify-center py-0.5">
                  <Popover
                    open={miniOpenGroupId === group.id}
                    onOpenChange={(open) => setMiniOpenGroupId(open ? group.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        title={`${group.name} · ${quizzes.length} ${quizzes.length === 1 ? "quiz" : "quizzes"}`}
                        aria-label={`Open ${group.name} group menu`}
                        aria-expanded={miniOpenGroupId === group.id}
                        className={`group relative grid h-11 w-11 place-items-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          groupIsHighlighted || miniOpenGroupId === group.id
                            ? "bg-indigo-50 ring-1 ring-indigo-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {renderGroupIcon(group, groupIsHighlighted)}
                        {quizzes.length > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-slate-200 px-0.5 text-[8px] font-bold leading-none text-slate-600">
                            {quizzes.length > 9 ? "9+" : quizzes.length}
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-[280px] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl shadow-slate-900/10"
                    >
                      <div className="border-b border-slate-100 bg-slate-50/80 p-3">
                        <div className="flex items-center gap-3">
                          {renderGroupIcon(group, groupIsHighlighted)}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{group.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/group?id=${group.id}`}
                          onClick={() => setMiniOpenGroupId(null)}
                          className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <span className="flex items-center gap-2">
                            <FolderKanban className="h-3.5 w-3.5" /> Open group
                          </span>
                          <span aria-hidden="true">↗</span>
                        </Link>
                      </div>

                      <div className="max-h-[min(55vh,420px)] overflow-y-auto p-2">
                        <div className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Quizzes
                        </div>
                        {quizzes.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center">
                            <FileQuestion className="mx-auto h-5 w-5 text-slate-400" />
                            <p className="mt-2 text-xs font-medium text-slate-700">No quizzes yet</p>
                            <p className="mt-1 text-[11px] text-slate-400">Add a quiz to this group.</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {quizzes.map((quiz) => {
                              const isQuizActive = activeQuizId === quiz.id;
                              return (
                                <Link
                                  key={quiz.id}
                                  href={`/quiz?id=${quiz.id}`}
                                  onClick={() => setMiniOpenGroupId(null)}
                                  className={`flex min-w-0 items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors ${
                                    isQuizActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isQuizActive ? "bg-white/15" : "bg-slate-100"}`}
                                  >
                                    <FileQuestion className={`h-4 w-4 ${isQuizActive ? "text-white" : "text-slate-500"}`} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold">{quiz.title}</span>
                                    <span
                                      className={`mt-1 block text-[10px] ${isQuizActive ? "text-indigo-100" : "text-slate-500"}`}
                                    >
                                      {quiz._count?.questions ?? 0} questions · {quiz._count?.participants ?? 0} participants
                                    </span>
                                    <span
                                      className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${isQuizActive ? "text-indigo-100" : "text-slate-400"}`}
                                    >
                                      <Circle
                                        className={`h-1.5 w-1.5 fill-current ${quiz.published ? "text-emerald-500" : "text-slate-300"}`}
                                      />
                                      {quiz.published ? "Published" : "Draft"}
                                    </span>
                                  </span>
                                  {isQuizActive && <Check className="mt-1 h-3.5 w-3.5 shrink-0" />}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                        <Link
                          href={`/quiz/create?group=${group.id}`}
                          onClick={() => setMiniOpenGroupId(null)}
                          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add quiz
                        </Link>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }

            return (
              <div key={group.id} className="w-full min-w-0">
                <div
                  className={`flex min-w-0 items-center rounded-xl transition-colors ${
                    groupIsHighlighted ? "bg-indigo-50/80" : "hover:bg-slate-50"
                  }`}
                >
                  <Link
                    href={`/group?id=${group.id}`}
                    title={group.name}
                    aria-label={`Open group ${group.name}`}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-l-xl py-2.5 pl-2.5 pr-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isGroupActive
                        ? "text-indigo-700"
                        : containsActiveQuiz
                          ? "text-slate-900"
                          : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${groupIsHighlighted ? "bg-white text-indigo-600 ring-1 ring-indigo-100" : "bg-slate-100 text-slate-500"}`}
                    >
                      {getGroupInitial(group.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{group.name}</span>
                  </Link>

                  <span className="mr-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-400">
                    {quizzes.length}
                  </span>

                  <button
                    type="button"
                    title={`${isExpanded ? "Collapse" : "Expand"} ${group.name} quizzes`}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.name} quizzes`}
                    aria-expanded={isExpanded}
                    onClick={() => toggleGroup(group.id)}
                    className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {isExpanded && (
                  <div className="ml-[22px] mt-1 space-y-1 border-l border-slate-200 pb-2 pl-3">
                    {quizzes.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] leading-4 text-slate-400">No quizzes yet</p>
                    ) : (
                      quizzes.map((quiz) => {
                        const isQuizActive = activeQuizId === quiz.id;
                        return (
                          <Link
                            key={quiz.id}
                            href={`/quiz?id=${quiz.id}`}
                            title={quiz.title}
                            aria-label={`Open quiz ${quiz.title}`}
                            className={`group flex min-w-0 items-start gap-2 rounded-lg px-2 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                              isQuizActive
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                          >
                            <FileQuestion
                              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isQuizActive ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-600"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{quiz.title}</span>
                              <span className="mt-1 block truncate text-[10px]">
                                {quiz._count?.questions ?? 0} questions · {quiz._count?.participants ?? 0} participants
                              </span>
                              <span className="mt-1 flex items-center justify-between gap-1.5">
                                <span className="truncate text-[10px]">{formatDate(new Date(quiz.createdAt))}</span>
                                <span
                                  className={`flex shrink-0 items-center gap-1 text-[10px] ${isQuizActive ? "text-indigo-100" : "text-slate-400"}`}
                                >
                                  <Circle
                                    className={`h-1.5 w-1.5 fill-current ${quiz.published ? (isQuizActive ? "text-emerald-200" : "text-emerald-500") : isQuizActive ? "text-indigo-200" : "text-slate-300"}`}
                                  />
                                  {quiz.published ? "Published" : "Draft"}
                                </span>
                              </span>
                            </span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Add group action */}
      <div className={`shrink-0 border-t border-slate-100 ${collapsed ? "w-full p-2" : "p-3"}`}>
        {collapsed ? (
          <div className="relative mx-auto h-10 w-10 [&_button]:!flex [&_button]:!h-10 [&_button]:!w-10 [&_button]:!min-w-0 [&_button]:!items-center [&_button]:!justify-center [&_button]:!gap-0 [&_button]:!overflow-hidden [&_button]:!rounded-xl [&_button]:!border [&_button]:!border-slate-200 [&_button]:!bg-slate-50 [&_button]:!p-0 [&_button]:!text-transparent [&_button_svg]:!hidden">
            <AddGroup fullWidth />
            <span className="pointer-events-none absolute inset-0 grid place-items-center text-slate-600">
              <Plus className="h-4 w-4" />
            </span>
          </div>
        ) : (
          <>
            <AddGroup fullWidth />
            <p className="mt-2 text-center text-[10px] text-slate-400">Create a group for each class or project</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidenav;
