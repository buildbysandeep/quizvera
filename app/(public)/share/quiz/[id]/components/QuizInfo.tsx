import React from "react";
import { Clock3, ClipboardCheck, FileQuestion } from "lucide-react";

type QuizInfoProps = {
  duration?: number | null;
  maxMarks?: number | null;
  editable?: boolean;
  totalQuestions?: number;
};

const QuizInfo = ({ duration, maxMarks, totalQuestions }: QuizInfoProps) => {
  const items = [
    { label: "Duration", value: duration && duration > 0 ? `${duration} min` : "No time limit", icon: Clock3 },
    { label: "Maximum marks", value: maxMarks != null ? String(maxMarks) : "—", icon: ClipboardCheck },
    ...(totalQuestions != null ? [{ label: "Questions", value: String(totalQuestions), icon: FileQuestion }] : []),
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">{label}</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900 sm:text-base">{value}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default QuizInfo;
