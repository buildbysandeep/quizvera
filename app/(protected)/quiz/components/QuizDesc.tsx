import { FileText } from "lucide-react";
import React from "react";

const QuizDesc = ({ desc, editable }: { desc: string; editable?: boolean }) => {
  const hasDescription = Boolean(desc?.trim());

  if (!hasDescription && !editable) return null;

  if (!hasDescription) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">No description added</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Add a short explanation so participants know what this quiz covers.
          </p>
        </div>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{desc}</p>;
};

export default QuizDesc;
