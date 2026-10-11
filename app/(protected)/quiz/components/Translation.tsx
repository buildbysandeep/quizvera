"use client";

import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Info, Languages } from "lucide-react";

type TranslationSettings = {
  enable: boolean;
  sourceLanguage: string;
  targetLanguage: string;
};

type TranslationProps = {
  translation: TranslationSettings;
  setTranslation: React.Dispatch<React.SetStateAction<TranslationSettings>>;
};

const SOURCE_LANGUAGE_DEFAULT = "en";
const TARGET_LANGUAGE = "hi";

const Translation = ({ translation, setTranslation }: TranslationProps) => {
  const enabled = translation.enable;

  // This product currently supports Hindi as the only target language.
  // Keep existing source-language selections; default new quizzes to English.
  useEffect(() => {
    if (!translation.sourceLanguage || translation.targetLanguage !== TARGET_LANGUAGE) {
      setTranslation((previous) => {
        const sourceLanguage = previous.sourceLanguage || SOURCE_LANGUAGE_DEFAULT;

        if (previous.sourceLanguage === sourceLanguage && previous.targetLanguage === TARGET_LANGUAGE) {
          return previous;
        }

        return {
          ...previous,
          sourceLanguage,
          targetLanguage: TARGET_LANGUAGE,
        };
      });
    }
  }, [translation.sourceLanguage, translation.targetLanguage, setTranslation]);

  const handleToggle = (checked: boolean) => {
    setTranslation((previous) => ({
      ...previous,
      enable: checked,
      sourceLanguage: previous.sourceLanguage || SOURCE_LANGUAGE_DEFAULT,
      targetLanguage: TARGET_LANGUAGE,
    }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors ${
              enabled ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <Languages className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="translation" className="cursor-pointer text-sm font-semibold text-slate-900">
                Quiz translation
              </Label>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {enabled && <CheckCircle2 className="h-3 w-3" />}
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
              Translate quiz questions and answer options into Hindi. Hindi is the only supported target language at the
              moment.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:justify-start">
          <span className="text-xs font-medium text-slate-600 sm:hidden">Translation</span>
          <Switch id="translation" checked={enabled} onCheckedChange={handleToggle} aria-label="Enable Hindi translation" />
        </div>
      </div>

      <div
        className={`border-t px-4 py-3 sm:px-5 ${
          enabled ? "border-violet-100 bg-violet-50/50" : "border-slate-100 bg-slate-50/70"
        }`}
      >
        {enabled ? (
          <div className="flex items-start gap-2.5">
            <Languages className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-violet-950">Hindi translation is enabled</p>
              <p className="mt-1 text-xs leading-5 text-violet-800/80">
                The target language is fixed to Hindi. The source language uses the quiz&apos;s saved setting, or defaults to
                English for new quizzes. Review the translated question titles and options before publishing.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium text-violet-800">
                  Target language: Hindi
                </span>
                <span className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium text-violet-800">
                  Language code: hi
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs leading-5 text-slate-500">
              Participants will see the original quiz content. Enable this setting to use Hindi translations for questions
              and answer options.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Translation;
