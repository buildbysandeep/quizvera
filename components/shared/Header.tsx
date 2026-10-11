"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Sidenav from "@/components/shared/Sidenav";
import { UserNav } from "./user-nav";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import { SiPlatformdotsh } from "react-icons/si";
import Link from "next/link";

const getPageTitle = (pathname: string) => {
  if (pathname.includes("/quiz/create")) return "Create quiz";
  if (pathname.includes("/quiz/edit")) return "Edit quiz";
  if (pathname === "/quiz" || pathname.startsWith("/quiz/")) return "Quiz management";
  if (pathname.startsWith("/group")) return "Folder workspace";
  return "Dashboard";
};

const Header = ({ session }: { session: Session }) => {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname || "/");

  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-slate-200 text-slate-600 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[290px] max-w-[85vw] flex-col gap-0 p-0 sm:max-w-[290px]">
            <SheetHeader className="flex h-[68px] shrink-0 flex-row items-center border-b border-slate-100 px-5 text-left">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
                  <SiPlatformdotsh className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <SheetTitle className="text-sm font-bold tracking-tight text-slate-950">Quizvera</SheetTitle>
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Workspace
                  </span>
                </span>
              </Link>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <Sidenav />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">Manage your quizzes and folders</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Workspace active
        </div>
        <div className="h-7 w-px bg-slate-200" />
        <UserNav session={session} />
      </div>
    </header>
  );
};

export default Header;
