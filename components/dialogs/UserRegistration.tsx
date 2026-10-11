"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enterFullScreen, error } from "@/lib/utils";
import { IUser } from "@/types";
import { userRegDB } from "@/lib/actions/user.action";

export function UserRegistration({
  visible,
  setUser,
  setAttemptToken,
  quizId,
  quizSlug,
}: {
  visible: boolean;
  quizId: string;
  quizSlug: string;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  setAttemptToken: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanName || !cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanPhone.length !== 10) {
      setFormError("Enter a valid name, email address, and 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    setFormError("");
    try {
      const result = await userRegDB({ name: cleanName, email: cleanEmail, phone: cleanPhone, quizId });
      if (!result.ok) {
        if (result.redirectTo) {
          router.replace(result.redirectTo);
          return;
        }
        setFormError(result.error || "Registration failed.");
        return;
      }
      if (result.isSubmitted) {
        router.replace(`/share/quiz/${quizSlug}/result`);
        return;
      }
      if (result.isDisqualified) {
        router.replace(`/share/quiz/${quizSlug}/disqualified`);
        return;
      }
      if (result.data && result.attemptToken) {
        setUser({
          id: result.data.id,
          name: result.data.name || cleanName,
          email: result.data.email,
          phone: result.data.phone || cleanPhone,
        });
        setAttemptToken(result.attemptToken);
        try {
          await enterFullScreen();
        } catch {
          /* fullscreen may be blocked by the browser */
        }
        setOpen(false);
      }
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          disabled={!visible}
          className="h-11 gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowRight className="h-4 w-4" /> Start quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 p-0 sm:max-w-md">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/70 px-6 py-5">
          <DialogHeader>
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Participant registration</DialogTitle>
            <DialogDescription>Enter your details before starting the assessment.</DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={submitHandler} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="registration-name">Full name</Label>
            <Input
              id="registration-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
              autoComplete="name"
              placeholder="Enter your name"
              disabled={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-email">Email address</Label>
            <Input
              id="registration-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFormError("");
              }}
              autoComplete="email"
              placeholder="name@example.com"
              disabled={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-phone">Phone number</Label>
            <div className="flex overflow-hidden rounded-xl border border-input focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
              <span className="flex items-center border-r bg-slate-50 px-3 text-sm font-medium text-slate-600">+91</span>
              <Input
                id="registration-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, ""));
                  setFormError("");
                }}
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                disabled={isLoading}
                className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-slate-500">{phone.length}/10 digits</p>
          </div>
          {formError ? (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          ) : phone && phone.length !== 10 ? (
            <p role="status" className="text-xs text-rose-600">Enter a valid 10-digit phone number.</p>
          ) : null}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim() || phone.length !== 10}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…
                </>
              ) : (
                "Continue to quiz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
