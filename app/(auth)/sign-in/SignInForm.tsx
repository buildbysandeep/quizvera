"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { error, success } from "@/lib/utils";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

const fieldClass =
  "h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-500/20";

const SignInForm = () => {
  const searchParams = useSearchParams();
  const signInError = searchParams.get("error");
  const signInEmail = searchParams.get("email");
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl: "/",
      });
      if (!res || res.error) {
        error("Invalid email or password");
        return;
      }
      success("Signed in successfully");
      router.push(res.url || "/");
      router.refresh();
    } catch {
      error("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setGoogleLoading(false);
      error("Google sign-in could not be started.");
    }
  }

  return (
    <>
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Sign in to Quizvera</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter your details to continue to your quiz workspace.</p>
      </div>

      {signInError === "not-registered-with-google" && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900"
        >
          <p className="font-semibold">Google account not registered</p>
          <p className="mt-0.5">
            {signInEmail ? `${signInEmail} is not registered with Google.` : "This email is not registered with Google."}{" "}
            Sign in with your email and password or create an account.
          </p>
        </div>
      )}

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
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || googleLoading}
              required
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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
        </div>

        <Button
          type="submit"
          disabled={!email.trim() || !password || isLoading || googleLoading}
          className="mt-2 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-600/15 hover:bg-indigo-700"
        >
          {isLoading ? (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {isLoading ? (
            "Signing in..."
          ) : (
            <>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-[0.14em]">
          <span className="bg-white px-3 text-slate-400">Or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading || googleLoading}
        onClick={handleGoogleSignIn}
        className="h-11 w-full rounded-xl border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50"
      >
        {googleLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        ) : (
          <FcGoogle className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Create one
        </Link>
      </p>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400">
        <Sparkles className="h-3 w-3 shrink-0" /> Secure access to your assessments and results.
      </p>
    </>
  );
};

export default SignInForm;
