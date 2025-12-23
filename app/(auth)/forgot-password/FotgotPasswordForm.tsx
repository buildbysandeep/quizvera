"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findUserByEmailDB, saveResetTokenDB } from "@/lib/actions/user.action";
import { generateResetPasswordToken, success } from "@/lib/utils";
import React from "react";
import { CgSpinner } from "react-icons/cg";
import { error } from "@/lib/utils";
import { forgotPasswordTemplate } from "@/email_templates/forgot_password";
import { useRouter } from "next/navigation";

const FotgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const user = await findUserByEmailDB({ email });
      if (!user.ok) {
        return error(user.error!);
      }

      const { token, hashToken } = generateResetPasswordToken();

      const resetUrl = `${
        process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_LOCAL_URL : process.env.NEXT_PUBLIC_APP_URL
      }/reset-password?token=${token}&email=${email}`;
      const template = forgotPasswordTemplate(resetUrl, process.env.SENDER_NAME || "Quiz App");

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: [{ name: "User", address: email }],
          subject: "Password Reset",
          body: { html: template },
        }),
      }).then((res) => res.json());

      if (!res.ok || !res?.data?.accepted.includes(email)) {
        return error("Failed to send reset email. Please try again later.");
      }

      const { ok, error: dbError } = await saveResetTokenDB({ email, token: hashToken });
      if (!ok) {
        return error(dbError!);
      }

      setEmail("");
      success("Email sent successfully! Please check your inbox.");
      router.push("/sign-in");
    } catch (error: any) {
      console.log(error.message);
      error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="flex flex-col space-y-2 text-center py-5">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">Enter your email to reset your password</p>
      </div>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="font-normal" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
            />
          </div>
          <Button disabled={email === "" || isLoading} className="mt-2">
            {isLoading && <CgSpinner className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default FotgotPasswordForm;
