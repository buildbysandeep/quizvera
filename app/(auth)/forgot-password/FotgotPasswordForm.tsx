"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findUserByEmailDB, saveResetTokenDB } from "@/lib/actions/user.action";
import { generateResetPasswordToken, success, error } from "@/lib/utils";
import React from "react";
import { forgotPasswordTemplate } from "@/email_templates/forgot_password";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";

const FotgotPasswordForm = () => {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const user = await findUserByEmailDB({ email: email.trim() });
      if (!user.ok) {
        error(user.error || "Unable to process this request.");
        return;
      }

      const { token, hashToken } = generateResetPasswordToken();
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim())}`;
      const template = forgotPasswordTemplate(resetUrl, process.env.SENDER_NAME || "Quizvera");

      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: [{ name: "User", address: email.trim() }],
          subject: "Password Reset",
          body: { html: template },
        }),
      });
      const res = await response.json();
      if (!response.ok || !res?.data?.accepted?.includes(email.trim())) {
        error("Failed to send reset email. Please try again later.");
        return;
      }

      const saved = await saveResetTokenDB({ email: email.trim(), token: hashToken });
      if (!saved.ok) {
        error(saved.error || "Unable to save reset request.");
        return;
      }

      setSent(true);
      success("Reset email sent. Check your inbox.");
    } catch {
      error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="py-2 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <MailCheck className="h-7 w-7" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Check your inbox</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Reset link sent</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We sent password-reset instructions to <span className="font-semibold text-slate-700">{email}</span>.
        </p>
        <Button asChild className="mt-6 h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Link href="/sign-in">
            Back to sign in <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Mail className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Account recovery</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Forgot your password?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter the email address linked to your account and we&apos;ll send you a reset link.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              required
              className="h-11 rounded-xl border-slate-200 pl-10 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!email.trim() || isLoading}
          className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
        >
          {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {isLoading ? (
            "Sending reset link..."
          ) : (
            <>
              Send reset link <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <Link
        href="/sign-in"
        className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </>
  );
};

export default FotgotPasswordForm;
