"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { error, success } from "@/lib/utils";
import { updateQuestionDB } from "@/lib/actions/quiz.actions";
import { IQuestion, IQuiz } from "@/types";
import { CodeBlock, isSupported } from "../shared/CodeBlock";
import { CheckCircle2, Code2, Languages, Loader2, Pencil, Save } from "lucide-react";

type EditQuestionProps = {
  question: IQuestion;
  data: IQuiz | null;
  setData?: React.Dispatch<React.SetStateAction<IQuiz | null>>;
};

const EditQuestion = ({ question, data, setData }: EditQuestionProps) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState(question.title ?? "");
  const [translatedTitle, setTranslatedTitle] = React.useState(question.translatedTitle ?? "");
  const [showSnippet, setShowSnippet] = React.useState(Boolean(question.showSnippet));
  const [snippet, setSnippet] = React.useState(question.snippet ?? "");
  const [snippetLang, setSnippetLang] = React.useState(question.snippetLang ?? "");
  const [options, setOptions] = React.useState(question.options.map((option) => ({ ...option })));
  const [answer, setAnswer] = React.useState(question.answer ?? "");

  // Refresh the form when this question is opened, including after external updates.
  React.useEffect(() => {
    if (!open) return;

    setTitle(question.title ?? "");
    setTranslatedTitle(question.translatedTitle ?? "");
    setShowSnippet(Boolean(question.showSnippet));
    setSnippet(question.snippet ?? "");
    setSnippetLang(question.snippetLang ?? "");
    setOptions(question.options.map((option) => ({ ...option })));
    setAnswer(question.answer ?? "");
  }, [open, question]);

  const updateOption = (optionIndex: number, field: "value" | "translatedValue", value: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((option, index) => (index === optionIndex ? { ...option, [field]: value } : option)),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      error("Please add the question");
      return;
    }

    if (options.some((option) => !option.value?.trim())) {
      error("Please add all options");
      return;
    }

    if (!answer || !options.some((option) => option.key === answer)) {
      error("Please select a correct answer");
      return;
    }

    if (showSnippet) {
      if (!snippet.trim() || !snippetLang.trim()) {
        error("Please add both the code snippet and its language");
        return;
      }

      if (!isSupported(snippetLang.trim())) {
        error("Please select a supported snippet language");
        return;
      }
    }

    if (data?.translationEnabled && (!translatedTitle.trim() || options.some((option) => !option.translatedValue?.trim()))) {
      error("Please add the translated question and all translated options");
      return;
    }

    setLoading(true);

    try {
      const res = await updateQuestionDB({
        title: title.trim(),
        translatedTitle,
        showSnippet,
        snippet,
        snippetLang: snippetLang.trim(),
        options,
        answer,
        questionId: question.id,
      });

      if (!res.ok) {
        error(res.error || "Unable to update question");
        return;
      }

      setData?.((currentData) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          questions: currentData.questions.map((currentQuestion) =>
            currentQuestion.id === question.id ? (res.data as IQuestion) : currentQuestion,
          ),
        };
      });

      setOpen(false);
      success("Question updated successfully");
    } catch (err) {
      console.error("Failed to update question:", err);
      error("Something went wrong while updating the question");
    } finally {
      setLoading(false);
    }
  };

  const idPrefix = `edit-question-${question.id}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Edit question"
          title="Edit question"
          className="h-8 w-8 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-slate-200 bg-white p-0">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white to-indigo-50/70 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50">
              <Pencil className="h-5 w-5 text-indigo-600" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">Edit question</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
                Update the question, answer options, code snippet, and correct answer.
              </DialogDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Question ID: {question.id.slice(0, 8)}
                </span>
                {data?.translationEnabled && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                    <Languages className="h-3 w-3" />
                    Translation enabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5 sm:px-6">
          {/* Question text */}
          <section className="space-y-3">
            <div>
              <Label htmlFor={`${idPrefix}-title`} className="text-sm font-semibold text-slate-800">
                Question text <span className="text-rose-500">*</span>
              </Label>
              <p className="mt-1 text-xs text-slate-500">
                Write a clear question. Line breaks are preserved in the preview.
              </p>
            </div>

            <Textarea
              id={`${idPrefix}-title`}
              placeholder="Enter your question..."
              rows={3}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="resize-y rounded-xl border-slate-200 text-sm leading-6 focus-visible:ring-indigo-500"
              required
            />

            {data?.translationEnabled && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3.5">
                <Label
                  htmlFor={`${idPrefix}-translated-title`}
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900"
                >
                  <Languages className="h-4 w-4 text-violet-600" />
                  Translated question <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id={`${idPrefix}-translated-title`}
                  placeholder="Enter the translated question..."
                  rows={2}
                  value={translatedTitle}
                  onChange={(event) => setTranslatedTitle(event.target.value)}
                  className="resize-y rounded-lg border-violet-200 bg-white text-sm leading-6 focus-visible:ring-violet-500"
                  required
                />
              </div>
            )}
          </section>

          {/* Code snippet */}
          <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                  <Code2 className="h-4 w-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Code snippet</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Optional code displayed with this question.</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Label htmlFor={`${idPrefix}-show-snippet`} className="text-xs font-medium text-slate-600">
                  {showSnippet ? "Enabled" : "Disabled"}
                </Label>
                <Switch id={`${idPrefix}-show-snippet`} checked={showSnippet} onCheckedChange={setShowSnippet} />
              </div>
            </div>

            {showSnippet && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-snippet-language`} className="text-xs font-semibold text-slate-700">
                    Programming language
                  </Label>
                  <Input
                    id={`${idPrefix}-snippet-language`}
                    placeholder="e.g. python, javascript, typescript"
                    value={snippetLang}
                    onChange={(event) => setSnippetLang(event.target.value.toLowerCase())}
                    className="rounded-lg border-slate-200"
                  />
                  <p className="text-[11px] text-slate-500">Use a language supported by your code highlighter.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-snippet`} className="text-xs font-semibold text-slate-700">
                    Code
                  </Label>
                  <Textarea
                    id={`${idPrefix}-snippet`}
                    placeholder={'def example():\n    return "Hello, world!"'}
                    rows={6}
                    value={snippet}
                    onChange={(event) => setSnippet(event.target.value)}
                    className="min-h-32 resize-y rounded-lg border-slate-200 font-mono text-xs leading-5 focus-visible:ring-indigo-500"
                  />
                </div>

                {snippet.trim() && isSupported(snippetLang.trim()) && (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Preview</span>
                      <span className="text-[10px] text-slate-400">{snippetLang}</span>
                    </div>
                    <div className="overflow-x-auto p-1">
                      <CodeBlock lang={snippetLang}>{snippet}</CodeBlock>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Answer options */}
          <section className="space-y-3">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Answer options <span className="text-rose-500">*</span>
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Select the correct answer below. All options must have text.
                </p>
              </div>
              <span className="text-xs text-slate-500">{options.length} options</span>
            </div>

            <RadioGroup value={answer} onValueChange={setAnswer} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {options.map((option, index) => {
                const optionId = `${idPrefix}-answer-${option.key}`;
                const valueId = `${idPrefix}-option-value-${index}`;
                const translationId = `${idPrefix}-option-translation-${index}`;
                const isCorrect = answer === option.key;

                return (
                  <div
                    key={option.id || option.key}
                    className={`min-w-0 rounded-xl border p-3.5 transition-colors ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-100"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <RadioGroupItem
                          value={option.key}
                          id={optionId}
                          aria-label={`Set option ${option.key} as correct answer`}
                        />
                        <Label
                          htmlFor={optionId}
                          className={`cursor-pointer text-xs font-bold uppercase tracking-wide ${
                            isCorrect ? "text-emerald-800" : "text-slate-600"
                          }`}
                        >
                          Option {String(option.key).toUpperCase()}
                        </Label>
                      </div>

                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Correct answer
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={valueId} className="sr-only">
                        Option {option.key} text
                      </Label>
                      <Input
                        id={valueId}
                        placeholder={`Enter option ${option.key}...`}
                        value={option.value}
                        onChange={(event) => updateOption(index, "value", event.target.value)}
                        className="rounded-lg border-slate-200 bg-white text-sm"
                        required
                      />

                      {data?.translationEnabled && (
                        <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-2">
                          <Label htmlFor={translationId} className="sr-only">
                            Translated option {option.key}
                          </Label>
                          <Input
                            id={translationId}
                            placeholder={`Translated option ${option.key}...`}
                            value={option.translatedValue ?? ""}
                            onChange={(event) => updateOption(index, "translatedValue", event.target.value)}
                            className="rounded-md border-violet-200 bg-white text-sm"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </section>

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg">
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                !title.trim() ||
                options.length === 0 ||
                options.some((option) => !option.value?.trim()) ||
                !answer ||
                (showSnippet && (!snippet.trim() || !snippetLang.trim() || !isSupported(snippetLang.trim()))) ||
                (Boolean(data?.translationEnabled) &&
                  (!translatedTitle.trim() || options.some((option) => !option.translatedValue?.trim())))
              }
              className="gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 sm:min-w-36"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? "Saving changes..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestion;
