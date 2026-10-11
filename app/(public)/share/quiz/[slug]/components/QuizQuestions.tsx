"use client";

import { CodeBlock } from "@/components/shared/CodeBlock";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IParticipantQuizAnswer, IQuestion } from "@/types";
import { CheckCircle2, CircleHelp, ListChecks } from "lucide-react";
import React, { useCallback } from "react";

const QuizQuestions = ({
  translationEnabled,
  questions,
  answers,
  setAnswers,
}: {
  translationEnabled: boolean;
  questions: IQuestion[];
  answers: IParticipantQuizAnswer[];
  setAnswers: React.Dispatch<React.SetStateAction<IParticipantQuizAnswer[]>>;
}) => {
  const clickHandler = useCallback(
    (questionId: string, selectedOption: string) => {
      setAnswers((previous) => {
        const exists = previous.some((answer) => answer.questionId === questionId);
        if (exists) {
          return previous.map((answer) =>
            answer.questionId === questionId ? { ...answer, answer: selectedOption } : answer,
          );
        }
        return [...previous, { questionId, answer: selectedOption }];
      });
    },
    [setAnswers],
  );

  const answeredCount = questions.reduce(
    (count, question) => count + (answers.some((answer) => answer.questionId === question.id) ? 1 : 0),
    0,
  );
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        This quiz does not contain any questions yet. Contact the quiz administrator.
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Quiz questions">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Questions</h2>
              <p className="mt-0.5 text-xs text-slate-500">Choose one answer for each question.</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-sm font-bold tabular-nums text-slate-900">
              {answeredCount}
              <span className="font-medium text-slate-400"> / {questions.length}</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Answered</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>{progress}% complete</span>
          <span>{questions.length - answeredCount} remaining</span>
        </div>
      </div>

      {questions.map((question, index) => {
        const selectedAnswer = answers.find((answer) => answer.questionId === question.id)?.answer ?? "";
        const sortedOptions = [...question.options].sort((a, b) => a.key.localeCompare(b.key));
        const isAnswered = Boolean(selectedAnswer);

        return (
          <article
            key={question.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${isAnswered ? "border-indigo-200" : "border-slate-200"}`}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${isAnswered ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Question {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${isAnswered ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {isAnswered ? <CheckCircle2 className="h-3 w-3" /> : <CircleHelp className="h-3 w-3" />}
                      {isAnswered ? "Answer selected" : "Not answered"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900 sm:text-[15px] sm:leading-7">
                    {question.title}
                  </p>
                  {translationEnabled && question.translatedTitle && (
                    <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-violet-300 pl-3 text-sm leading-6 text-violet-800">
                      {question.translatedTitle}
                    </p>
                  )}
                </div>
              </div>

              {question.showSnippet && question.snippet && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2">
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

              <div className="mt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Select one answer</p>
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={(value) => clickHandler(question.id, value)}
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
                  aria-label={`Answers for question ${index + 1}`}
                >
                  {sortedOptions.map((option) => {
                    const optionId = `question-${question.id}-option-${option.key}`;
                    const isSelected = selectedAnswer === option.key;
                    return (
                      <div
                        key={option.id}
                        className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 transition-colors ${isSelected ? "border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <RadioGroupItem
                          id={optionId}
                          value={option.key}
                          className="mt-0.5 shrink-0 border-slate-400 text-indigo-600"
                        />
                        <label htmlFor={optionId} className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {option.key.toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block whitespace-pre-wrap break-words text-sm leading-5 ${isSelected ? "font-medium text-indigo-950" : "text-slate-700"}`}
                            >
                              {option.value}
                            </span>
                            {translationEnabled && option.translatedValue && (
                              <span className="mt-1.5 block whitespace-pre-wrap break-words text-xs leading-5 text-violet-700">
                                {option.translatedValue}
                              </span>
                            )}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default QuizQuestions;
