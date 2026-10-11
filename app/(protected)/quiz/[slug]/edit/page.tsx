"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  Languages,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ImageUplaod from "@/app/(protected)/quiz/components/ImageUplaod";
import AddQuizInput from "@/app/(protected)/quiz/components/AddQuizInput";
import { error, success, uploadImageAPI } from "@/lib/utils";
import { getQuizBySlugDB, updateQuizDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";
import Loading from "@/components/shared/Loading";
import StrictMode from "@/app/(protected)/quiz/components/StrictMode";
import Translation from "@/app/(protected)/quiz/components/Translation";

type QuizImage = {
  key: string;
  publicId?: string;
  file?: File;
  url: string;
};

type PageProps = {
  params: { slug: string };
};

const EditQuizPage = ({ params }: PageProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<IQuiz | null>(null);
  const [images, setImages] = useState<QuizImage[]>([]);
  const [quizName, setQuizName] = useState("");
  const [inputs, setInputs] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState("");
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [translation, setTranslation] = useState({
    enable: false,
    sourceLanguage: "",
    targetLanguage: "",
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!params.slug) {
        router.replace("/");
        return;
      }

      setIsLoading(true);

      try {
        const res = await getQuizBySlugDB({ slug: params.slug });
        if (cancelled) return;

        if (!res.ok || !res.data) {
          setIsLoading(false);
          error(res.error || "Unable to load this quiz");
          router.replace("/");
          return;
        }

        const quiz = res.data as IQuiz & { legacyRedirectSlug?: string };
        if (quiz.legacyRedirectSlug) {
          router.replace(`/quiz/${quiz.legacyRedirectSlug}/edit`);
          return;
        }
        setData(quiz);
        setQuizName(quiz.title || "");
        setInputs(quiz.userInputs || []);
        setImages((quiz.images || []) as QuizImage[]);
        setIsStrictMode(Boolean(quiz.isStrictMode));
        setTranslation({
          enable: Boolean(quiz.translationEnabled),
          sourceLanguage: quiz.sourceLanguage || "",
          targetLanguage: quiz.targetLanguage || "",
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load quiz:", err);
        error("Unable to load this quiz");
        router.replace("/");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [params.slug, router]);

  const uploadImage = async (file: File, key: string) => {
    const res = await uploadImageAPI(file);

    if (!res.ok) {
      throw new Error(res.error || `Unable to upload ${key} image`);
    }

    const { public_id, secure_url } = res.data;
    if (!public_id || !secure_url) {
      throw new Error(`Image upload returned incomplete data for ${key}`);
    }

    return { key, publicId: public_id, url: secure_url };
  };

  const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || isSaving) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    if (!String(values.title || "").trim()) {
      error("Quiz title is required");
      return;
    }

    if (!values.duration || Number(values.duration) < 1 || !Number.isFinite(Number(values.duration))) {
      error("Enter a valid duration of at least 1 minute");
      return;
    }

    if (!values.maxMarks || Number(values.maxMarks) < 1 || !Number.isFinite(Number(values.maxMarks))) {
      error("Enter valid maximum marks");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedImages: { key: string; publicId: string; url: string }[] = [];

      if (images.length > 0) {
        setFormStatus("Uploading images...");

        for (const image of images) {
          if (image.publicId) {
            uploadedImages.push({
              key: image.key,
              publicId: image.publicId,
              url: image.url,
            });
            continue;
          }

          if (!image.file) {
            throw new Error(`The ${image.key} image is missing its file`);
          }

          uploadedImages.push(await uploadImage(image.file, image.key));
        }
      }

      setFormStatus("Saving changes...");

      const res = await updateQuizDB(values, {
        quizId: data.id!,
        userInputs: inputs,
        images: uploadedImages,
        isStrictMode,
        translation,
      });

      if (!res.ok) {
        throw new Error(res.error || "Unable to update quiz");
      }

      if (res.warning) error(res.warning);
      else success("Quiz updated successfully");
      router.push(`/quiz/${res.data?.slug || data.slug}`);
    } catch (err) {
      console.error("Quiz update failed:", err);
      error(err instanceof Error ? err.message : "Something went wrong while updating the quiz");
    } finally {
      setIsSaving(false);
      setFormStatus("");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  const questionCount = data.questions?.length || 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-3 sm:p-5 lg:p-7">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <Link
            href={`/quiz/${data.slug}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quiz
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
              Quiz management
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                data.published
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {data.published ? "Published" : "Draft"}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Edit quiz</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Update the quiz details, assessment settings, participant fields, and presentation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50">
            <BookOpen className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{questionCount} questions</p>
            <p className="mt-0.5 text-xs text-slate-500">In this assessment</p>
          </div>
        </div>
      </header>

      <form onSubmit={submitHandler} className="space-y-6">
        {/* Cover image and live title preview */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Quiz cover</h2>
              <p className="mt-1 text-xs text-slate-500">Manage the images and preview the quiz title.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] sm:p-6">
            <div className="min-w-0">
              <ImageUplaod type="left" setImages={setImages} images={images} edit />
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/60 px-4 py-6 text-center sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Quiz preview</p>
              <h2 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {quizName || "Untitled quiz"}
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                {data.duration} minutes · {data.maxMarks} marks
              </p>
            </div>

            <div className="min-w-0">
              <ImageUplaod type="right" setImages={setImages} images={images} edit />
            </div>
          </div>
        </section>

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main settings */}
          <div className="min-w-0 space-y-6">
            {/* General information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Basic information</h2>
                  <p className="mt-1 text-xs text-slate-500">Set the title and description shown to participants.</p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="quiz-title" className="text-sm font-medium text-slate-700">
                    Quiz title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="quiz-title"
                    type="text"
                    name="title"
                    required
                    maxLength={160}
                    value={quizName}
                    onChange={(event) => setQuizName(event.target.value)}
                    placeholder="e.g. Python Fundamentals Assessment"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                  <p className="text-right text-[11px] text-slate-400">{quizName.length}/160</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description" className="text-sm font-medium text-slate-700">
                    Quiz description
                  </Label>
                  <Textarea
                    id="quiz-description"
                    name="desc"
                    defaultValue={data.desc || ""}
                    placeholder="Explain the purpose of this assessment and what participants should know before starting."
                    rows={4}
                    className="min-h-28 resize-y rounded-xl border-slate-200 leading-6 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Assessment settings */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50">
                  <SlidersHorizontal className="h-5 w-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Assessment settings</h2>
                  <p className="mt-1 text-xs text-slate-500">Control timing and the maximum score.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="quiz-duration" className="text-sm font-medium text-slate-700">
                    Time duration <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="quiz-duration"
                      type="number"
                      name="duration"
                      min={1}
                      step={1}
                      required
                      defaultValue={data.duration}
                      className="h-11 rounded-xl border-slate-200 pl-9 pr-16 focus-visible:ring-indigo-500"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      minutes
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-max-marks" className="text-sm font-medium text-slate-700">
                    Maximum marks <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="quiz-max-marks"
                    type="number"
                    name="maxMarks"
                    min={1}
                    step={1}
                    required
                    defaultValue={data.maxMarks}
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Participant fields */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50">
                  <Users className="h-5 w-5 text-violet-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Participant information</h2>
                  <p className="mt-1 text-xs text-slate-500">Choose the details participants must provide.</p>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <AddQuizInput inputs={inputs} setInputs={setInputs} />
              </div>
            </section>

            {/* Behavior and translation */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50">
                  <ShieldCheck className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Quiz behavior and language</h2>
                  <p className="mt-1 text-xs text-slate-500">Configure restrictions and translation settings.</p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <StrictMode isStrictMode={isStrictMode} setIsStrictMode={setIsStrictMode} />
                <Separator className="bg-slate-100" />
                <div className="flex items-start gap-3">
                  <Languages className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-3 text-sm font-medium text-slate-800">Translation</h3>
                    <Translation translation={translation} setTranslation={setTranslation} />
                  </div>
                </div>
              </div>
            </section>

            {/* Footer fields */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
                  <BookOpen className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Quiz footer</h2>
                  <p className="mt-1 text-xs text-slate-500">Optional organization, contact, and website information.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="footerHeading1">Primary heading</Label>
                  <Input
                    id="footerHeading1"
                    name="footerHeading1"
                    placeholder="e.g. Company Name"
                    defaultValue={data.footerHeading1 || ""}
                    className="rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="footerHeading2">Secondary heading</Label>
                  <Input
                    id="footerHeading2"
                    name="footerHeading2"
                    placeholder="e.g. Company Address"
                    defaultValue={data.footerHeading2 || ""}
                    className="rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText1">Contact detail 1</Label>
                  <Input
                    id="footerText1"
                    name="footerText1"
                    placeholder="e.g. Email address"
                    defaultValue={data.footerText1 || ""}
                    className="rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText2">Contact detail 2</Label>
                  <Input
                    id="footerText2"
                    name="footerText2"
                    placeholder="e.g. Phone number"
                    defaultValue={data.footerText2 || ""}
                    className="rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="footerLink">Website or link</Label>
                  <Input
                    id="footerLink"
                    name="footerLink"
                    type="text"
                    placeholder="https://example.com"
                    defaultValue={data.footerLink || ""}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar summary */}
          <aside className="space-y-5 lg:sticky lg:top-[70px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Overview</span>
                </div>
                <h2 className="mt-2 break-words text-lg font-semibold leading-6">{quizName || "Untitled quiz"}</h2>
                <p className="mt-1 text-xs text-slate-300">Saved assessment configuration</p>
              </div>

              <div className="space-y-0 divide-y divide-slate-100 px-5">
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-xs text-slate-500">Questions</span>
                  <span className="text-sm font-semibold text-slate-900">{questionCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-xs text-slate-500">Duration</span>
                  <span className="text-sm font-semibold text-slate-900">{data.duration} min</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-xs text-slate-500">Maximum marks</span>
                  <span className="text-sm font-semibold text-slate-900">{data.maxMarks}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-xs text-slate-500">Strict mode</span>
                  <span className={`text-xs font-semibold ${isStrictMode ? "text-amber-700" : "text-slate-500"}`}>
                    {isStrictMode ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="text-xs text-slate-500">Translation</span>
                  <span className={`text-xs font-semibold ${translation.enable ? "text-violet-700" : "text-slate-500"}`}>
                    {translation.enable ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-indigo-950">Changes are not saved automatically</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800/80">
                    Save your changes before leaving this page. Your existing questions are not modified here.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Form actions */}
        <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-6">
          <p className="text-xs leading-5 text-slate-500">
            Review your settings before saving. Required fields are marked with an asterisk.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => router.push(`/quiz/${data.slug}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 rounded-xl bg-indigo-600 px-5 hover:bg-indigo-700">
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {formStatus || "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuizPage;
