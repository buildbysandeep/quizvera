import { Input } from "@/components/ui/input";
import { IUser } from "@/types";
import React from "react";
import { ClipboardList, UserRound } from "lucide-react";

const UserInputs = ({
  inputs,
  user,
  setQuizInputs,
}: {
  inputs: string[];
  user: IUser | null;
  setQuizInputs: React.Dispatch<React.SetStateAction<{ key: string; value: string }[]>>;
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          {user ? <UserRound className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Participant information</h2>
          <p className="mt-0.5 text-xs text-slate-500">Check your details and complete the required fields.</p>
        </div>
      </div>

      {user && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["Name", "Email", "Phone"] as const).map((field) => {
            const value = user[field.toLowerCase() as keyof IUser];
            if (!value) return null;
            return (
              <div key={field} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{field}</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800" title={String(value)}>
                  {String(value)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {inputs.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {inputs.map((input) => (
            <div key={input} className="grid gap-1.5">
              <label htmlFor={`quiz-input-${input}`} className="text-xs font-semibold text-slate-700">
                {input}
              </label>
              <Input
                id={`quiz-input-${input}`}
                name={input}
                placeholder={`Enter ${input.toLowerCase()}`}
                className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-indigo-500"
                onChange={(event) => {
                  const value = event.target.value;
                  setQuizInputs((previous) => {
                    const existing = previous.findIndex((item) => item.key === input);
                    if (existing >= 0) {
                      return previous.map((item, index) => (index === existing ? { ...item, value } : item));
                    }
                    return [...previous, { key: input, value }];
                  });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UserInputs;
