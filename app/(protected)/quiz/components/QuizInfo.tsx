import { Award, Clock3 } from "lucide-react";
import React from "react";

const QuizInfo = ({ duration, maxMarks, editable }: { duration: number; maxMarks: number; editable?: boolean }) => {
  const isEmpty = !duration && !maxMarks;

  const metrics = [
    {
      label: "Maximum marks",
      value: maxMarks ? String(maxMarks) : "—",
      unit: "marks",
      Icon: Award,
    },
    {
      label: "Time duration",
      value: duration ? String(duration) : "—",
      unit: "minutes",
      Icon: Clock3,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {metrics.map(({ label, value, unit, Icon }) => (
        <div
          key={label}
          className={`flex items-center gap-3 rounded-xl border p-3.5 ${
            editable && isEmpty ? "border-dashed border-slate-200 bg-slate-50/60" : "border-slate-200 bg-white"
          }`}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p
              className={`mt-1 flex flex-wrap items-baseline gap-1.5 text-lg font-bold leading-5 ${
                value === "—" ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {value}
              <span className="text-[11px] font-medium text-slate-400">{unit}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizInfo;
