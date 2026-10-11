import Link from "next/link";
import { ExternalLink, Globe2, Mail, MapPin } from "lucide-react";
import React from "react";

type QuizFooterData = {
  footerHeading1: string;
  footerHeading2: string;
  footerText1: string;
  footerText2: string;
  footerLink: string;
};

const QuizFooter = ({ data, editable }: { data: QuizFooterData; editable?: boolean }) => {
  const items = [
    { key: "heading1", value: data.footerHeading1, placeholder: "Heading 1" },
    { key: "heading2", value: data.footerHeading2, placeholder: "Heading 2" },
    { key: "text1", value: data.footerText1, placeholder: "Text 1" },
    { key: "text2", value: data.footerText2, placeholder: "Text 2" },
    { key: "link", value: data.footerLink, placeholder: "Website or link" },
  ];
  const hasContent = items.some((item) => Boolean(item.value?.trim()));

  if (!hasContent && !editable) return null;

  const renderText = (value: string, placeholder: string, className: string) =>
    value?.trim() ? (
      <span className={className}>{value}</span>
    ) : editable ? (
      <span className={`${className} rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-slate-400`}>
        {placeholder}
      </span>
    ) : null;

  return (
    <footer className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-300" />
      <div className="flex flex-col items-center gap-3 px-5 py-7 text-center sm:px-8">
        {renderText(
          data.footerHeading1,
          "Heading 1",
          "max-w-full break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl",
        )}

        {renderText(
          data.footerHeading2,
          "Heading 2",
          "max-w-full break-words text-base font-semibold text-slate-700 sm:text-lg",
        )}

        {(data.footerText1?.trim() || editable) && (
          <div className="flex max-w-full items-center justify-center gap-2 text-sm text-slate-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {renderText(data.footerText1, "Text 1", "break-words")}
          </div>
        )}

        {(data.footerText2?.trim() || editable) && (
          <div className="flex max-w-full items-center justify-center gap-2 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {renderText(data.footerText2, "Text 2", "break-words")}
          </div>
        )}

        {data.footerLink?.trim() ? (
          <Link
            href={data.footerLink}
            className="mt-1 inline-flex max-w-full items-center gap-2 break-all rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-100"
          >
            <Globe2 className="h-4 w-4 shrink-0" />
            <span>{data.footerLink}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
        ) : (
          editable && (
            <span className="mt-1 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-400">
              <Globe2 className="h-4 w-4" />
              Website or link
            </span>
          )
        )}
      </div>
    </footer>
  );
};

export default QuizFooter;
