import type { Metadata } from "next";
import Fonts from "../fonts/outfit";
import { Toaster } from "@/components/ui/toaster";
// @ts-ignore
import "../globals.css";
import Image from "next/image";
import logo from "@/app/assets/logo-small.png";
import { SiPlatformdotsh } from "react-icons/si";
import { ArrowUpRight, BookOpenCheck, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Quizvera",
    template: "%s | Quizvera",
  },
  description: "Create assessments, share quizzes, and track learner performance with Quizvera.",
};

const features = [
  { icon: BookOpenCheck, title: "Build better assessments", detail: "Create and organize quizzes in one place." },
  { icon: ChartNoAxesCombined, title: "Understand performance", detail: "Turn submissions into useful insights." },
  { icon: ShieldCheck, title: "Keep your workflow simple", detail: "Manage classes, quizzes, and results." },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${Fonts.Light} ${Fonts.ExtraLight} ${Fonts.Thin} ${Fonts.Medium} ${Fonts.Regular} ${Fonts.SemiBold} ${Fonts.Bold} ${Fonts.ExtraBold} antialiased`}
      >
        <main className="min-h-screen bg-slate-50">
          <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            {/* Brand panel */}
            <section className="relative hidden min-h-screen flex-col overflow-hidden bg-slate-950 px-10 py-9 text-white lg:flex xl:px-14">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/95 to-indigo-950/90" />
              <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 flex items-center gap-3">
                {/* <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-lg shadow-black/10">
                  <SiPlatformdotsh className="h-5 w-5" />
                </div> */}
                {/* <span className="text-lg font-semibold tracking-tight">Quizvera</span> */}
                <Image src={logo} width={50} height={50} alt="Quizvera logo" />
                <span className="ml-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-indigo-200">
                  Workspace
                </span>
              </div>

              <div className="relative z-10 my-auto max-w-xl py-16">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Your assessment workspace
                </div>
                <h1 className="max-w-lg text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
                  Make every quiz a <span className="text-indigo-300">clearer learning</span> experience.
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 xl:text-base">
                  Create assessments, share them with learners, and see performance without juggling separate tools.
                </p>

                <div className="mt-9 space-y-3">
                  {features.map(({ icon: Icon, title, detail }) => (
                    <div
                      key={title}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-300/15 bg-indigo-400/10 text-indigo-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-400">{detail}</p>
                      </div>
                      <ArrowUpRight className="ml-auto h-4 w-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-400">
                <span>Assess. Understand. Improve.</span>
                <span>© {new Date().getFullYear()} Quizvera</span>
              </div>
            </section>

            {/* Form panel */}
            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_40%)]" />
              <div className="relative z-10 w-full max-w-[440px]">
                <Link href="/sign-in" className="mx-auto mb-7 flex w-fit items-center gap-2.5 lg:hidden">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                    <SiPlatformdotsh className="h-4 w-4" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-slate-900">Quizvera</span>
                </Link>
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.22)] sm:p-8">
                  {children}
                </div>
                <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
                  Secure access to your Quizvera workspace
                </p>
              </div>
            </section>
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
