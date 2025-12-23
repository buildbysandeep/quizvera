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
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle, ChevronDown, Download, Loader2, XCircle } from "lucide-react";
import { convertJsonToCsv, downloadFile } from "@/lib/download";
import { SiGmail } from "react-icons/si";
import { successResultWithNote } from "@/lib/templates/success-result-with-note";
import { rejectResultWithNote } from "@/lib/templates/rejectResult";
import GenerateQuestions from "@/components/dialogs/GenerateQuestions";

const Page = ({ searchParams }: { searchParams: { id: string } }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<IQuiz | null>(null);

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
    <Tabs defaultValue="details" className="w-full p-2">
      <TabsList className="w-full">
        <TabsTrigger value="details" className="w-full">
          Details
        </TabsTrigger>
        <TabsTrigger value="participants" className="w-full">
          Participants
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <div className="w-full mx-auto max-w-6xl flex flex-col gap-5">
          <div className="flex items-center justify-between bg-muted rounded-lg px-2 shadow-md">
            <h1 className="md:text-xl font-semibold tracking-tight line-clamp-2">
              {data.title}
              {data.isStrictMode && <span className="text-red-600 ml-2 text-sm">(Strict Mode)</span>}
            </h1>
            <div className="flex gap-1">
              <Button variant={"ghost"} size={"icon"} className="text-blue-600 hover:bg-blue-100 hover:text-blue-600">
                <Link href={`/quiz/edit?id=${data.id}`}>
                  <Pencil1Icon className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant={"ghost"} size={"icon"} className="text-red-600 hover:bg-red-100 hover:text-red-600">
                <DeleteQuiz quizId={data.id} images={data.images || []} groupId={data.groupId} />
              </Button>
            </div>
          </div>

          <PublishQuiz id={data.id} isPublished={data.published} setData={setData} />

          <QuizHeader title={data.title} images={data.images || []} editable />
          <UserInputs inputs={data.userInputs} editable />
          <QuizInfo duration={data.duration} maxMarks={data.maxMarks} editable />
          <QuizDesc desc={data.desc} editable />

          <div className="flex gap-2">
            <GenerateQuestions quizId={data.id} />

            <AddQuestion
              quizId={data.id}
              data={data}
              setData={setData}
              translate={{ enable: data.translationEnabled, source: data.sourceLanguage, target: data.targetLanguage }}
            />
          </div>

          <QuizQuestions questions={data.questions} data={data} setData={setData} />

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
      </TabsContent>
      <TabsContent value="participants">
        <QuizHistory quizId={searchParams.id} questions={data.questions} />
      </TabsContent>
    </Tabs>
  );
};

const QuizHistory = ({ quizId, questions }: { quizId: string; questions: IQuestion[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<{ [key: string]: IQuizParticipant[] }>({});

  const handleUpdateParticipant = (date: string, id: string, key: string, value: string) => {
    const participant = participants[date].find((participant) => participant.id === id);
    if (!participant) return;
    const newParticipant = { ...participant, [key]: value };
    const newParticipants = {
      ...participants,
      [date]: [...participants[date].filter((participant) => participant.id !== id), newParticipant],
    };
    setParticipants(newParticipants);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const res = await getQuizParticipantsDB({ quizId });
      setIsLoading(false);
      if (!res.ok) return error(res.error!);
      // @ts-ignore // set participants in date order
      const participants = res?.data?.reduce((acc: { [key: string]: IQuizParticipant[] }, participant: IQuizParticipant) => {
        const date = new Date(participant.createdAt).toDateString();
        return { ...acc, [date]: [...(acc[date] || []), participant] };
      }, {});
      // @ts-ignore
      setParticipants(participants);
    };
    fetchData();
  }, []);

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
            0
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
      []
    );

    // sort by correct answers
    const sortedData = correctAnswers.sort((a, b) => b.answers - a.answers);

    const updatedParticipants = sortedData.map((participant: { id: string; answers: number }, index: number) => {
      const updatedParticipant = { ...shortedParticipants.find((p) => p.id === participant.id) };
      updatedParticipant.percentile = (((sortedData.length - (index + 1)) / (shortedParticipants.length - 1)) * 100).toFixed(
        2
      );
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

  const [results, setResults] = useState<
    {
      id: string;
      title: string;
      options: IOption[];
      correctAnswer: string;
      userAnswer: string | null;
      isAttempted: boolean;
      isCorrect: boolean;
    }[]
  >([]);
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
        options: q.options,
        correctAnswer: q.answer,
        userAnswer,
        isAttempted: !!userAnswer,
        isCorrect: q.answer === userAnswer,
      };
    });
    setResults(res);
  }, [data]);

  const userInfoRef = useRef();
  const contentRef = useRef();

  const handleDownloadPdf = async () => {
    if (contentRef.current) {
      // Extract the HTML content of the element
      // @ts-ignore
      const userInfoHtml = userInfoRef.current.innerHTML;
      // @ts-ignore
      const elementHtml = contentRef.current.innerHTML;

      const htmlContent = `
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <h1 class="text-3xl mb-1">Hello, ${data.User.name}</h1>
          ${userInfoHtml}
          <h1 class="text-xl mt-5">Results</h1>
          ${elementHtml}
        </body>
      </html>
    `;

      setIsDownloading(true);
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (response.ok) {
        // Create a link to download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.User.name}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to generate PDF");
      }
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
        <div ref={userInfoRef}>
          <div className="grid grid-cols-2 gap-1 px-4">
            <p className="text-sm">
              <span className="font-medium">Phone:</span> {data.User.phone}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {data.User.email}
            </p>

            <p className="text-sm">
              <span className="font-medium">Question Answered:</span> {data.Answers.length}
            </p>
            <p className="text-sm">
              <span className="font-medium">Not Answered:</span> {questions.length - data.Answers.length}
            </p>
            <p className="text-sm">
              <span className="font-medium">Correct Answers:</span> {correctAnswers}
            </p>
            <p className="text-sm">
              <span className="font-medium">Incorrect Answers:</span> {incorrectAnswers}
            </p>

            <p className="text-sm">
              <span className="font-medium">Submitted on:</span> {data.createdAt.toLocaleString()}
            </p>
          </div>
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

          <div className={`${showResult ? "block" : "hidden"} max-h-[300px] overflow-y-scroll mt-3`}>
            {/* @ts-ignore */}
            <div ref={contentRef} className="mx-auto max-w-[1020px]">
              {results.map((res, index) => (
                <div
                  key={res.id}
                  className={`flex flex-col m-1 p-2 rounded-md ${
                    res.isCorrect && res.isAttempted ? "bg-green-50" : res.isAttempted ? "bg-red-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex gap-2 text-base font-medium">
                    <span>{index + 1}.</span>
                    <div>
                      <p>{res.title}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                    {res.options
                      .sort((a, b) => a.key.localeCompare(b.key))
                      .map((option, index) => (
                        <div key={option.id} className="flex items-start gap-2 text-sm">
                          <div>({option.key})</div>
                          {res.correctAnswer === option.key && <CheckCircle className="h-4 w-4 text-green-600 mt-[3px]" />}
                          {res.userAnswer !== res.correctAnswer && res.userAnswer === option.key && (
                            <XCircle className="h-4 w-4 text-red-500  mt-[3px]" />
                          )}
                          <div className="mt-[2px]">
                            <p className="leading-4">{option.value}</p>
                            <p className="text-xs leading-[18px] mt-1">{option.translatedValue}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default Page;
