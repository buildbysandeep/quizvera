export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Fonts from "../fonts/outfit";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/shared/Header";
import Sidenav from "@/components/shared/Sidenav";
import { SiPlatformdotsh } from "react-icons/si";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";
import { useAuthStore } from "@/stores/auth";
import { AuthProvider } from "../providers";

export const metadata: Metadata = {
  title: "Quiz App",
  description: "Quiz App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session || !session.user) return redirect("/sign-in");
  if (session) useAuthStore.setState({ session });

  return (
    <html lang="en">
      <body
        className={`${Fonts.Light} ${Fonts.ExtraLight} ${Fonts.Thin} ${Fonts.Medium} ${Fonts.Regular}  ${Fonts.SemiBold} ${Fonts.Bold} ${Fonts.ExtraBold} antialiased`}
      >
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <div className="sticky top-0 flex h-full max-h-screen overflow-hidden flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <SiPlatformdotsh className="h-4 w-4" />
                  <span className="">Quiz App*</span>
                </Link>
              </div>
              <Sidenav />
            </div>
          </div>
          <div className="flex flex-col">
            <Header session={session} />
            <main className="flex flex-1 flex-col gap-4 xs:p-2 lg:gap-6 lg:p-4">
              <AuthProvider>{children}</AuthProvider>
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
