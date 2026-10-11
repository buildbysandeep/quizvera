import React from "react";
import { AlignLeft } from "lucide-react";

const QuizDesc = ({ desc }: { desc?: string | null; editable?: boolean }) => {
  if (!desc?.trim()) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <AlignLeft className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-slate-900">About this quiz</h2>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{desc}</p>
    </section>
  );
};

export default QuizDesc;
