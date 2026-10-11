"use client";

import DeleteQuestion from "@/components/dialogs/DeleteQuestion";
import EditQuestion from "@/components/dialogs/EditQuestion";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { IQuestion, IQuiz } from "@/types";
import { CheckCircle2, Code2, FileQuestion, Languages, ListChecks } from "lucide-react";
import React from "react";

type QuizQuestionsProps = {
  questions: IQuestion[];
  data: IQuiz | null;
  setData?: React.Dispatch<React.SetStateAction<IQuiz | null>>;
};

const QuizQuestions = ({ questions, data, setData }: QuizQuestionsProps) => {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-14 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <FileQuestion className="h-6 w-6 text-indigo-600" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">Your question bank is empty</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
          Add your first question to start building this assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question list summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white">
            <ListChecks className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">All questions</p>
            <p className="mt-0.5 text-xs text-slate-500">Review question content and answer keys</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
            <FileQuestion className="h-3.5 w-3.5" />
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </span>

          {data?.translationEnabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
              <Languages className="h-3.5 w-3.5" />
              Translations enabled
            </span>
          )}
        </div>
      </div>

      {/* Question cards */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          // Sort a copy so render does not mutate question.options.
          const sortedOptions = [...question.options].sort((a, b) => a.key.localeCompare(b.key));
          const correctOption = sortedOptions.find((option) => option.key === question.answer);

          return (
            <article
              key={question.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              {/* Question header */}
              <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Question {index + 1}
                    </span>
                    {question.showSnippet && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                        <Code2 className="h-3 w-3" />
                        Code question
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900 sm:text-[15px] sm:leading-7">
                    {question.title}
                  </p>
                </div>

                {/* Existing edit/delete components remain functional. */}
                <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-70 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-indigo-200 hover:bg-indigo-50 [&_button]:h-8 [&_button]:w-8 [&_button]:p-0">
                    <EditQuestion question={question} data={data} setData={setData} />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-rose-200 hover:bg-rose-50 [&_button]:h-8 [&_button]:w-8 [&_button]:p-0">
                    <DeleteQuestion questionId={question.id} data={data} setData={setData} />
                  </div>
                </div>
              </div>

              {/* Question body */}
              <div className="space-y-5 p-4 sm:p-5">
                {/* Optional code snippet */}
                {question.showSnippet && question.snippet && (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        <span className="h-2 w-2 rounded-full bg-rose-400" />
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {question.snippetLang || "plaintext"}
                      </span>
                    </div>
                    <div className="overflow-x-auto p-1">
                      <CodeBlock lang={question.snippetLang || "plaintext"}>{question.snippet}</CodeBlock>
                    </div>
                  </div>
                )}

                {/* Answer options */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Answer options</h3>
                    <span className="text-[11px] font-medium text-slate-400">{sortedOptions.length} options</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {sortedOptions.map((option) => {
                      const isCorrect = option.key === question.answer;

                      return (
                        <div
                          key={option.id}
                          className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 transition-colors ${
                            isCorrect
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                              isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {String(option.key).toUpperCase()}
                          </span>

                          <div className="min-w-0 flex-1 pt-1">
                            <p
                              className={`whitespace-pre-wrap break-words text-sm leading-5 ${
                                isCorrect ? "font-medium text-emerald-950" : "text-slate-700"
                              }`}
                            >
                              {option.value}
                            </p>
                            {isCorrect && (
                              <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Correct answer
                              </span>
                            )}
                          </div>

                          {isCorrect && (
                            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-label="Correct answer" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Answer key */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700/80">Answer key</p>
                      <p className="mt-0.5 break-words text-sm font-bold text-emerald-900">
                        Option {String(question.answer).toUpperCase()}
                        {correctOption ? ` · ${correctOption.value}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    Correct answer
                  </span>
                </div>

                {/* Translated content */}
                {data?.translationEnabled && (
                  <section className="overflow-hidden rounded-xl border border-violet-200/80 bg-violet-50/40">
                    <div className="flex items-center gap-2 border-b border-violet-200/70 bg-violet-50 px-4 py-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg border border-violet-200 bg-white">
                        <Languages className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-violet-950">Translated content</h3>
                        <p className="mt-0.5 text-[10px] text-violet-700">Translation preview</p>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-800">
                        {question.translatedTitle || (
                          <span className="italic text-slate-400">No translated question available.</span>
                        )}
                      </p>

                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        {sortedOptions.map((option) => {
                          const isCorrect = option.key === question.answer;

                          return (
                            <div
                              key={`translated-${option.id}`}
                              className={`flex min-w-0 items-start gap-2.5 rounded-lg border p-3 ${
                                isCorrect ? "border-emerald-200 bg-emerald-50/80" : "border-violet-100 bg-white/80"
                              }`}
                            >
                              <span
                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-violet-100 text-violet-700"
                                }`}
                              >
                                {String(option.key).toUpperCase()}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-700">
                                  {option.translatedValue || "—"}
                                </p>
                                {isCorrect && (
                                  <p className="mt-1.5 text-[10px] font-semibold text-emerald-700">Correct answer</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* List footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
        <p className="text-xs text-slate-500">
          Showing all {questions.length} {questions.length === 1 ? "question" : "questions"}
        </p>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Answer keys are highlighted in green
        </p>
      </div>
    </div>
  );
};

export default QuizQuestions;
