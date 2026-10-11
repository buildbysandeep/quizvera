import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import React from "react";

const StrictMode = ({
  isStrictMode,
  setIsStrictMode,
}: {
  isStrictMode: boolean;
  setIsStrictMode: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <section
      className={`rounded-xl border p-4 transition-colors ${
        isStrictMode ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            isStrictMode ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isStrictMode ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="strict-mode" className="cursor-pointer text-sm font-semibold text-slate-900">
              Strict mode
            </Label>

            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isStrictMode ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isStrictMode ? "Enabled" : "Disabled"}
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            {isStrictMode
              ? "Participants may be disqualified if they leave fullscreen mode or switch tabs."
              : "Participants can leave fullscreen mode and switch tabs without strict-mode disqualification."}
          </p>
        </div>

        <Switch
          id="strict-mode"
          checked={isStrictMode}
          onCheckedChange={setIsStrictMode}
          aria-label="Enable strict mode"
          className="mt-1 shrink-0"
        />
      </div>
    </section>
  );
};

export default StrictMode;
