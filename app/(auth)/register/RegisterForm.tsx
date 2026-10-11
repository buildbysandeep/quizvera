"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { error, success } from "@/lib/utils";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";

const fieldClass =
  "h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20";

const RegisterForm = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const res = await response.json();
      if (!response.ok || !res.ok) {
        error(res.error || "Unable to create your account.");
        return;
      }
      success(res.message || "Account created successfully");
      window.location.href = "/sign-in";
    } catch {
      error("Unable to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setGoogleLoading(false);
      error("Google sign-up could not be started.");
    }
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <UserPlus className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Get started</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Set up your workspace to start creating and sharing quizzes.</p>
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
              placeholder="Your name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              disabled={isLoading || googleLoading}
              required
              className={fieldClass}
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
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              disabled={isLoading || googleLoading}
              required
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              name="password"
              placeholder="Create a password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isLoading || googleLoading}
              required
              className={`${fieldClass} pr-11`}
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
          <p className="text-[11px] leading-5 text-slate-400">Use a password you do not use on other websites.</p>
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || !email.trim() || !password || isLoading || googleLoading}
          className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-600/15 hover:bg-indigo-700"
        >
          {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {isLoading ? (
            "Creating account..."
          ) : (
            <>
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-[0.14em]">
          <span className="bg-white px-3 text-slate-400">Or sign up with</span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading || googleLoading}
        onClick={handleGoogleSignUp}
        className="h-11 w-full rounded-xl border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50"
      >
        {googleLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        ) : (
          <FcGoogle className="mr-2 h-4 w-4" />
        )}{" "}
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
        By creating an account, you agree to use Quizvera responsibly.
      </p>
    </>
  );
};

export default RegisterForm;
