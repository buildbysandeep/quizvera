"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3, Loader2, Play, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IQuiz } from "@/types";
import { error, success } from "@/lib/utils";
import { startQuizAvailabilityDB, updateQuizAvailabilityDB } from "@/lib/actions/quiz.actions";

type Mode = "ALWAYS" | "PUBLISH_TIMER" | "MANUAL_TIMER" | "FIXED_WINDOW";

type AvailabilityFields = Pick<
  IQuiz,
  | "id"
  | "published"
  | "publishedAt"
  | "createdAt"
  | "availabilityMode"
  | "availabilityDurationMinutes"
  | "availabilityStartedAt"
  | "availabilityStartsAt"
  | "availabilityEndsAt"
>;

function toLocalInput(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function prettyDate(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function millis(value?: string | Date | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  const clock = [hours, minutes, remaining].map((part) => String(part).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

function LiveAvailabilityStatus({ quiz }: { quiz: AvailabilityFields }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const mode = quiz.availabilityMode || "ALWAYS";
  const startPublished =
    mode === "MANUAL_TIMER"
      ? millis(quiz.availabilityStartedAt)
      : (millis(quiz.availabilityStartedAt) ?? millis(quiz.publishedAt));
  const durationMinutes = Number(quiz.availabilityDurationMinutes ?? 0);
  const sharedTimerEnd =
    (mode === "PUBLISH_TIMER" || mode === "MANUAL_TIMER") && startPublished !== null && durationMinutes > 0
      ? startPublished + durationMinutes * 60_000
      : null;
  const scheduledEnd = mode === "FIXED_WINDOW" ? millis(quiz.availabilityEndsAt) : null;
  let headline = "Always available";
  let subline = "There is no shared countdown. The quiz stays open while it is published.";
  let target: number | null = null;
  let targetLabel = "";
  let state: "open" | "waiting" | "closed" | "neutral" = "neutral";

  if ((sharedTimerEnd !== null && now >= sharedTimerEnd) || (scheduledEnd !== null && now >= scheduledEnd)) {
    const endedAt = sharedTimerEnd !== null && now >= sharedTimerEnd ? sharedTimerEnd : scheduledEnd;
    headline = "Shared deadline passed";
    subline = `The availability window ended at ${new Date(endedAt!).toLocaleString()}. New attempts and submissions are blocked.`;
    state = "closed";
  } else if (!quiz.published) {
    headline = "Timer is not active yet";
    subline =
      mode === "FIXED_WINDOW"
        ? "The scheduled opening countdown becomes active after the quiz is published."
        : mode === "MANUAL_TIMER"
          ? "Publish the quiz first; participants can then wait here until you start the timer."
          : mode === "PUBLISH_TIMER"
            ? "The shared countdown begins when you publish this quiz."
            : "Publish the quiz to make the availability rules active.";
    state = "neutral";
  } else if (mode === "PUBLISH_TIMER") {
    if (durationMinutes <= 0 || startPublished === null) {
      headline = "Auto-close timer is not configured";
      subline = "Set a duration and save the availability settings to establish the shared deadline.";
      state = "neutral";
    } else {
      target = startPublished + durationMinutes * 60_000;
      targetLabel = "Closes in";
      state = now >= target ? "closed" : "open";
      headline = state === "closed" ? "Shared deadline passed" : "Quiz is live · auto-close enabled";
      subline =
        state === "closed"
          ? "The shared time window has ended. New attempts are blocked."
          : `All participants share the same closing time: ${new Date(target).toLocaleString()}.`;
    }
  } else if (mode === "MANUAL_TIMER") {
    const started = millis(quiz.availabilityStartedAt);
    if (started === null) {
      headline = "Waiting for admin to start";
      subline = "Participants can open the link, but questions remain hidden until you start the shared timer.";
      state = "waiting";
    } else if (durationMinutes <= 0) {
      headline = "Shared timer started · no auto-close";
      subline = `Timer started ${new Date(started).toLocaleString()}. Unpublish manually to stop sharing.`;
      state = "open";
    } else {
      target = started + durationMinutes * 60_000;
      targetLabel = "Closes in";
      state = now >= target ? "closed" : "open";
      headline = state === "closed" ? "Shared deadline passed" : "Shared timer running";
      subline =
        state === "closed"
          ? "The timer has expired and participants can no longer continue."
          : `Started ${new Date(started).toLocaleString()}; closes at ${new Date(target).toLocaleString()}.`;
    }
  } else if (mode === "FIXED_WINDOW") {
    const start = millis(quiz.availabilityStartsAt);
    const end = millis(quiz.availabilityEndsAt);
    if (start === null || end === null || end <= start) {
      headline = "Schedule incomplete";
      subline = "Set valid opening and closing times, then save the settings.";
      state = "neutral";
    } else if (now < start) {
      target = start;
      targetLabel = "Opens in";
      headline = "Waiting for scheduled opening";
      subline = `The quiz opens at ${new Date(start).toLocaleString()} and closes at ${new Date(end).toLocaleString()}.`;
      state = "waiting";
    } else if (now < end) {
      target = end;
      targetLabel = "Closes in";
      headline = "Quiz is live · scheduled window";
      subline = `This time window ends at ${new Date(end).toLocaleString()}.`;
      state = "open";
    } else {
      headline = "Scheduled window ended";
      subline = `This quiz stopped being available at ${new Date(end).toLocaleString()}.`;
      state = "closed";
    }
  }

  const tones = {
    open: "border-emerald-200 bg-emerald-50 text-emerald-800",
    waiting: "border-amber-200 bg-amber-50 text-amber-800",
    closed: "border-rose-200 bg-rose-50 text-rose-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[state]}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${state === "open" ? "animate-pulse bg-emerald-500" : state === "waiting" ? "bg-amber-500" : state === "closed" ? "bg-rose-500" : "bg-slate-400"}`}
            />
            <p className="text-sm font-semibold">Live status · {headline}</p>
          </div>
          <p className="mt-1 text-xs leading-5 opacity-90">{subline}</p>
        </div>
        {target !== null && (
          <div className="shrink-0 rounded-xl border border-current/20 bg-white/80 px-3 py-2 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{targetLabel}</p>
            <p
              className="font-mono text-xl font-bold tabular-nums"
              role="timer"
              aria-label={`${targetLabel} ${formatCountdown(target - now)}`}
            >
              {formatCountdown(target - now)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizAvailabilitySettings({
  quiz,
  setData,
}: {
  quiz: AvailabilityFields;
  setData: React.Dispatch<React.SetStateAction<IQuiz | null>>;
}) {
  const [mode, setMode] = useState<Mode>(quiz.availabilityMode || "ALWAYS");
  const [duration, setDuration] = useState(quiz.availabilityDurationMinutes ? String(quiz.availabilityDurationMinutes) : "");
  const [startsAt, setStartsAt] = useState(toLocalInput(quiz.availabilityStartsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(quiz.availabilityEndsAt));
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const modeLabel = useMemo(
    () =>
      ({
        ALWAYS: "Always available",
        PUBLISH_TIMER: "Auto-close after publishing",
        MANUAL_TIMER: "Wait for admin to start",
        FIXED_WINDOW: "Fixed time window",
      })[quiz.availabilityMode || "ALWAYS"],
    [quiz.availabilityMode],
  );

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const minutes = duration.trim() ? Number(duration) : null;
      const result = await updateQuizAvailabilityDB({
        quizId: quiz.id,
        mode,
        durationMinutes: minutes,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      if (!result.ok) throw new Error(result.error || "Could not save availability settings.");
      setData((current) =>
        current
          ? {
              ...current,
              availabilityMode: result.data.availabilityMode,
              availabilityDurationMinutes: result.data.availabilityDurationMinutes,
              availabilityStartedAt: result.data.availabilityStartedAt,
              availabilityStartsAt: result.data.availabilityStartsAt,
              availabilityEndsAt: result.data.availabilityEndsAt,
            }
          : current,
      );
      success("Availability settings saved.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not save availability settings.");
    } finally {
      setSaving(false);
    }
  };

  const startTimer = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const result = await startQuizAvailabilityDB({ quizId: quiz.id });
      if (!result.ok) throw new Error(result.error || "Could not start the shared timer.");
      setData((current) => (current ? { ...current, availabilityStartedAt: result.data.availabilityStartedAt } : current));
      success(result.alreadyStarted ? "The shared timer has already started." : "Shared timer started for everyone.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not start the shared timer.");
    } finally {
      setStarting(false);
    }
  };

  const isManualWaiting = quiz.availabilityMode === "MANUAL_TIMER" && !quiz.availabilityStartedAt;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Availability & shared timer</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            This timer is shared by every participant. It is separate from the per-person quiz duration.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${quiz.published ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
        >
          {quiz.published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <LiveAvailabilityStatus quiz={quiz} />
        <div className="grid gap-2 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
          <Label htmlFor={`availability-mode-${quiz.id}`} className="pt-2 text-sm text-slate-700">
            Availability mode
          </Label>
          <div className="space-y-2">
            <select
              id={`availability-mode-${quiz.id}`}
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-offset-white focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="ALWAYS">Always available</option>
              <option value="PUBLISH_TIMER">Auto-close after publishing</option>
              <option value="MANUAL_TIMER">Admin starts shared timer</option>
              <option value="FIXED_WINDOW">Fixed start and end time</option>
            </select>
            <p className="text-xs leading-5 text-slate-500">
              {mode === "ALWAYS" && "The quiz stays available while published. Stop sharing manually whenever you need."}
              {mode === "PUBLISH_TIMER" &&
                "The shared countdown begins when you publish. Everyone sees the same closing deadline."}
              {mode === "MANUAL_TIMER" &&
                "Publish the link while participants wait. Start the clock here when you are ready; an optional duration can close it automatically."}
              {mode === "FIXED_WINDOW" &&
                "The quiz opens automatically at the start time and stops accepting new or in-progress submissions at the end time."}
            </p>
          </div>
        </div>

        {(mode === "PUBLISH_TIMER" || mode === "MANUAL_TIMER") && (
          <div className="grid gap-2 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
            <Label htmlFor={`availability-duration-${quiz.id}`} className="pt-2 text-sm text-slate-700">
              Shared duration
            </Label>
            <div className="space-y-2">
              <div className="relative max-w-sm">
                <Input
                  id={`availability-duration-${quiz.id}`}
                  type="number"
                  min={1}
                  max={10080}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  placeholder={mode === "MANUAL_TIMER" ? "No automatic closing" : "60"}
                  className="h-11 rounded-xl pr-20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  minutes
                </span>
              </div>
              {mode === "MANUAL_TIMER" && (
                <p className="text-xs text-slate-500">Leave empty to keep it open until you manually unpublish it.</p>
              )}
            </div>
          </div>
        )}

        {mode === "FIXED_WINDOW" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`availability-start-${quiz.id}`}>Opens at</Label>
              <Input
                id={`availability-start-${quiz.id}`}
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`availability-end-${quiz.id}`}>Closes at</Label>
              <Input
                id={`availability-end-${quiz.id}`}
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">Current configuration: {modeLabel}</p>
              {quiz.availabilityMode === "MANUAL_TIMER" && quiz.availabilityStartedAt ? (
                <p className="mt-1 text-xs text-slate-500">
                  Timer started {prettyDate(quiz.availabilityStartedAt)}
                  {quiz.availabilityDurationMinutes
                    ? ` · closes ${prettyDate(new Date(new Date(quiz.availabilityStartedAt).getTime() + quiz.availabilityDurationMinutes * 60_000))}`
                    : " · no automatic close"}
                  .
                </p>
              ) : null}
              {quiz.availabilityMode === "PUBLISH_TIMER" && quiz.published ? (
                <p className="mt-1 text-xs text-slate-500">
                  The end time is calculated from the publication/start timestamp and shared duration.
                </p>
              ) : null}
              {quiz.availabilityMode === "FIXED_WINDOW" ? (
                <p className="mt-1 text-xs text-slate-500">
                  {prettyDate(quiz.availabilityStartsAt) || "Start time not set"} →{" "}
                  {prettyDate(quiz.availabilityEndsAt) || "End time not set"}
                </p>
              ) : null}
              {quiz.availabilityMode === "ALWAYS" ? (
                <p className="mt-1 text-xs text-slate-500">No shared deadline is configured.</p>
              ) : null}
              {!quiz.published && (
                <p className="mt-2 text-xs text-slate-600">
                  Publish this quiz to make its waiting room or availability schedule accessible.
                </p>
              )}
              {isManualWaiting && quiz.published && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Participants can open the link and wait here until you start the timer.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          {quiz.published && quiz.availabilityMode === "MANUAL_TIMER" && !quiz.availabilityStartedAt && (
            <Button
              type="button"
              onClick={startTimer}
              disabled={starting || saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="mr-2 h-4 w-4" />
              {starting ? "Starting…" : "Start timer for everyone"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={save} disabled={saving || starting} className="rounded-xl">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving…" : "Save availability"}
          </Button>
        </div>
      </div>
    </section>
  );
}
