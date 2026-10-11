"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  Languages,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/data";
import { error, success, uploadImageAPI } from "@/lib/utils";
import { useGroups } from "@/hooks/useGroups";
import { createQuizDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";
import ImageUplaod from "@/app/(protected)/quiz/components/ImageUplaod";
import AddQuizInput from "@/app/(protected)/quiz/components/AddQuizInput";
import Translation from "../components/Translation";
import StrictMode from "../components/StrictMode";
import Loading from "@/components/shared/Loading";

type QuizImage = {
  key: string;
  publicId?: string;
  file?: File;
  url: string;
};

const Page = ({ searchParams }: { searchParams: { group: string } }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { groups: storedGroups, setGroups } = useDataStore();
  const { groups: availableGroups, isLoading: isGroupsLoading, error: fetchingError } = useGroups();

  const group = useMemo(
    () => availableGroups.find((item) => item.id === searchParams.group),
    [availableGroups, searchParams.group],
  );

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
    if (isGroupsLoading) return;

    if (fetchingError) {
      error(fetchingError, 1000);
      router.push("/");
      return;
    }

    if (!group) {
      error("Group not found", 1000);
      router.push("/");
    }
  }, [group, isGroupsLoading, fetchingError, router]);

  const uploadImage = async (file: File, key: string) => {
    const response = await uploadImageAPI(file);

    if (!response.ok) {
      throw new Error(response.error || `Unable to upload the ${key} image`);
    }

    const { public_id, secure_url } = response.data;
    return { key, publicId: public_id, url: secure_url };
  };

  const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formStatus) return;

    if (!group?.id) {
      error("Group not found", 1000);
      return;
    }

    if (!session?.user?.name) {
      error("Your session is not ready. Please sign in again.", 1500);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    const title = String(values.title || "").trim();
    const duration = Number(values.duration);
    const maxMarks = Number(values.maxMarks);

    if (!title) {
      error("Quiz title is required", 1000);
      return;
    }

    if (!Number.isFinite(duration) || duration < 1) {
      error("Valid duration is required", 1000);
      return;
    }

    if (!Number.isFinite(maxMarks) || maxMarks < 1) {
      error("Valid maximum marks are required", 1000);
      return;
    }

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
            throw new Error(`The ${image.key} image is missing its file. Please select it again.`);
          }

          const uploaded = await uploadImage(image.file, image.key);
          uploadedImages.push(uploaded);
        }
      }

      setFormStatus("Creating quiz...");
      const response = await createQuizDB(values, {
        author: session.user.name,
        groupId: group.id,
        userInputs: inputs,
        images: uploadedImages,
        isStrictMode,
        translation,
      });

      if (!response.ok) {
        error(response.error || "Unable to create quiz", 1500);
        return;
      }

      const newQuiz: IQuiz = { ...response.data, questions: [] } as IQuiz;
      const updatedGroups = storedGroups.map((storedGroup) => {
        if (storedGroup.id !== group.id) return storedGroup;

        return {
          ...storedGroup,
          quizzes: storedGroup.quizzes ? [...storedGroup.quizzes, newQuiz] : [newQuiz],
        };
      });

      setGroups(updatedGroups);
      success("Quiz created successfully");
      router.push(`/group/${group.slug || group.id}`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Something went wrong while creating the quiz";
      error(message, 1500);
    } finally {
      setFormStatus("");
    }
  };

  if (isGroupsLoading || fetchingError || !group) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loading />
      </div>
    );
  }

  const isSubmitting = Boolean(formStatus);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      {/* Page intro */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 sm:p-7">
          <Link
            href={`/group/${group.slug || group.id}`}
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to group
          </Link>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <BookOpen className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                    Quiz builder
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
                    <Sparkles className="h-3 w-3 text-indigo-500" />
                    New assessment
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Create a new quiz</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Set up the quiz details, participant fields, assessment rules, and branding. You can add questions after
                  creating the quiz.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Setup status</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-sm font-semibold text-slate-800">Draft configuration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submitHandler} className="space-y-6">
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
          {/* Main form */}
          <main className="min-w-0 space-y-6">
            {/* Quiz information */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Basic information</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Give your quiz a clear title and explain what it covers.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="quiz-title" className="text-sm font-medium text-slate-700">
                      Quiz title <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Required</span>
                  </div>
                  <Input
                    id="quiz-title"
                    type="text"
                    name="title"
                    required
                    maxLength={160}
                    placeholder="e.g. Python Fundamentals Assessment"
                    value={quizName}
                    onChange={(event) => setQuizName(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white px-3.5 shadow-none placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">Choose a title participants can recognize easily.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description" className="text-sm font-medium text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="quiz-description"
                    name="desc"
                    placeholder="Describe the topics, goals, or instructions for this quiz..."
                    rows={4}
                    className="min-h-[100px] resize-y rounded-xl border-slate-200 bg-white px-3.5 py-3 shadow-none placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Cover images and title preview */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50">
                  <ImagePlus className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Quiz branding</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Add optional banner images and preview the quiz heading.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Left banner image</p>
                    <ImageUplaod type="left" setImages={setImages} images={images} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Right banner image</p>
                    <ImageUplaod type="right" setImages={setImages} images={images} />
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">Live title preview</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="border-t-4 border-slate-800 pt-3">
                      <div className="mx-auto w-fit max-w-full rounded-b-lg border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                        <p className="break-words text-base font-semibold text-slate-900 sm:text-lg select-none">
                          {quizName.trim() || <span className="text-slate-400">Your quiz title will appear here</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    The preview updates as you type. Banner images are optional.
                  </p>
                </div>
              </div>
            </section>

            {/* Assessment settings */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50">
                  <ListChecks className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Assessment settings</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Set the time limit and total marks for this assessment.
                  </p>
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
                      placeholder="30"
                      className="h-11 rounded-xl border-slate-200 pl-9 pr-16 shadow-none focus-visible:ring-indigo-500"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      minutes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Minimum 1 minute.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-max-marks" className="text-sm font-medium text-slate-700">
                    Maximum marks <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="quiz-max-marks"
                      type="number"
                      name="maxMarks"
                      min={1}
                      step={1}
                      required
                      placeholder="50"
                      className="h-11 rounded-xl border-slate-200 pl-9 shadow-none focus-visible:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Minimum 1 mark.</p>
                </div>
              </div>
            </section>

            {/* Participant fields */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Participant information</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose the details participants must provide before starting.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <AddQuizInput inputs={inputs} setInputs={setInputs} />
              </div>
            </section>

            {/* Quiz behavior and language */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Behavior and language</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Configure exam restrictions and optional translated content.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <StrictMode isStrictMode={isStrictMode} setIsStrictMode={setIsStrictMode} />
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Translation settings</h3>
                </div>
                <Translation translation={translation} setTranslation={setTranslation} />
              </div>
            </section>

            {/* Footer settings */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Quiz footer</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Add organization details or contact information shown at the bottom of the quiz.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="footer-heading-1">Primary heading</Label>
                  <Input
                    id="footer-heading-1"
                    className="h-10 rounded-xl"
                    type="text"
                    placeholder="Company or institute name"
                    name="footerHeading1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-heading-2">Secondary heading</Label>
                  <Input
                    id="footer-heading-2"
                    className="h-10 rounded-xl"
                    type="text"
                    placeholder="Address or department"
                    name="footerHeading2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-text-1">Contact detail 1</Label>
                  <Input
                    id="footer-text-1"
                    className="h-10 rounded-xl"
                    type="text"
                    placeholder="Email address"
                    name="footerText1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-text-2">Contact detail 2</Label>
                  <Input
                    id="footer-text-2"
                    className="h-10 rounded-xl"
                    type="text"
                    placeholder="Phone number"
                    name="footerText2"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="footer-link">Website or link</Label>
                  <Input
                    id="footer-link"
                    className="h-10 rounded-xl"
                    type="text"
                    placeholder="https://example.com"
                    name="footerLink"
                  />
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5 xl:sticky xl:top-[70px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Creation overview</h2>
                <p className="mt-1 text-xs text-slate-500">A live summary of this setup.</p>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Quiz title</p>
                  <p className="mt-1.5 break-words text-sm font-semibold text-slate-900">
                    {quizName.trim() || "Untitled quiz"}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <ImagePlus className="h-4 w-4 text-slate-400" />
                    Banner images
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{images.length} / 2</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    Participant fields
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{inputs.length}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    Strict mode
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      isStrictMode ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isStrictMode ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <Languages className="h-4 w-4 text-slate-400" />
                    Translation
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      translation.enable ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {translation.enable ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {translation.enable && (
                  <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 text-xs text-violet-800">
                    {translation.sourceLanguage || "Source language"} → {translation.targetLanguage || "Target language"}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-indigo-100">
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Next step</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                After the quiz is created, open it from the group page to add questions and configure the answer key.
              </p>
            </section>

            <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:block">
              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-xl bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
                disabled={isSubmitting || !quizName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {formStatus}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create quiz
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                Title, duration, and maximum marks are required.
              </p>
            </div>
          </aside>
        </div>

        {/* Mobile submit action */}
        <div className="flex justify-end border-t border-slate-200 pt-5 xl:hidden">
          <Button
            type="submit"
            className="h-11 w-full gap-2 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 sm:w-auto sm:min-w-[200px]"
            disabled={isSubmitting || !quizName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {formStatus}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create quiz
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Page;
