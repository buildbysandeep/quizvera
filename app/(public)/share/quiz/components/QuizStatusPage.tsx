"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { exitFullScreen } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert, Unlink } from "lucide-react";

type Tone = "success" | "danger" | "warning" | "neutral";

type Props = {
  tone: Tone;
  eyebrow: string;
  title: string;
  description: string;
  detail?: string;
  primaryLabel?: string;
  primaryHref?: string;
};

const toneStyles: Record<Tone, { icon: React.ComponentType<{ className?: string }>; iconWrap: string; accent: string; badge: string }> = {
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    accent: "from-emerald-500 to-teal-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  danger: {
    icon: ShieldAlert,
    iconWrap: "bg-rose-50 text-rose-600 ring-rose-100",
    accent: "from-rose-500 to-orange-500",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-100",
    accent: "from-amber-400 to-orange-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  neutral: {
    icon: Unlink,
    iconWrap: "bg-slate-100 text-slate-600 ring-slate-200",
    accent: "from-slate-500 to-indigo-500",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const QuizStatusPage = ({ tone, eyebrow, title, description, detail, primaryLabel, primaryHref }: Props) => {
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const styles = toneStyles[tone];
  const Icon = styles.icon;

  useEffect(() => {
    const syncFullScreen = () => setIsFullScreen(Boolean(document.fullscreenElement));
    syncFullScreen();
    document.addEventListener("fullscreenchange", syncFullScreen);
    return () => document.removeEventListener("fullscreenchange", syncFullScreen);
  }, []);

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_60px_-28px_rgba(15,23,42,0.24)]">
        <div className={`h-1.5 bg-gradient-to-r ${styles.accent}`} />
        <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ring-1 ${styles.iconWrap}`}>
            <Icon className="h-7 w-7" />
          </div>

          <span className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${styles.badge}`}>
            {eyebrow}
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{description}</p>

          {detail && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-xs leading-5 text-slate-600">{detail}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {isFullScreen && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={async () => {
                  await exitFullScreen();
                  setIsFullScreen(false);
                }}
              >
                Exit full screen
              </Button>
            )}
            {primaryLabel && primaryHref && (
              <Button className="rounded-xl" onClick={() => router.push(primaryHref)}>
                {primaryLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-center">
          <p className="text-[11px] text-slate-400">Quiz assessment · You may close this page now</p>
        </div>
      </section>
    </main>
  );
};

export default QuizStatusPage;
