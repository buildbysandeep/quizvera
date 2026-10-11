"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { LogOut, Settings, UserRound } from "lucide-react";

export function UserNav({ session }: { session: Session }) {
  const name = session.user?.name?.trim() || "User";
  const email = session.user?.email || "";
  const roles = (session.user as { role?: string[] } | undefined)?.role ?? [];
  const accountLabel = roles.includes("SUPERADMIN")
    ? "Super administrator"
    : roles.includes("ADMIN")
      ? "Administrator"
      : "Workspace member";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2 rounded-xl px-1.5 py-1.5 hover:bg-slate-100 sm:gap-3 sm:px-2"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
            {session.user?.image && <AvatarImage src={session.user.image} alt={name} />}
            <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 text-left sm:block">
            <span className="block truncate text-xs font-semibold text-slate-800">{name}</span>
            <span className="mt-0.5 block text-[10px] text-slate-500">{accountLabel}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 rounded-xl border-slate-200 p-1.5 shadow-lg" align="end" forceMount>
        <DropdownMenuLabel className="px-3 py-3 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              {session.user?.image && <AvatarImage src={session.user.image} alt={name} />}
              <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 rounded-lg px-3 py-2 text-sm">
          <Link href="/profile">
            <Settings className="h-4 w-4" />
            Profile settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut({ redirectTo: "/" })}
          className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 focus:bg-rose-50 focus:text-rose-700"
        >
          <LogOut className="h-4 w-4" />
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
