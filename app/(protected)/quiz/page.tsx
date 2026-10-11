"use client";

import { redirect } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { error, success } from "@/lib/utils";
import { IOption, IQuestion, IQuiz, IQuizParticipant } from "@/types";
import { getQuizDB } from "@/lib/actions/quiz.actions";
import { Button } from "@/components/ui/button";
import { Pencil1Icon } from "@radix-ui/react-icons";
import QuizHeader from "./components/QuizHeader";
import UserInputs from "./components/UserInputs";
import QuizInfo from "./components/QuizInfo";
import QuizDesc from "./components/QuizDesc";
import QuizFooter from "./components/QuizFooter";
import QuizQuestions from "./components/QuizQuestions";
import AddQuestion from "@/components/dialogs/AddQuestion";
import Link from "next/link";
import DeleteQuiz from "@/components/dialogs/DeleteQuiz";
import { PublishQuiz } from "@/components/dialogs/Share";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQuizParticipantsDB } from "@/lib/actions/user.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Loading from "@/components/shared/Loading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock3,
  CopyIcon,
  Download,
  FileQuestion,
  ListChecks,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { convertJsonToCsv, downloadFile } from "@/lib/download";
import { SiGmail } from "react-icons/si";
import { successResultWithNote } from "@/lib/templates/success-result-with-note";
import { rejectResultWithNote } from "@/lib/templates/rejectResult";
import GenerateQuestions from "@/components/dialogs/GenerateQuestions";
import { CodeBlock } from "@/components/shared/CodeBlock";

const Page = ({ searchParams }: { searchParams: { id: string } }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<IQuiz | null>(null);

  const app_url = process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    const fetchData = async () => {
      if (searchParams.id) {
        const res = await getQuizDB({ id: searchParams.id });
        setIsLoading(false);
        if (!res.ok) return error(res.error!);
        setData(res.data as IQuiz);
      }
    };
    fetchData();
  }, [searchParams.id]);

  if (!searchParams.id || (!isLoading && !data)) return redirect("/");

  if (isLoading || !data) {
    return (
      <span className="gap-2 mt-10 flex items-center justify-center">
        <Loading />
      </span>
    );
  }

  return (
    <Tabs defaultValue="details" className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                  Quiz management
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    data.published
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${data.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {data.published ? "Published" : "Draft"}
                </span>

                {data.isStrictMode && (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Strict mode
                  </span>
                )}
              </div>

              <h1 className="max-w-3xl break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {data.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage quiz content, configure assessment settings, and review participant performance.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <FileQuestion className="h-4 w-4 text-indigo-600" />
                  {data.questions.length} questions
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  {data.duration} min
                </span>

                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <ListChecks className="h-4 w-4 text-indigo-600" />
                  {data.maxMarks} total marks
                </span>
              </div>
            </div>

            {/* Page actions */}
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Link
                href={`/quiz/edit?id=${data.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Pencil1Icon className="h-4 w-4" />
                Edit quiz
              </Link>

              <div className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 shadow-sm">
                <DeleteQuiz quizId={data.id} groupId={data.groupId} />
              </div>
            </div>
          </div>
        </div>

        {/* Management tabs */}
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <TabsTrigger
              value="details"
              className="gap-2 rounded-lg py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Quiz details
            </TabsTrigger>

            <TabsTrigger
              value="participants"
              className="gap-2 rounded-lg py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Participants
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Quiz details */}
      <TabsContent value="details" className="mt-0 space-y-6">
        {/* Publication actions */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50">
              {data.published ? (
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              ) : (
                <Sparkles className="h-5 w-5 text-indigo-600" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {data.published ? "Your quiz is live" : "Your quiz is not published"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {data.published
                  ? "Manage distribution or copy the quiz link to share it."
                  : "Publish the quiz when its content and settings are ready."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PublishQuiz id={data.id} isPublished={data.published} setData={setData} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                try {
                  const shareUrl = `${app_url || window.location.origin}/share/quiz/${data.id}`;

                  await navigator.clipboard.writeText(shareUrl);
                  success("Link copied to clipboard");
                } catch {
                  error("Unable to copy link");
                }
              }}
            >
              <CopyIcon className="h-4 w-4" />
              Copy link
            </Button>
          </div>
        </section>

        {/* Main layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <main className="min-w-0 space-y-6">
            {/* Quiz cover */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Quiz cover</h2>
                <p className="mt-1 text-xs text-slate-500">Manage the quiz header and associated images.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizHeader title={data.title} images={data.images || []} editable />
              </div>
            </section>

            {/* Quiz description */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Description</h2>
                <p className="mt-1 text-xs text-slate-500">Explain the assessment to participants.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizDesc desc={data.desc} editable />
              </div>
            </section>

            {/* Question bank */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 sm:p-6 lg:flex-row lg:items-center">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <ListChecks className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">Question bank</h2>

                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {data.questions.length} {data.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </div>

                    <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-500">
                      Create questions, generate them with AI, and maintain the content of your assessment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <GenerateQuestions quizId={data.id} isTranslationEnabled={data.translationEnabled} />

                  <AddQuestion
                    quizId={data.id}
                    data={data}
                    setData={setData}
                    translate={{
                      enable: data.translationEnabled,
                      source: data.sourceLanguage,
                      target: data.targetLanguage,
                    }}
                  />
                </div>
              </div>

              <div className="min-w-0 p-3 sm:p-5">
                {data.questions.length > 0 ? (
                  <QuizQuestions questions={data.questions} data={data} setData={setData} />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                      <FileQuestion className="h-6 w-6 text-indigo-600" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-900">No questions added yet</h3>

                    <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
                      Start building your quiz by adding a question or generating questions automatically.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <GenerateQuestions quizId={data.id} isTranslationEnabled={data.translationEnabled} />

                      <AddQuestion
                        quizId={data.id}
                        data={data}
                        setData={setData}
                        translate={{
                          enable: data.translationEnabled,
                          source: data.sourceLanguage,
                          target: data.targetLanguage,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Quiz footer */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-semibold text-slate-900">Footer content</h2>
                <p className="mt-1 text-xs text-slate-500">Configure the additional content shown in your quiz footer.</p>
              </div>

              <div className="p-4 sm:p-6">
                <QuizFooter
                  data={{
                    footerHeading1: data.footerHeading1,
                    footerHeading2: data.footerHeading2,
                    footerText1: data.footerText1,
                    footerText2: data.footerText2,
                    footerLink: data.footerLink,
                  }}
                  editable
                />
              </div>
            </section>
          </main>

          {/* Settings sidebar */}
          <aside className="min-w-0 space-y-6 xl:sticky xl:top-[70px]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Assessment settings</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">Duration and scoring.</p>
              </div>

              <div className="p-4 sm:p-5">
                <QuizInfo duration={data.duration} maxMarks={data.maxMarks} editable />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Participant fields</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">Information collected from quiz participants.</p>
              </div>

              <div className="p-4 sm:p-5">
                <UserInputs inputs={data.userInputs} editable />
              </div>
            </section>
          </aside>
        </div>
      </TabsContent>

      {/* Participant history */}
      <TabsContent value="participants" className="mt-0">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Participants</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Review submissions, inspect quiz results, and manage participant records.
              </p>
            </div>
          </div>

          <QuizHistory quizId={searchParams.id} questions={data.questions} />
        </section>
      </TabsContent>
    </Tabs>
  );
};

const QuizHistory = ({ quizId, questions }: { quizId: string; questions: IQuestion[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<{ [key: string]: IQuizParticipant[] }>({});

  const handleUpdateParticipant = (date: string, id: string, key: string, value: string) => {
    const dayParticipants = participants[date] ?? [];
    const participant = dayParticipants.find((participant) => participant.id === id);
    if (!participant) return;
    const newParticipant = { ...participant, [key]: value };
    const newParticipants = {
      ...participants,
      [date]: [...dayParticipants.filter((participant) => participant.id !== id), newParticipant],
    };
    setParticipants(newParticipants);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getQuizParticipantsDB({ quizId });
        if (cancelled) return;
        if (!res.ok) {
          error(res.error || "Unable to load quiz participants.");
          setParticipants({});
          return;
        }
        const rows = (res.data ?? []) as IQuizParticipant[];
        const grouped = rows.reduce((acc: { [key: string]: IQuizParticipant[] }, participant) => {
          const date = new Date(participant.createdAt).toDateString();
          (acc[date] ??= []).push(participant);
          return acc;
        }, {});
        setParticipants(grouped);
      } catch {
        if (!cancelled) error("Unable to load quiz participants. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchData();
    return () => { cancelled = true; };
  }, [quizId]);

  if (isLoading)
    return (
      <div className="gap-2 mt-10 flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <>
      {participants &&
        Object.keys(participants).map((date) => (
          <Accordion key={date} type="single" collapsible>
            <AccordionItem value={date}>
              <AccordionTrigger>
                <span className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{date}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span>{participants[date].length}</span>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <QuizParticipants
                  quizId={quizId}
                  questions={questions}
                  participants={participants[date]}
                  date={date}
                  cb={handleUpdateParticipant}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
    </>
  );
};

const QuizParticipants = ({
  quizId,
  questions,
  participants,
  date,
  cb,
}: {
  quizId: string;
  questions: IQuestion[];
  participants: IQuizParticipant[];
  date: string;
  cb: (date: string, id: string, key: string, value: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortedByName, setSortedByName] = useState(false);
  const [showPercentile, setShowPercentile] = useState(false);
  const [showDisqualified, setShowDisqualified] = useState(true);
  const [shortedParticipants, setShortedParticipants] = useState<IQuizParticipant[]>([]);

  const generateDownloadData = () => {
    setIsDownloading(true);
    try {
      const formattedData = shortedParticipants.map((data) => {
        return {
          name: data.User.name,
          email: data.User.email,
          phone: data.User.phone,
          correctAnswers: data.Answers.reduce(
            (acc, answer) => (answer.answer === answer.Question?.answer ? acc + 1 : acc),
            0,
          ),
          totalQuestions: data.Answers.length,
        };
      });

      downloadFile({
        data: convertJsonToCsv(formattedData),
        fileName: "users-lists.csv",
        fileType: "text/csv",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
    }
    setIsDownloading(false);
  };

  const generatePercentile = () => {
    // get correct answers for each participant
    const correctAnswers = shortedParticipants.reduce(
      (acc: { id: string; answers: number }[], participant: IQuizParticipant) => {
        const answerMap = new Map(participant.Answers.map((answer) => [answer.questionId, answer.answer]));
        let correct = 0;

        questions.forEach((question) => {
          const userAnswer = answerMap.get(question.id);
          if (userAnswer === question.answer) {
            correct++;
          }
        });

        return [...acc, { id: participant.id, answers: correct }];
      },
      [],
    );

    // sort by correct answers
    const sortedData = correctAnswers.sort((a, b) => b.answers - a.answers);

    const updatedParticipants = sortedData.map((participant: { id: string; answers: number }, index: number) => {
      const updatedParticipant = { ...shortedParticipants.find((p) => p.id === participant.id) };
      updatedParticipant.percentile = (sortedData.length <= 1
        ? 100
        : ((sortedData.length - (index + 1)) / (shortedParticipants.length - 1)) * 100
      ).toFixed(2);
      return updatedParticipant;
    });

    // @ts-ignore
    setShortedParticipants(updatedParticipants);
  };

  useEffect(() => {
    setShortedParticipants(participants);
  }, [participants]);

  useEffect(() => {
    if (sortedByName) {
      const sortedData = [...shortedParticipants].sort((a, b) => a.User.name.localeCompare(b.User.name));
      setShortedParticipants(sortedData);
    }
  }, [sortedByName]);

  useEffect(() => {
    if (showPercentile) {
      setSortedByName(false);
      generatePercentile();
    } else {
      setShortedParticipants(participants);
      setSortedByName(false);
    }
  }, [showPercentile]);

  useEffect(() => {
    if (!showDisqualified) {
      const updatedParticipants = shortedParticipants.filter((participant) => participant.isQualified);
      setShortedParticipants(updatedParticipants);
    } else {
      setSortedByName(false);
      setShowPercentile(false);
      setShortedParticipants(participants);
    }
  }, [showDisqualified]);
  return (
    <div className="px-2">
      {isLoading && <div>Loading...</div>}
      {!isLoading && participants?.length === 0 && <div>No participants found</div>}

      {participants.length > 0 && (
        <div className="flex justify-between gap-2 items-center flex-wrap mb-5">
          <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-start">
            <p>{shortedParticipants.length} participants</p>
            <Button size={"sm"} disabled={isDownloading} onClick={generateDownloadData}>
              {isDownloading ? "Downloading..." : "Download CSV"}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={showDisqualified} onCheckedChange={setShowDisqualified} />
              <Label htmlFor="airplane-mode">{showDisqualified ? "Hide Disqualified" : "Show Disqualified"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={sortedByName} onCheckedChange={setSortedByName} />
              <Label htmlFor="airplane-mode">Sort</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" checked={showPercentile} onCheckedChange={setShowPercentile} />
              <Label htmlFor="airplane-mode">Percentile</Label>
            </div>
          </div>
        </div>
      )}

      <Accordion type="multiple">
        {shortedParticipants.map((participant, index) => (
          <Participant key={participant.id} data={participant} questions={questions} index={index} date={date} cb={cb} />
        ))}
      </Accordion>
    </div>
  );
};

interface IResult {
  id: string;
  title: string;
  snippet: string;
  snippetLang: string;
  options: IOption[];
  correctAnswer: string;
  userAnswer: string | null;
  isAttempted: boolean;
  isCorrect: boolean;
}

const Participant = ({
  data,
  questions,
  index,
  date,
  cb,
}: {
  data: IQuizParticipant;
  questions: IQuestion[];
  index: number;
  date: string;
  cb: (date: string, id: string, key: string, value: string) => void;
}) => {
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [results, setResults] = useState<IResult[]>([]);

  const totalQuestions = questions.length;
  const attemptedCount = data.Answers.length;
  const unansweredCount = Math.max(0, totalQuestions - attemptedCount);
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // count correct and incorrect answers
  useEffect(() => {
    if (!data.Answers) return;

    let correct = 0;
    let incorrect = 0;
    data.Answers.forEach((answer) => {
      if (answer.Question?.answer === answer.answer) {
        correct++;
      } else {
        incorrect++;
      }
    });
    setCorrectAnswers(correct);
    setIncorrectAnswers(incorrect);

    // Create a lookup object to store answers by questionId
    const answerLookup = data.Answers.reduce((acc: { [key: string]: string }, answer) => {
      acc[answer.questionId] = answer.answer;
      return acc;
    }, {});

    const res = questions.map((q) => {
      const userAnswer = answerLookup[q.id] || null;
      return {
        id: q.id,
        title: q.title,
        snippet: q.snippet,
        snippetLang: q.snippetLang,
        options: q.options,
        correctAnswer: q.answer,
        userAnswer,
        isAttempted: !!userAnswer,
        isCorrect: q.answer === userAnswer,
      };
    });
    setResults(res);
  }, [data]);

  const userInfoRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !userInfoRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      const userInfoHtml = userInfoRef.current.innerHTML;
      const elementHtml = contentRef.current.innerHTML;
      const escapedParticipantName = data.User.name.replace(/[&<>\"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#39;",
        };
        return entities[character] || character;
      });

      const htmlContent = `
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <h1 class="text-3xl mb-1">${escapedParticipantName}</h1>
          ${userInfoHtml}
          <h1 class="text-xl mt-5">Results</h1>
          ${elementHtml}
        </body>
      </html>
    `;

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Create a link to download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.User.name}.pdf`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true);
      const name = data.User.name;
      const email = data.User.email;

      const emailBody = {
        to: [{ name, address: email }],
        // subject: "Congratulations! You Have Qualified for Level 2 at Excelling Technologies",
        subject: "Your Quiz Results – Keep Learning & Claim Your Scholarship!",
        body: {
          html: rejectResultWithNote({
            name,
            email,
            totalQuestions: questions.length,
            attemptedQuestions: data.Answers.length,
            correctAnswers,
          }),
        },
        participantId: data.id,
      };

      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      }).then((res) => res.json());

      if (!response.ok) {
        return error(response.error);
      }

      // cb(date, data.id, "sentEmailId", response.data.messageId || "");
      success("Email sent successfully");
    } catch (err) {
      console.error(err);
      error("Something went wrong");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <AccordionItem value={index + ""} className="flex flex-col">
      <AccordionTrigger className="p-2 hover:no-underline">
        <div className="flex justify-between w-full mr-2">
          {index + 1}. {data.User.name} {!data.isQualified && <span className="text-red-600 text-xs">- Disqualified</span>}
          {data.percentile && (
            <span className="flex items-start">
              {data.percentile}
              <span className="text-[10px] ml-[2px] mt-[-2px]">th</span>
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {data.anyReason && <p className="text-red-600 px-4 pb-2">Reason: {data.anyReason}</p>}
        {/* @ts-ignore */}

        <div ref={userInfoRef} className="mx-auto mb-8 max-w-[1020px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Score header */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-7 text-white sm:px-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Assessment report</p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{data.User.name}</h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                    Review your performance, identify mistakes, and find the concepts that need more practice.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                      {totalQuestions} Questions
                    </span>

                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                      {attemptedCount} Attempted
                    </span>
                  </div>
                </div>

                {/* Circular score */}
                <div className="flex flex-col gap-4">
                  <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Quiz Results</h2>
                  <div className="flex shrink-0 items-center gap-4 self-start sm:self-auto">
                    <div
                      className="grid h-28 w-28 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#34d399 ${scorePercentage}%, rgba(255,255,255,0.15) 0)`,
                      }}
                    >
                      <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-slate-900">
                        <div className="text-center">
                          <p className="text-3xl font-bold tracking-tight">{scorePercentage}%</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Score</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-200">Final score</p>
                      <p className="mt-1 text-xl font-semibold">
                        {correctAnswers}
                        <span className="text-slate-400"> / {totalQuestions}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Correct answers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Questions answered</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{attemptedCount}</p>
                <p className="mt-1 text-xs text-slate-500">Out of {totalQuestions} questions</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-xs font-medium text-emerald-700">Correct answers</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">{correctAnswers}</p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  {attemptedCount > 0
                    ? `${Math.round((correctAnswers / attemptedCount) * 100)}% of attempted`
                    : "No attempts yet"}
                </p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <p className="text-xs font-medium text-rose-700">Incorrect answers</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">{incorrectAnswers}</p>
                <p className="mt-1 text-xs text-rose-700/80">Review these questions</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-xs font-medium text-amber-700">Not answered</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">{unansweredCount}</p>
                <p className="mt-1 text-xs text-amber-700/80">Questions skipped</p>
              </div>
            </div>

            {/* Submission details */}
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-800">Submitted on</span>
                <span>{new Date(data.createdAt).toLocaleString()}</span>
              </div>

              <span className="text-xs text-slate-500">Assessment performance overview</span>
            </div>
          </section>
        </div>

        <div className="mt-2">
          <div className="flex">
            <Button variant={"secondary"} size={"sm"} onClick={() => setShowResult(!showResult)}>
              {showResult ? <ArrowUp className="h-3 w-3 mr-2" /> : <ArrowDown className="h-3 w-3 mr-2" />}{" "}
              {showResult ? "Hide Result" : "Show Result"}
            </Button>

            <Button className="ml-auto" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>

            {/* {data.sentEmailId ? (
              <div>
                <Button
                  variant={"secondary"}
                  size={"sm"}
                  className="ml-2"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                >
                  <SiGmail className="mr-2 h-4 w-4" /> {isSendingEmail ? "Sending..." : "Resend Email"}
                </Button>
              </div>
            ) : (
              <Button size={"sm"} className="ml-2" onClick={handleSendEmail} disabled={isSendingEmail}>
                <SiGmail className="mr-2 h-4 w-4" /> {isSendingEmail ? "Sending..." : "Send Email"}
              </Button>
            )} */}
          </div>

          <div className={`${showResult ? "block" : "hidden"} overflow-y-scroll mt-3`}>
            {/* @ts-ignore */}
            <div ref={contentRef} className="mx-auto max-w-[1020px]">
              {/* Section Header */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-indigo-600" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                      Assessment Review
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Question Review</h2>

                  <p className="mt-1.5 text-sm leading-5 text-slate-500">
                    Review your answers and identify areas that need improvement.
                  </p>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5   shadow-sm">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50">
                    <span className="text-sm font-bold text-indigo-600">Q</span>
                  </div>

                  <div>
                    <p className="text-lg font-bold leading-5 text-slate-900">{results.length}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Total questions</p>
                  </div>
                </div>
              </div>

              {/* Status Legend */}
              <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-xs font-semibold text-slate-600">Answer status</span>

                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-slate-600">Correct answer</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-xs text-slate-600">Incorrect selection</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-slate-300" />
                  <span className="text-xs text-slate-600">Other options</span>
                </div>
              </div>

              {/* Question List */}
              <div className="space-y-4">
                {results.map((res, index) => {
                  const isCorrect = Boolean(res.isAttempted && res.isCorrect);
                  const isIncorrect = Boolean(res.isAttempted && !res.isCorrect);
                  const isUnattempted = !res.isAttempted;

                  const status = isCorrect
                    ? {
                        label: "Correct",
                        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
                        iconClassName: "text-emerald-600",
                        numberClassName: "bg-emerald-100 text-emerald-700",
                        borderClassName: "border-emerald-200",
                      }
                    : isIncorrect
                      ? {
                          label: "Incorrect",
                          className: "bg-rose-50 text-rose-700 ring-rose-600/20",
                          iconClassName: "text-rose-600",
                          numberClassName: "bg-rose-100 text-rose-700",
                          borderClassName: "border-rose-200",
                        }
                      : {
                          label: "Not attempted",
                          className: "bg-slate-100 text-slate-600 ring-slate-500/20",
                          iconClassName: "text-slate-500",
                          numberClassName: "bg-slate-100 text-slate-600",
                          borderClassName: "border-slate-200",
                        };

                  const sortedOptions = [...res.options].sort((a, b) => a.key.localeCompare(b.key));

                  return (
                    <article
                      key={res.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md ${status.borderClassName}`}
                    >
                      {/* Question Header and Text */}
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Question Number */}
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${status.numberClassName}`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          {/* Question Content */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Question {index + 1}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}
                              >
                                {isCorrect && <CheckCircle className="h-3.5 w-3.5" />}

                                {isIncorrect && <XCircle className="h-3.5 w-3.5" />}

                                {isUnattempted && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}

                                {status.label}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-900 sm:text-base">
                              {res.title}
                            </p>

                            {/* Code Snippet */}
                            {res.snippet && (
                              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                  </div>

                                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                    {res.snippetLang || "plaintext"}
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <CodeBlock lang={res.snippetLang || "plaintext"}>{res.snippet}</CodeBlock>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Options Section */}
                      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Answer options</h3>

                          <span className="text-[11px] font-medium text-slate-400">{sortedOptions.length} options</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {sortedOptions.map((option) => {
                            const isSelected = res.userAnswer === option.key;
                            const isCorrectOption = res.correctAnswer === option.key;

                            const isWrongSelection = isSelected && !isCorrectOption;

                            const optionStyle = isCorrectOption
                              ? "border-emerald-200 bg-emerald-50/90"
                              : isWrongSelection
                                ? "border-rose-200 bg-rose-50/90"
                                : "border-slate-200 bg-white hover:border-slate-300";

                            const optionKeyStyle = isCorrectOption
                              ? "bg-emerald-600 text-white"
                              : isWrongSelection
                                ? "bg-rose-500 text-white"
                                : "bg-slate-100 text-slate-600";

                            return (
                              <div
                                key={option.id}
                                className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 transition-colors duration-150 ${optionStyle}`}
                              >
                                {/* Option Key */}
                                <div
                                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${optionKeyStyle}`}
                                >
                                  {option.key.toUpperCase()}
                                </div>

                                {/* Option Text and Explanation of Status */}
                                <div className="min-w-0 flex-1 pt-0.5">
                                  <p
                                    className={`break-words text-sm leading-6 ${
                                      isCorrectOption
                                        ? "font-medium text-emerald-950"
                                        : isWrongSelection
                                          ? "font-medium text-rose-950"
                                          : "text-slate-700"
                                    }`}
                                  >
                                    {option.value}
                                  </p>

                                  {(isCorrectOption || isSelected) && (
                                    <p
                                      className={`mt-2 text-[11px] font-semibold leading-4 ${
                                        isCorrectOption ? "text-emerald-700" : "text-rose-700"
                                      }`}
                                    >
                                      {isCorrectOption && isSelected
                                        ? "Your answer · Correct answer"
                                        : isCorrectOption
                                          ? "Correct answer"
                                          : "Your selected answer"}
                                    </p>
                                  )}
                                </div>

                                {/* Option Status Icon */}
                                <div className="shrink-0 pt-1">
                                  {isCorrectOption && (
                                    <CheckCircle className="h-4 w-4 text-emerald-600" aria-label="Correct answer" />
                                  )}

                                  {isWrongSelection && (
                                    <XCircle className="h-4 w-4 text-rose-500" aria-label="Incorrect selection" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Unattempted Question Notice */}
                        {isUnattempted && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5">
                            <span className="mt-0.5 text-amber-600">!</span>

                            <p className="text-xs leading-5 text-amber-800">
                              This question was not attempted. The correct answer is highlighted above for your review.
                            </p>
                          </div>
                        )}

                        {/* Incorrect Answer Notice */}
                        {/* {isIncorrect && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2.5">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

                            <p className="text-xs leading-5 text-rose-800">
                              Your selected answer is incorrect. Review the highlighted correct answer.
                            </p>
                          </div>
                        )} */}

                        {/* Correct Answer Notice */}
                        {/* {isCorrect && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                            <p className="text-xs leading-5 text-emerald-800">Correct. You selected the right answer.</p>
                          </div>
                        )} */}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* End of Review */}
              <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-5 text-center">
                <CheckCircle className="h-4 w-4 text-indigo-600" />

                <p className="text-sm font-medium text-slate-600">You have reached the end of the assessment review.</p>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default Page;
