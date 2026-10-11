"use client";

import React, { useState } from "react";
import type { Session } from "next-auth";
import Header from "@/components/shared/Header";
import Sidenav from "@/components/shared/Sidenav";
import { AuthProvider } from "@/app/providers";

type DashboardShellProps = {
  children: React.ReactNode;
  session: Session;
};

export default function DashboardShell({ children, session }: DashboardShellProps) {
  const [sidebarMini, setSidebarMini] = useState(false);

  return (
    <div
      className={`grid min-h-screen w-full transition-[grid-template-columns] duration-200 ${
        sidebarMini ? "md:grid-cols-[76px_minmax(0,1fr)]" : "md:grid-cols-[248px_minmax(0,1fr)]"
      }`}
    >
      <aside className="sticky top-0 hidden h-screen min-h-0 border-r border-slate-200 bg-white md:block">
        <Sidenav collapsed={sidebarMini} onToggleCollapsed={() => setSidebarMini((current) => !current)} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <Header session={session} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 xs:p-2 lg:gap-6 lg:p-4">
          <AuthProvider>{children}</AuthProvider>
        </main>
      </div>
    </div>
  );
}
