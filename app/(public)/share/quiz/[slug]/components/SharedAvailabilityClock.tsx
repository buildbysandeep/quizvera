"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalendarClock, Clock3 } from "lucide-react";

function formatRemaining(seconds: number) {
  const value = Math.max(0, seconds);
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secondsPart = value % 60;
  const time = [hours, minutes, secondsPart].map((part) => String(part).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${time}` : time;
}

export default function SharedAvailabilityClock({
  targetAt,
  label,
  waiting = false,
  onExpire,
}: {
  targetAt?: string | null;
  label: string;
  waiting?: boolean;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);
  onExpireRef.current = onExpire;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const target = targetAt ? new Date(targetAt).getTime() : Number.NaN;
  const remaining = Number.isFinite(target) ? Math.max(0, Math.ceil((target - now) / 1000)) : null;
  useEffect(() => {
    if (remaining === 0 && !waiting && onExpireRef.current && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current();
    }
  }, [remaining, waiting]);

  if (remaining === null) return null;

  return (
    <div
      className={`sticky top-0 z-50 flex w-full items-center justify-between gap-3 border-b px-4 py-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-opacity-95 sm:px-6 ${waiting ? "border-amber-200 bg-amber-50/80" : remaining <= 300 ? "border-rose-200 bg-rose-50/80" : "border-indigo-100 bg-indigo-50/80"}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${waiting ? "bg-white text-amber-700" : remaining <= 300 ? "bg-white text-rose-700" : "bg-white text-indigo-700"}`}
        >
          {waiting ? <CalendarClock className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900">{label}</p>
          <p className="text-[10px] text-slate-500">The same deadline applies to everyone.</p>
        </div>
      </div>
      <div
        role="timer"
        aria-label={`${label}: ${formatRemaining(remaining)}`}
        className={`shrink-0 rounded-xl border bg-white px-3 py-1.5 font-mono text-lg font-bold tabular-nums sm:px-4 ${waiting ? "border-amber-200 text-amber-800" : remaining <= 300 ? "border-rose-200 text-rose-700" : "border-indigo-100 text-indigo-800"}`}
      >
        {formatRemaining(remaining)}
      </div>
    </div>
  );
}
