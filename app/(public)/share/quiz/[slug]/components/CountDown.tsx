"use client";

import React, { useEffect } from "react";
import { Clock3, Timer } from "lucide-react";

const CountDown = ({
  duration,
  setOpenTimeOutDialog,
  setOpenTimeLeftDialog,
  user,
  hideDisplay = false,
}: {
  duration: number;
  setOpenTimeOutDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenTimeLeftDialog: React.Dispatch<React.SetStateAction<boolean>>;
  user: unknown;
  /** Keep per-attempt timeout enforcement but hide its banner when the quiz has a shared deadline. */
  hideDisplay?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = React.useState(Math.max(0, duration || 0));
  const notifiedTimeLeft = React.useRef(false);
  const timeoutOpened = React.useRef(false);

  useEffect(() => {
    setTimeLeft(Math.max(0, duration || 0));
    notifiedTimeLeft.current = false;
    timeoutOpened.current = false;
  }, [duration]);

  useEffect(() => {
    if (!user || duration <= 0) return;

    if (timeLeft <= 0) {
      if (!timeoutOpened.current) {
        timeoutOpened.current = true;
        setOpenTimeOutDialog(true);
      }
      return;
    }

    if (timeLeft <= 300 && !notifiedTimeLeft.current) {
      notifiedTimeLeft.current = true;
      setOpenTimeLeftDialog(true);
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [timeLeft, user, setOpenTimeOutDialog, setOpenTimeLeftDialog]);

  if (hideDisplay) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const time = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  const urgent = Boolean(user) && duration > 0 && timeLeft <= 300;
  const hasTimeLimit = duration > 0;

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${urgent ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}
          >
            {user ? <Timer className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">
              {!hasTimeLimit ? "Time limit" : user ? "Time remaining" : "Quiz duration"}
            </p>
            <p className="text-[10px] text-slate-500">
              {!hasTimeLimit ? "No time limit set" : user ? "Your timer is running" : "Timer starts when you begin"}
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl border px-3 py-1.5 font-mono text-lg font-bold tabular-nums tracking-wide sm:px-4 sm:text-xl ${urgent ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-900"}`}
          role="timer"
          aria-live={urgent ? "assertive" : "off"}
        >
          {hasTimeLimit ? time : "No limit"}
        </div>
      </div>
    </div>
  );
};

export default CountDown;
