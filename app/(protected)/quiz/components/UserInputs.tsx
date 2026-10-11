import { ClipboardList } from "lucide-react";
import React from "react";

const UserInputs = ({ inputs, editable }: { inputs: string[]; editable?: boolean }) => {
  const placeholders = Array.from({ length: 5 }, (_, index) => index);

  if (inputs.length === 0 && !editable) return null;

  return (
    <div className="space-y-3">
      {inputs.length === 0 && editable && (
        <div className="mb-1 flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">No participant fields configured</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Add fields such as name, email, or student ID to collect details before the quiz.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {inputs.length > 0
          ? inputs.map((input, index) => (
              <div
                key={`${input}-${index}`}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-700">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-slate-700">{input}</p>
                  <div className="mt-2 border-b border-dashed border-slate-300" />
                </div>
              </div>
            ))
          : editable &&
            placeholders.map((index) => (
              <div
                key={index}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-semibold text-slate-300 ring-1 ring-slate-200">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">Participant field {index + 1}</p>
                  <div className="mt-2 border-b border-dashed border-slate-200" />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default UserInputs;
