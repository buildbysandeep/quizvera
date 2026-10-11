"use client";

import React, { useEffect, useRef, useState } from "react";
import { error, success } from "@/lib/utils";
import { IOption, IQuestion, IQuizParticipant } from "@/types";
import { getQuizParticipantsDB } from "@/lib/actions/user.action";
import { deleteQuizParticipantDB } from "@/lib/actions/collaboration.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Loading from "@/components/shared/Loading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Download,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { convertJsonToCsv, downloadFile } from "@/lib/download";
import { SiGmail } from "react-icons/si";
import { successResultWithNote } from "@/lib/templates/success-result-with-note";
import { rejectResultWithNote } from "@/lib/templates/rejectResult";
import { CodeBlock } from "@/components/shared/CodeBlock";

function submissionDayKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function submissionDayLabel(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const todayKey = submissionDayKey(today);
  const yesterdayKey = submissionDayKey(yesterday);
  const pretty = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return key === todayKey ? `Today · ${pretty}` : key === yesterdayKey ? `Yesterday · ${pretty}` : pretty;
}

export default function QuizParticipantsHistory({ quizId, questions }: { quizId: string; questions: IQuestion[] }) {
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<IQuizParticipant[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "qualified" | "disqualified">("all");

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await getQuizParticipantsDB({ quizId });
      if (!response.ok) throw new Error(response.error || "Unable to load participants.");
      setParticipants((response.data ?? []) as IQuizParticipant[]);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to load participants.");
      setParticipants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [quizId]);

  const onDelete = async (participantId: string): Promise<boolean> => {
    const response = await deleteQuizParticipantDB({ quizId, participantId });
    if (!response.ok) {
      error(response.error || "Unable to delete participant.");
      return false;
    }
    setParticipants((current) => current.filter((participant) => participant.id !== participantId));
    success("Participant and all associated answer data were deleted.");
    return true;
  };

  const normalizedSearch = search.trim().toLowerCase();
  const visibleParticipants = participants.filter((participant) => {
    const matchesSearch =
      !normalizedSearch ||
      [participant.User?.name, participant.User?.email, participant.User?.phone].some((value) =>
        (value ?? "").toLowerCase().includes(normalizedSearch),
      );
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "qualified" ? participant.isQualified : !participant.isQualified);
    return matchesSearch && matchesStatus;
  });
  const correctCounts = participants.map(
    (participant) => participant.Answers.filter((answer) => answer.Question?.answer === answer.answer).length,
  );
  const avgScore = correctCounts.length
    ? Math.round(correctCounts.reduce((sum, item) => sum + item, 0) / correctCounts.length)
    : 0;
  const qualifiedCount = participants.filter((participant) => participant.isQualified).length;
  const avgPercent = questions.length && participants.length ? Math.round((avgScore / questions.length) * 100) : 0;
  const participantsByDay = new Map<string, IQuizParticipant[]>();
  for (const participant of visibleParticipants) {
    const key = submissionDayKey(participant.createdAt);
    const entries = participantsByDay.get(key) ?? [];
    entries.push(participant);
    participantsByDay.set(key, entries);
  }
  const dayGroups = Array.from(participantsByDay.entries()).sort(([left], [right]) => right.localeCompare(left));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total submissions</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{participants.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">All attempts recorded</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-medium text-emerald-700">Qualified</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">{qualifiedCount}</p>
          <p className="mt-1 text-[11px] text-emerald-700/70">
            {participants.length ? Math.round((qualifiedCount / participants.length) * 100) : 0}% of participants
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-xs font-medium text-rose-700">Disqualified</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-800">{participants.length - qualifiedCount}</p>
          <p className="mt-1 text-[11px] text-rose-700/70">Check attempt reasons</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="text-xs font-medium text-indigo-700">Average score</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-800">{avgPercent}%</p>
          <p className="mt-1 text-[11px] text-indigo-700/70">Across {questions.length} questions</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search participant name, email, or phone…"
            className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:ring-indigo-500"
            aria-label="Search participants"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              { value: "all", label: `All (${participants.length})` },
              { value: "qualified", label: `Qualified (${qualifiedCount})` },
              { value: "disqualified", label: `Disqualified (${participants.length - qualifiedCount})` },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={statusFilter === item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loading />
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <Users className="mx-auto h-7 w-7 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No submissions yet</h3>
          <p className="mt-1 text-sm text-slate-500">Participants will appear here after they submit this quiz.</p>
        </div>
      ) : visibleParticipants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          No participants match these filters.
        </div>
      ) : (
        <div className="space-y-5">
          {dayGroups.map(([day, dayParticipants]) => {
            const times = dayParticipants
              .map((participant) => new Date(participant.createdAt).getTime())
              .filter(Number.isFinite);
            const earliest = times.length
              ? new Date(Math.min(...times)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "";
            const latest = times.length
              ? new Date(Math.max(...times)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <section key={day} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{submissionDayLabel(day)}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Submissions between {earliest} and {latest}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold tabular-nums text-slate-700">
                    {dayParticipants.length} {dayParticipants.length === 1 ? "submission" : "submissions"}
                  </span>
                </header>
                <div className="p-2 sm:p-3">
                  <QuizParticipants
                    quizId={quizId}
                    questions={questions}
                    participants={dayParticipants}
                    date={submissionDayLabel(day)}
                    cb={() => undefined}
                    onDelete={onDelete}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

const QuizParticipants = ({
  quizId,
  questions,
  participants,
  date,
  cb,
  onDelete,
}: {
  quizId: string;
  questions: IQuestion[];
  participants: IQuizParticipant[];
  date: string;
  cb: (date: string, id: string, key: string, value: string) => void;
  onDelete: (participantId: string) => Promise<boolean>;
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
      updatedParticipant.percentile = (
        sortedData.length <= 1 ? 100 : ((sortedData.length - (index + 1)) / (shortedParticipants.length - 1)) * 100
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
      const sortedData = [...shortedParticipants].sort((a, b) =>
        (a.User.name || a.User.email || "").localeCompare(b.User.name || b.User.email || ""),
      );
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
              <Switch id="show-disqualified" checked={showDisqualified} onCheckedChange={setShowDisqualified} />
              <Label htmlFor="show-disqualified">{showDisqualified ? "Hide Disqualified" : "Show Disqualified"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="sort-participants" checked={sortedByName} onCheckedChange={setSortedByName} />
              <Label htmlFor="sort-participants">Sort</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-percentile" checked={showPercentile} onCheckedChange={setShowPercentile} />
              <Label htmlFor="show-percentile">Percentile</Label>
            </div>
          </div>
        </div>
      )}

      <Accordion type="multiple">
        {shortedParticipants.map((participant, index) => (
          <Participant
            key={participant.id}
            data={participant}
            questions={questions}
            index={index}
            date={date}
            cb={cb}
            onDelete={onDelete}
          />
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
  onDelete,
}: {
  data: IQuizParticipant;
  questions: IQuestion[];
  index: number;
  date: string;
  cb: (date: string, id: string, key: string, value: string) => void;
  onDelete: (participantId: string) => Promise<boolean>;
}) => {
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      const escapedParticipantName = (data.User.name || data.User.email || "Participant").replace(
        /[&<>\"']/g,
        (character) => {
          const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          };
          return entities[character] || character;
        },
      );

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
      a.download = `${data.User.name || data.User.email || "participant"}.pdf`;
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
      <div className="flex items-center gap-1.5">
        <AccordionTrigger className="min-w-0 flex-1 p-2 text-left hover:no-underline">
          <div className="mr-2 flex w-full min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate">
              {index + 1}. {data.User.name}{" "}
              {!data.isQualified && <span className="text-red-600 text-xs">- Disqualified</span>}
            </span>
            {data.percentile && (
              <span className="flex shrink-0 items-start">
                {data.percentile}
                <span className="ml-[2px] mt-[-2px] text-[10px]">th</span>
              </span>
            )}
          </div>
        </AccordionTrigger>
        <Dialog open={deleteDialogOpen} onOpenChange={(nextOpen) => !isDeletingParticipant && setDeleteDialogOpen(nextOpen)}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
              title="Delete participant and all answers"
              aria-label={`Delete participant ${data.User.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-1.25rem)] rounded-2xl border-slate-200 sm:max-w-md">
            <DialogHeader>
              <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle>Delete this participant?</DialogTitle>
              <DialogDescription>
                This permanently deletes {data.User.name || data.User.email || "this participant"}’s submission, every stored
                answer, and all custom participant fields. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeletingParticipant}
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeletingParticipant}
                className="rounded-xl"
                onClick={async () => {
                  setIsDeletingParticipant(true);
                  try {
                    const deleted = await onDelete(data.id);
                    if (deleted) setDeleteDialogOpen(false);
                  } finally {
                    setIsDeletingParticipant(false);
                  }
                }}
              >
                {isDeletingParticipant ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete participant
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
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
