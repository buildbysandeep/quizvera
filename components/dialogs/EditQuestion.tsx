import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { error, success, translateTextApi } from "@/lib/utils";
import { updateQuestionDB } from "@/lib/actions/quiz.actions";
import { IQuestion, IQuiz } from "@/types";
import { Pencil2Icon, ReloadIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { CodeBlock, isSupported } from "../shared/CodeBlock";
import { Switch } from "../ui/switch";

const EditQuestion = ({
  question,
  data,
  setData,
}: {
  question: IQuestion;
  data: IQuiz | null;
  setData?: React.Dispatch<React.SetStateAction<IQuiz | null>>;
}) => {
  const translate = {
    enable: data?.translationEnabled,
    source: data?.sourceLanguage,
    target: data?.targetLanguage,
  };
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState(question.title);
  const [translatedTitle, setTranslatedTitle] = React.useState(question.translatedTitle);
  const [showSnippet, setShowSnippet] = React.useState(question.showSnippet ? true : false);
  const [snippet, setSnippet] = React.useState(question.snippet);
  const [snippetLang, setSnippetLang] = React.useState(question.snippetLang);
  const [translateLoading, setTranslateLoading] = React.useState(false);
  const [options, setOptions] = React.useState<{ id: string; key: string; value: string; translatedValue: string }[]>(
    question.options,
  );
  const [answer, setAnswer] = React.useState(question.answer);

  const handleSubmit = async () => {
    if (!title) {
      error("Please add the question");
      return;
    }
    if (options.some((option) => !option.value)) {
      error("Please add all options");
      return;
    }
    if (!answer) {
      error("Please select an answer");
      return;
    }

    if (showSnippet && !snippet && !snippetLang) {
      error("Please add the snippet and snippet language");
      return;
    }

    if (showSnippet && !isSupported(snippetLang)) {
      error("Please select a supported snippet language");
      return;
    }

    // add question
    setLoading(true);
    const res = await updateQuestionDB({
      title,
      translatedTitle,
      showSnippet: showSnippet,
      snippet,
      snippetLang,
      options,
      answer,
      questionId: question.id,
    });
    setLoading(false);
    if (!res.ok) return error(res.error!);

    // update question
    const updatedQuestions = data ? data.questions.map((q: IQuestion) => (q.id === question.id ? res.data : q)) : [];
    setData && setData({ ...data, questions: updatedQuestions } as IQuiz);
    setOpen(false);
    success("Question updated successfully");
  };

  // const handleTranslate = async () => {
  //   if (translate.source && translate.target) {
  //     setTranslateLoading(true);
  //     try {
  //       if (title) setTranslatedTitle(await translateTextApi(title, translate.source, translate.target));
  //       const translatedOptions = options.map(async (option) => {
  //         if (option.value)
  //           return {
  //             ...option,
  //             translatedValue: await translateTextApi(option.value, translate.source!, translate.target!),
  //           };
  //         return option;
  //       });
  //       setOptions(await Promise.all(translatedOptions));
  //     } catch (err: any) {
  //       error("Translation failed");
  //     } finally {
  //       setTranslateLoading(false);
  //     }
  //   }
  // };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Pencil2Icon className="w-4 h-4" />
      </DialogTrigger>
      <DialogDescription className="sr-only">Add Question</DialogDescription>
      <DialogContent>
        <DialogTitle className="sr-only">Add Question</DialogTitle>
        <div className="grid items-center gap-1.5">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="question"
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-medium"
          />
          {translatedTitle && (
            <Textarea
              rows={2}
              id="question"
              placeholder="question"
              value={translatedTitle}
              onChange={(e) => setTranslatedTitle(e.target.value)}
              className="w-full font-medium"
            />
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="strict-mode"
              checked={showSnippet}
              onCheckedChange={(checked) => {
                setShowSnippet(checked);
              }}
            />
            <Label htmlFor="strict-mode">{showSnippet ? "Remove" : "Add"} Snippet</Label>
          </div>
          {showSnippet && (
            <>
              <div>
                <Label htmlFor="snippetLang">Snippet Language</Label>
                <Input
                  id="snippetLang"
                  placeholder="JavaScript | Python"
                  value={snippetLang}
                  onChange={(e) => setSnippetLang(e.target.value.toLowerCase())}
                />
              </div>
              <div>
                <Label htmlFor="snippetLang">Snippet</Label>
                <Textarea
                  rows={1}
                  id="snippet"
                  placeholder="snippet"
                  value={snippet}
                  onChange={(e) => setSnippet(e.target.value)}
                  className="w-full font-medium [field-sizing:content]"
                />
              </div>
            </>
          )}
          {/* {question.snippet && (
            <Textarea
              rows={1}
              id="snippet"
              placeholder="snippet"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              className="w-full font-medium [field-sizing:content]"
            />
          )} */}
        </div>
        <div className="grid items-center gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="question">Options</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-1">
                <Label htmlFor="option1">({o.key})</Label>
                <div className="flex flex-col gap-1">
                  <Input
                    id="option1"
                    placeholder={`option ${i + 1}`}
                    value={o.value}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[i].value = e.target.value;
                      setOptions(newOptions);
                    }}
                    className="w-full"
                  />
                  {o.translatedValue && (
                    <Input
                      id="option1"
                      placeholder={`option ${i + 1}`}
                      value={o.translatedValue}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[i].translatedValue = e.target.value;
                        setOptions(newOptions);
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid items-center gap-1.5">
          <Label htmlFor="answer">Correct Answer</Label>
          <RadioGroup value={answer} onValueChange={setAnswer} className="flex">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="a" />
              <Label htmlFor="a">(a)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="b" />
              <Label htmlFor="b">(b)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="c" />
              <Label htmlFor="c">(c)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="d" id="d" />
              <Label htmlFor="d">(d)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex items-center gap-1.5 mt-5">
          {/* {translate.enable && (
            <Button onClick={handleTranslate} disabled={!Boolean(title) || options.some((o) => !o.value)}>
              {translateLoading ? <ReloadIcon className="w-3 h-3 animate-spin mr-2" /> : ""} Translate
            </Button>
          )} */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={
              loading ||
              !Boolean(title) ||
              options.some((o) => !o.value) ||
              (data?.translationEnabled && (!Boolean(translatedTitle) || options.some((o) => !o.translatedValue)))
            }
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestion;
