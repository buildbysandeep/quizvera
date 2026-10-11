import React from "react";
import { Button } from "@/components/ui/button";
import AddQuizInputDialog from "@/components/dialogs/AddQuizInput";
import { ClipboardList, Trash2, UserRound } from "lucide-react";

const AddQuizInput = ({
  inputs,
  setInputs,
}: {
  inputs: string[];
  setInputs: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  return (
    <div className="space-y-4">
      {/* Compact summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-slate-800">Configured fields</p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {inputs.length} {inputs.length === 1 ? "field" : "fields"}
        </span>
      </div>

      {/* Fields list */}
      {inputs.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <UserRound className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">No participant fields yet</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
            Add fields such as name, email, or phone number to collect details before the quiz starts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {inputs.map((input, index) => (
            <div
              key={`${input}-${index}`}
              className="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="break-words text-sm font-medium text-slate-800">{input}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-px flex-1 border-b border-dashed border-slate-300" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Response</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${input}`}
                title={`Remove ${input}`}
                className="h-8 w-8 shrink-0 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                onClick={() => setInputs((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add field action */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">These fields are collected from participants before they begin.</p>
        <div className="shrink-0">
          <AddQuizInputDialog addInput={setInputs} />
        </div>
      </div>
    </div>
  );
};

export default AddQuizInput;
