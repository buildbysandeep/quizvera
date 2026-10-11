"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import Header from "@/components/shared/Header";
import Sidenav from "@/components/shared/Sidenav";
import { AuthProvider } from "@/app/providers";

type DashboardShellProps = { children: React.ReactNode; session: Session };
const MIN_WIDTH = 216;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 264;

export default function DashboardShell({ children, session }: DashboardShellProps) {
  const [sidebarMini, setSidebarMini] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("quizvera-sidebar-width"));
    if (Number.isFinite(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH) setSidebarWidth(saved);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragStart.current) return;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStart.current.width + event.clientX - dragStart.current.x));
    setSidebarWidth(next);
  }, []);

  const stopResizing = useCallback(() => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setResizing(false);
    window.localStorage.setItem("quizvera-sidebar-width", String(sidebarWidth));
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [sidebarWidth]);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [resizing, handlePointerMove, stopResizing]);

  const startResizing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sidebarMini) return;
    dragStart.current = { x: event.clientX, width: sidebarWidth };
    setResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleResizeKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => {
        const next = Math.max(MIN_WIDTH, width - 12);
        window.localStorage.setItem("quizvera-sidebar-width", String(next));
        return next;
      });
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => {
        const next = Math.min(MAX_WIDTH, width + 12);
        window.localStorage.setItem("quizvera-sidebar-width", String(next));
        return next;
      });
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]" style={{ "--sidebar-width": `${sidebarMini ? 76 : sidebarWidth}px` } as React.CSSProperties}>
      <aside className="sticky top-0 hidden h-screen min-h-0 border-r border-slate-200 bg-white md:block">
        <Sidenav collapsed={sidebarMini} onToggleCollapsed={() => setSidebarMini((current) => !current)} />
      </aside>
      <div className="relative flex min-w-0 flex-col">
        {!sidebarMini && <div role="separator" aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} aria-valuenow={sidebarWidth} tabIndex={0} onPointerDown={startResizing} onKeyDown={handleResizeKey} className={`absolute -left-1.5 top-0 z-30 hidden h-full w-3 cursor-col-resize touch-none items-center justify-center outline-none md:flex ${resizing ? "bg-indigo-100/50" : "hover:bg-indigo-50/70"}`} title="Drag to resize the sidebar; use arrow keys when focused"><span className={`h-10 w-1 rounded-full transition-colors ${resizing ? "bg-indigo-500" : "bg-slate-300 hover:bg-indigo-400"}`} /></div>}
        <Header session={session} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 xs:p-2 lg:gap-6 lg:p-4">
          <AuthProvider session={session}>{children}</AuthProvider>
        </main>
      </div>
    </div>
  );
}
