"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { Button } from "@/components/ui/button";
import { error, success } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { ArrowRight, Mail, UserRound, Sparkles } from "lucide-react";

const OnBoardingForm = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState(session.user?.name ?? "");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: session.user?.email }),
      });
      const res = await response.json();
      if (!response.ok || !res.ok) {
        error(res.error || "Unable to save your details.");
        return;
      }
      success(res.message || "Profile completed");
      router.push("/");
      router.refresh();
    } catch {
      error("Unable to save your details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">One last step</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Complete your profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tell us what to call you before you enter your Quizvera workspace.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              name="name"
              placeholder="Your full name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              disabled={isLoading}
              required
              className="h-11 rounded-xl border-slate-200 pl-10 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              value={session.user?.email ?? ""}
              autoComplete="email"
              disabled
              readOnly
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm text-slate-500"
            />
          </div>
          <p className="text-[11px] text-slate-400">Your sign-in email cannot be changed here.</p>
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
        >
          {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {isLoading ? (
            "Saving profile..."
          ) : (
            <>
              Continue to dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
        You can manage your quizzes and results after completing your profile.
      </p>
    </>
  );
};

export default OnBoardingForm;
