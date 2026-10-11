"use client";

import React from "react";
import { CheckCircle2, Code2, Languages, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { error, success } from "@/lib/utils";
import { addQuestionDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";
import { isSupported } from "@/components/shared/CodeBlock";
import { CodeBlock } from "@/components/shared/CodeBlock";

type QuestionOptionDraft = { key: string; value: string; translatedValue: string };
type AddQuestionProps = {
  quizId: string;
  data: IQuiz | null;
  setData: React.Dispatch<React.SetStateAction<IQuiz | null>>;
  translate: { enable: boolean; source?: string; target?: string };
};

const createEmptyOptions = (): QuestionOptionDraft[] => [
  { key: "a", value: "", translatedValue: "" },
  { key: "b", value: "", translatedValue: "" },
  { key: "c", value: "", translatedValue: "" },
  { key: "d", value: "", translatedValue: "" },
];

const stripOptionPrefix = (line: string) => line
  .replace(/^\s*(?:[-*]\s*)?(?:\([a-d1-4]\)|\[[a-d1-4]\]|[a-d][).:]|[1-4][).])\s*/i, "")
  .trim();

const AddQuestion = ({ quizId, data, setData, translate }: AddQuestionProps) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [translatedTitle, setTranslatedTitle] = React.useState("");
  const [showSnippet, setShowSnippet] = React.useState(false);
  const [snippet, setSnippet] = React.useState("");
  const [snippetLang, setSnippetLang] = React.useState("");
  const [translateLoading, setTranslateLoading] = React.useState(false);
  const [options, setOptions] = React.useState<QuestionOptionDraft[]>(createEmptyOptions);
  const [answer, setAnswer] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const translationEnabled = Boolean(data?.translationEnabled || translate.enable);

  const resetForm = () => {
    setTitle("");
    setTranslatedTitle("");
    setShowSnippet(false);
    setSnippet("");
    setSnippetLang("");
    setOptions(createEmptyOptions());
    setAnswer("");
    setFormError("");
    setTranslateLoading(false);
  };

  const handleOptionsPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    const lines = pasted.split(/\r?\n/).map(stripOptionPrefix).filter(Boolean);
    if (lines.length !== 4) return;
    event.preventDefault();
    setOptions((previous) => previous.map((option, index) => ({ ...option, value: lines[index], translatedValue: "" })));
  };

  const handleQuestionPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const lines = event.clipboardData.getData("text").split(/\r?\n/).map(stripOptionPrefix).filter(Boolean);
    if (lines.length !== 5 && lines.length !== 6) return;
    const parsedAnswer = lines.length === 6 ? lines[5].match(/(?:answer\s*[:=-]?\s*)?[\[(]?([a-d1-4])[\])\s.]?$/i)?.[1]?.toLowerCase() : undefined;
    if (lines.length === 6 && !parsedAnswer) return;
    event.preventDefault();
    setTitle(lines[0]);
    setOptions((previous) => previous.map((option, index) => ({ ...option, value: lines[index + 1], translatedValue: "" })));
    if (parsedAnswer) setAnswer(/[1-4]/.test(parsedAnswer) ? String.fromCharCode(96 + Number(parsedAnswer)) : parsedAnswer);
    setTranslatedTitle("");
  };

  const handleTranslate = async () => {
    if (!title.trim() || options.some((option) => !option.value.trim())) {
      error("Enter the question and all four options before translating.");
      return;
    }
    setTranslateLoading(true);
    setFormError("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, question: title, o1: options[0].value, o2: options[1].value, o3: options[2].value, o4: options[3].value }),
      });
      const result = await response.json();
      if (!response.ok || !result?.question || !Array.isArray(result.options)) throw new Error(result?.error || "Translation failed");
      setTranslatedTitle(result.question);
      setOptions((previous) => previous.map((option) => ({
        ...option,
        translatedValue: result.options.find((item: { key: string; value: string }) => item.key.toLowerCase() === option.key)?.value ?? option.translatedValue,
      })));
      success("Hindi translation generated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      setFormError(message);
      error(message);
    } finally {
      setTranslateLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!title.trim()) return setFormError("Enter the question.");
    if (options.some((option) => !option.value.trim())) return setFormError("Fill in all four answer options.");
    if (!answer) return setFormError("Select the correct answer.");
    if (showSnippet && (!snippet.trim() || !snippetLang.trim())) return setFormError("Enter both the code snippet and its language.");
    if (showSnippet && !isSupported(snippetLang.trim().toLowerCase())) return setFormError("Select a supported code language.");
    if (translationEnabled && (!translatedTitle.trim() || options.some((option) => !option.translatedValue.trim()))) return setFormError("Complete the Hindi translation or use Translate to generate it.");

    setLoading(true);
    setFormError("");
    try {
      const result = await addQuestionDB({
        title: title.trim(),
        translatedTitle: translationEnabled ? translatedTitle.trim() : "",
        showSnippet,
        snippet: showSnippet ? snippet : "",
        snippetLang: showSnippet ? snippetLang.trim().toLowerCase() : "",
        options: options.map((option) => ({ ...option, value: option.value.trim(), translatedValue: translationEnabled ? option.translatedValue.trim() : "" })),
        answer,
        quizId,
      });
      if (!result.ok) { setFormError(result.error || "Unable to add question."); error(result.error || "Unable to add question."); return; }
      setData((current) => current ? { ...current, questions: [...current.questions, result.data] } : current);
      success("Question added successfully");
      setOpen(false);
      resetForm();
    } catch {
      setFormError("A network error occurred. Please try again.");
      error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (loading || translateLoading) return; setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="h-9 gap-2 rounded-xl bg-indigo-600 px-3 text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add question</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-slate-200 p-0 sm:max-w-3xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/70 px-5 py-5 sm:px-6">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm"><Plus className="h-5 w-5" /></div>
            <DialogTitle className="text-lg font-bold text-slate-900">Add a question</DialogTitle>
            <DialogDescription>Create an answer-choice question. Paste a question followed by four options to fill the form quickly.</DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5 sm:px-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3"><Label htmlFor="new-question-title" className="text-sm font-semibold">Question text</Label><span className="text-[11px] text-slate-400">Required</span></div>
            <Textarea id="new-question-title" value={title} onChange={(event) => { setTitle(event.target.value); setFormError(""); }} onPaste={handleQuestionPaste} placeholder="Type your question here…" rows={3} disabled={loading} className="min-h-24 resize-y rounded-xl border-slate-200" />
            {translationEnabled && <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3"><Label htmlFor="new-question-hi" className="flex items-center gap-2 text-sm font-semibold text-violet-900"><Languages className="h-4 w-4" /> Hindi translation</Label><Textarea id="new-question-hi" value={translatedTitle} onChange={(event) => setTranslatedTitle(event.target.value)} rows={2} placeholder="प्रश्न का हिंदी अनुवाद" disabled={loading} className="resize-y rounded-lg border-violet-200 bg-white" /></div>}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">Answer options</h3><p className="mt-1 text-xs text-slate-500">Select which option is correct below.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">4 options</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {options.map((option, index) => {
                const isAnswer = answer === option.key;
                return <div key={option.key} className={`rounded-xl border p-3 transition-colors ${isAnswer ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"}`}>
                  <div className="mb-2 flex items-center justify-between"><Label htmlFor={`new-option-${option.key}`} className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600"><span className={`grid h-6 w-6 place-items-center rounded-md text-[11px] ${isAnswer ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{option.key.toUpperCase()}</span>Option {index + 1}</Label>{isAnswer && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>}</div>
                  <Input id={`new-option-${option.key}`} value={option.value} onChange={(event) => setOptions((previous) => previous.map((item) => item.key === option.key ? { ...item, value: event.target.value } : item))} onPaste={index === 0 ? handleOptionsPaste : undefined} placeholder={index === 0 ? "Enter option (or paste all four)" : `Enter option ${index + 1}`} disabled={loading} className="h-10 rounded-lg border-slate-200" />
                  {translationEnabled && <Input aria-label={`Hindi translation for option ${option.key}`} value={option.translatedValue} onChange={(event) => setOptions((previous) => previous.map((item) => item.key === option.key ? { ...item, translatedValue: event.target.value } : item))} placeholder="हिंदी अनुवाद" disabled={loading} className="mt-2 h-9 rounded-lg border-violet-200 bg-violet-50/30 text-sm" />}
                </div>;
              })}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div><h3 className="text-sm font-semibold text-slate-900">Correct answer</h3><p className="mt-1 text-xs text-slate-500">Choose the right option.</p></div>
            <RadioGroup value={answer} onValueChange={setAnswer} className="grid grid-cols-4 gap-2">
              {options.map((option) => <Label key={option.key} htmlFor={`correct-${option.key}`} className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${answer === option.key ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"}`}><RadioGroupItem id={`correct-${option.key}`} value={option.key} />({option.key})</Label>)}
            </RadioGroup>
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Code2 className="h-4 w-4" /></div><div><Label htmlFor="add-code-snippet" className="text-sm font-semibold text-slate-900">Code snippet</Label><p className="mt-1 text-xs text-slate-500">Optional. Add a code example to the question.</p></div></div><Switch id="add-code-snippet" checked={showSnippet} onCheckedChange={setShowSnippet} disabled={loading} /></div>
            {showSnippet && <div className="space-y-3 border-t border-slate-100 pt-3"><div className="space-y-2"><Label htmlFor="new-snippet-language">Language</Label><Input id="new-snippet-language" value={snippetLang} onChange={(event) => setSnippetLang(event.target.value.toLowerCase())} placeholder="python, javascript, typescript…" disabled={loading} className="rounded-xl" /></div><div className="space-y-2"><Label htmlFor="new-snippet">Code</Label><Textarea id="new-snippet" value={snippet} onChange={(event) => setSnippet(event.target.value)} placeholder="Paste your code snippet…" rows={5} disabled={loading} className="resize-y rounded-xl font-mono text-sm" /></div>{snippet.trim() && <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400"><span>Preview</span><span>{snippetLang || "plaintext"}</span></div><div className="overflow-x-auto p-2"><CodeBlock lang={snippetLang || "plaintext"}>{snippet}</CodeBlock></div></div>}</div>}
          </section>

          {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}
          <DialogFooter className="flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between sm:gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={loading || translateLoading} className="rounded-xl"><Trash2 className="mr-2 h-4 w-4" /> Clear form</Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {translationEnabled && <Button type="button" variant="outline" onClick={handleTranslate} disabled={translateLoading || loading || !title.trim() || options.some((option) => !option.value.trim())} className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50">{translateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Translate to Hindi</Button>}
              <Button type="submit" disabled={loading || translateLoading || !title.trim() || options.some((option) => !option.value.trim()) || !answer || (showSnippet && (!snippet.trim() || !snippetLang.trim())) || (translationEnabled && (!translatedTitle.trim() || options.some((option) => !option.translatedValue.trim())))} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="mr-2 h-4 w-4" /> Add question</>}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestion;
