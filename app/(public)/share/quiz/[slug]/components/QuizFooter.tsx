import React from "react";
import { ExternalLink } from "lucide-react";

type FooterData = {
  footerHeading1?: string | null;
  footerHeading2?: string | null;
  footerText1?: string | null;
  footerText2?: string | null;
  footerLink?: string | null;
};

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const QuizFooter = ({ data, editable }: { data: FooterData; editable?: boolean }) => {
  const hasContent = Boolean(
    data.footerHeading1 || data.footerHeading2 || data.footerText1 || data.footerText2 || data.footerLink,
  );
  if (!hasContent && !editable) return null;

  return (
    <footer className="mt-8 border-t border-slate-200 pt-6 text-center sm:mt-10 sm:pt-8">
      <div className="mx-auto max-w-2xl space-y-2">
        {(data.footerHeading1 || editable) && (
          <h2 className="break-words text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {data.footerHeading1 || (editable ? "Heading 1" : "")}
          </h2>
        )}
        {(data.footerHeading2 || editable) && (
          <p className="break-words text-sm font-semibold text-slate-700">
            {data.footerHeading2 || (editable ? "Heading 2" : "")}
          </p>
        )}
        {(data.footerText1 || editable) && (
          <p className="break-words text-sm text-slate-500">{data.footerText1 || (editable ? "Text 1" : "")}</p>
        )}
        {(data.footerText2 || editable) && (
          <p className="break-words text-sm text-slate-500">{data.footerText2 || (editable ? "Text 2" : "")}</p>
        )}
        {data.footerLink && (
          <a
            href={normalizeLink(data.footerLink)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
          >
            {data.footerLink}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        )}
        {!data.footerLink && editable && <p className="text-sm text-slate-400">Link</p>}
      </div>
    </footer>
  );
};

export default QuizFooter;
