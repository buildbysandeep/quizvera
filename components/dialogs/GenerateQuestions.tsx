"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { addQuestionDB } from "@/lib/actions/quiz.actions";
import { error, success } from "@/lib/utils";
import { CheckCircle2, CircleHelp, Loader2, Sparkles, Trash2 } from "lucide-react";

type GeneratedOption = { id?: string; key: string; value: string; translatedValue?: string };
type GeneratedQuestion = {
  id?: string;
  title: string;
  translatedTitle?: string;
  snippet?: string;
  snippetLang?: string;
  answer: string;
  options: GeneratedOption[];
};

type GenerateQuestionsProps = { quizId: string; isTranslationEnabled: boolean };

const GenerateQuestions = ({ quizId, isTranslationEnabled }: GenerateQuestionsProps) => {
  const [open, setOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [numQuestions, setNumQuestions] = React.useState(5);
  const [quizData, setQuizData] = React.useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [generated, setGenerated] = React.useState(false);

  const resetForm = () => {
    setTopic("");
    setDifficulty("");
    setNumQuestions(5);
    setQuizData([]);
    setFormError("");
    setGenerated(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setFormError("Enter a topic.");
      return;
    }
    if (!difficulty) {
      setFormError("Select a difficulty level.");
      return;
    }
    // if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 20) {
    //   setFormError("Choose between 1 and 20 questions.");
    //   return;
    // }
    setIsGenerating(true);
    setFormError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, topic: topic.trim(), difficulty, numQuestions, isTranslationEnabled }),
      });
      const result = await response.json();
      if (!response.ok || result?.error || !Array.isArray(result?.questions))
        throw new Error(result?.error || "Failed to generate questions.");
      const validQuestions = (result.questions as GeneratedQuestion[]).filter(
        (question) => question.title && Array.isArray(question.options) && question.options.length === 4 && question.answer,
      );
      if (!validQuestions.length) throw new Error("No valid questions were returned. Try another topic.");
      setQuizData(validQuestions);
      setGenerated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(message);
      error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAllQuestions = async () => {
    if (!quizData.length || isAdding) return;
    setIsAdding(true);
    setFormError("");
    let added = 0;
    const failedQuestions: GeneratedQuestion[] = [];
    try {
      for (let index = 0; index < quizData.length; index += 1) {
        const question = quizData[index];
        try {
          const result = await addQuestionDB({
            title: question.title,
            translatedTitle: question.translatedTitle || "",
            showSnippet: Boolean(question.snippet),
            snippet: question.snippet || "",
            snippetLang: question.snippetLang || "",
            options: question.options.map((option) => ({
              key: option.key,
              value: option.value,
              translatedValue: option.translatedValue || "",
            })),
            answer: question.answer.toLowerCase(),
            quizId,
          });
          if (!result.ok) failedQuestions.push(question);
          else added += 1;
        } catch {
          failedQuestions.push(question);
        }
      }
      if (added > 0) success(`${added} question${added === 1 ? "" : "s"} added successfully`);
      if (failedQuestions.length) {
        setQuizData(failedQuestions);
        const message = `${failedQuestions.length} question${failedQuestions.length === 1 ? "" : "s"} could not be added. The failed drafts remain here so you can retry.`;
        setFormError(message);
        error(message);
      } else if (added > 0) {
        setOpen(false);
        // Existing page refreshes quiz data after successful batch creation.
        window.location.reload();
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isGenerating || isAdding) return;
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 gap-2 rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        >
          <Sparkles className="h-4 w-4" /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 p-0 sm:max-w-3xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/70 px-5 py-5 sm:px-6">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Generate quiz questions</DialogTitle>
            <DialogDescription>
              Generate a draft, review each question, then add the questions you want to your quiz.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="generate-topic">Topic</Label>
              <Input
                id="generate-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Python generators, React hooks, HTML forms"
                disabled={isGenerating || isAdding}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generate-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isGenerating || isAdding}>
                <SelectTrigger id="generate-difficulty" className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generate-count">Number of questions</Label>
              <Input
                id="generate-count"
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(event) => setNumQuestions(Number(event.target.value))}
                disabled={isGenerating || isAdding}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {!generated ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <CircleHelp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Questions are generated as drafts</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Review wording, options, translations, and answer keys before adding them.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isAdding}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate questions
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{quizData.length} questions generated</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Review the drafts below before adding them.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || isAdding}
                  className="rounded-xl border-emerald-200 bg-white"
                >
                  Regenerate
                </Button>
                <Button
                  type="button"
                  onClick={handleAddAllQuestions}
                  disabled={isAdding || isGenerating || quizData.length === 0}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                    </>
                  ) : (
                    `Add ${quizData.length} questions`
                  )}
                </Button>
              </div>
            </div>
          )}

          {formError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </p>
          )}

          {quizData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">Generated drafts</h3>
                <span className="text-xs text-slate-500">{quizData.length} total</span>
              </div>
              <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
                {quizData.map((question, index) => (
                  <article
                    key={question.id || `${question.title}-${index}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-start gap-3 border-b border-slate-100 p-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-900">
                          {question.title}
                        </p>
                        {isTranslationEnabled && question.translatedTitle && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-violet-800">
                            {question.translatedTitle}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove generated question ${index + 1}`}
                        disabled={isAdding}
                        onClick={() => setQuizData((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                        className="h-8 w-8 shrink-0 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3 p-4">
                      {question.snippet && (
                        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                          <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400">
                            {question.snippetLang || "plaintext"}
                          </div>
                          <div className="overflow-x-auto p-2">
                            <CodeBlock lang={question.snippetLang || "plaintext"}>{question.snippet}</CodeBlock>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[...question.options]
                          .sort((a, b) => a.key.localeCompare(b.key))
                          .map((option) => {
                            const correct = option.key.toLowerCase() === question.answer.toLowerCase();
                            return (
                              <div
                                key={`${index}-${option.key}`}
                                className={`flex items-start gap-2 rounded-lg border p-3 ${correct ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50/60"}`}
                              >
                                <span
                                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold ${correct ? "bg-emerald-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
                                >
                                  {option.key.toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-xs leading-5 text-slate-700">{option.value}</p>
                                  {isTranslationEnabled && option.translatedValue && (
                                    <p className="mt-1 break-words text-xs leading-5 text-violet-800">
                                      {option.translatedValue}
                                    </p>
                                  )}
                                </div>
                                {correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                              </div>
                            );
                          })}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" /> Correct answer: {question.answer.toUpperCase()}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isGenerating || isAdding}
              className="rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateQuestions;
