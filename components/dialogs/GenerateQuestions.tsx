import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2Icon } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { addQuestionDB } from "@/lib/actions/quiz.actions";
import { Label } from "../ui/label";
import { GiStarFormation } from "react-icons/gi";
import { error, success } from "@/lib/utils";

const GenerateQuestions = ({ quizId }: { quizId: string }) => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonText, setButtonText] = useState("Generate");

  const handleGenerate = async () => {
    try {
      if (!topic) {
        error("Please enter a topic");
        return;
      }

      if (!difficulty) {
        error("Please select a difficulty level");
        return;
      }

      setIsGenerating(true);
      setButtonText("Generating...");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, numQuestions }),
      });

      const data = await response.json();

      if (!response.ok || !data || data.error) {
        setIsGenerating(false);
        setButtonText("Generate");
        error("Failed to generate questions");
        return;
      }

      if (data && data.questions && data.questions.length > 0) {
        setQuizData(data.questions);
        setButtonText("Add all questions");
      }
    } catch {
      error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAllQuestions = async () => {
    if (!quizData) return;
    setIsGenerating(true);
    for (let i = 0; i < quizData.length; i++) {
      const question = quizData[i];
      if (question.title && question.options && question.answer) {
        setButtonText(`adding... ${i + 1}/${quizData.length}`);
        const res = await addQuestionDB({
          title: question.title,
          translatedTitle: question.translatedTitle,
          options: question.options,
          answer: question.answer,
          quizId,
        });
        if (!res.ok) error(res.error || "Failed to add question");
      }
    }
    setIsGenerating(false);
    success("Questions added successfully");
    window.location.reload();
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuizData((prevData) => prevData.filter((question) => question.id !== questionId));
  };

  useEffect(() => {
    if (difficulty && numQuestions && topic) {
      setButtonText("Generate");
    }
  }, [difficulty, numQuestions, topic]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild className="w-fit">
          <Button type="button" size={"sm"} className="group">
            <GiStarFormation className="w-4 h-4 mr-2 group-hover:rotate-180 duration-500" />
            Generate AI Questions
          </Button>
        </DialogTrigger>
        <DialogContent className={`${quizData.length > 0 ? "sm:max-w-3xl" : "sm:max-w-lg"}`} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Generate AI Quiz Questions</DialogTitle>
          </DialogHeader>
          <div className="">
            <div className="space-y-3">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="Enter Topic ex: HTML, CSS, JavaScript"
                  className="border p-2 w-full"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select Difficulty" defaultValue={difficulty} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  placeholder="Number of Questions"
                  className="border p-2 w-full"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                />
              </div>

              <Button
                onClick={buttonText !== "Add all questions" ? handleGenerate : handleAddAllQuestions}
                className=""
                disabled={isGenerating}
              >
                {isGenerating && <ReloadIcon className="mr-2 animate-spin" />}
                {buttonText}
              </Button>

              {quizData.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  It may take time to generate questions because it uses free Gemini API.
                </p>
              )}

              {quizData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 max-h-[400px] overflow-y-scroll">
                  {quizData?.map((question, index) => (
                    <div
                      key={question.id}
                      className={`flex flex-col gap-2 group relative p-2 rounded border border-background hover:border-gray-300 pb-5`}
                    >
                      <div className="hidden absolute top-1 right-1 group-hover:block cursor-pointer">
                        {/* <EditQuestion question={question} data={data} setData={setData} /> */}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2 text-base font-medium">
                          <span>{index + 1}.</span>
                          <p>{question.title}</p>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                          {question.options
                            .sort((a: any, b: any) => a.key.localeCompare(b.key))
                            .map((option: any, index: number) => (
                              <div key={option.id} className="flex gap-2 text-sm items-top break-words">
                                <span className="mt-[-2px]">({option.key})</span>
                                <p className="leading-4 break-all">{option.value}</p>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="">
                        <p className="text-sm absolute bottom-1 left-1">Answer: {question.answer}</p>
                        <div className="hidden absolute bottom-1 right-1 group-hover:block cursor-pointer">
                          <Trash2Icon className="w-4 h-4 text-red-500" onClick={() => handleDeleteQuestion(question.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GenerateQuestions;
