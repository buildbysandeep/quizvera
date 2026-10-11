"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { error, success } from "@/lib/utils";
import Link from "next/link";
import { verifyAndResetPasswordDB } from "@/lib/actions/user.action";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";

const ResetPasswordForm = ({ searchParams }: { searchParams: { token: string; email: string } }) => {
  const router = useRouter();
  const { token, email } = searchParams;
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || password !== confirmPassword) {
      error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyAndResetPasswordDB({ token, email, password });
      if (!result.ok) {
        error(result.error || "Unable to reset password.");
        return;
      }
      success("Password reset successfully");
      router.push("/sign-in");
    } catch {
      error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="py-2 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Invalid reset link</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This password reset link is missing information or is no longer valid. Request a new one to continue.
        </p>
        <Button asChild className="mt-6 h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Link href="/forgot-password">
            Request a new reset link <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Link
          href="/sign-in"
          className="mx-auto mt-5 flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <KeyRound className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Account security</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Choose a new password for your Quizvera account.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
            New password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              name="password"
              placeholder="Enter new password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
              className="h-11 rounded-xl border-slate-200 pl-10 pr-11 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm new password
          </Label>
          <div className="relative">
            <CheckCircle2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter new password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
              className="h-11 rounded-xl border-slate-200 pl-10 pr-11 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-rose-600">Passwords do not match.</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={!password || !confirmPassword || password !== confirmPassword || isLoading}
          className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
        >
          {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {isLoading ? (
            "Updating password..."
          ) : (
            <>
              Update password <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        After updating your password, you&apos;ll return to sign in.
      </p>
    </>
  );
};

export default ResetPasswordForm;
