export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Fonts from "../fonts/outfit";
// @ts-ignore
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";
import DashboardShell from "@/components/shared/DashboardShell";

export const metadata: Metadata = {
  title: "Quizvera",
  description: "Quizvera",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (!session.user.isOnBoarded) redirect("/on-boarding");

  return (
    <html lang="en">
      <body
        className={`${Fonts.Light} ${Fonts.ExtraLight} ${Fonts.Thin} ${Fonts.Medium} ${Fonts.Regular} ${Fonts.SemiBold} ${Fonts.Bold} ${Fonts.ExtraBold} antialiased`}
      >
        <DashboardShell session={session}>{children}</DashboardShell>
        <Toaster />
      </body>
    </html>
  );
}
