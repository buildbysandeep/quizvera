import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IParticipantQuizAnswer, IQuestion } from "@/types";
import React, { useCallback, useEffect, useRef } from "react";

const QuizQuestions = ({
  translationEnabled,
  questions,
  answers,
  setAnswers,
}: {
  translationEnabled: boolean;
  questions: IQuestion[];
  answers: IParticipantQuizAnswer[];
  setAnswers: React.Dispatch<React.SetStateAction<IParticipantQuizAnswer[]>>;
}) => {
  const clickHandler = useCallback((questionId: string, selectedOption: string) => {
    setAnswers((prevAnswers) => {
      const existingAnswerIndex = prevAnswers.findIndex((answer) => answer.questionId === questionId);

      if (existingAnswerIndex !== -1) {
        // Replace the answer for this question
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = {
          questionId,
          answer: selectedOption,
        };
        return updatedAnswers;
      } else {
        // Add a new answer for this question
        return [...prevAnswers, { questionId, answer: selectedOption }];
      }
    });
  }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
      {questions.map((question, index) => (
        <Question
          key={question.id}
          question={question}
          index={index}
          answers={answers}
          clickHandler={clickHandler}
          translationEnabled={translationEnabled}
        />
      ))}
    </div>
  );
};

const Question = ({
  question,
  index,
  answers,
  clickHandler,
  translationEnabled,
}: {
  question: IQuestion;
  index: number;
  answers: IParticipantQuizAnswer[];
  clickHandler: (questionId: string, selectedOption: string) => void;
  translationEnabled: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question.title]);

  return (
    <div className={`flex flex-col gap-1 group relative rounded`}>
      <div className="flex flex-col font-medium">
        <div className="flex gap-2 text-base ">
          <span>{index + 1}.</span>
          <textarea
            ref={textareaRef}
            readOnly
            rows={1}
            className="w-full font-medium resize-none overflow-hidden outline-none"
          >
            {question.title}
          </textarea>
        </div>
        <RadioGroup
          value={answers.find((answer) => answer.questionId === question.id)?.answer}
          className="grid grid-cols-1 xs:grid-cols-2 gap-0"
        >
          {question.options
            .sort((a, b) => a.key.localeCompare(b.key))
            .map((option, index) => (
              <Label
                key={`${question.id}-${option.key}`}
                className="flex items-start gap-1.5 text-sm quiz cursor-pointer w-full p-2 hover:bg-gray-100 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  clickHandler(question.id, option.key);
                }}
                id={`${question.id}-${option.key}`}
              >
                <RadioGroupItem
                  checked={answers.find((answer) => answer.questionId === question.id)?.answer === option.key}
                  value={option.key}
                  id={`${question.id}-${option.key}`}
                  className="h-4 w-4"
                />
                <span className="mt-[-2px]">({option.key})</span>
                <div className="">
                  <Label htmlFor={option.key}>
                    <p className="leading-4">{option.value}</p>
                  </Label>
                </div>
              </Label>
            ))}
        </RadioGroup>
      </div>

      {translationEnabled && (
        <div className="flex flex-col">
          <div className="flex gap-2 font-semibold items-end">
            <span>{index + 1}.</span>
            <p className="text-[13px] leading-5">{question.translatedTitle}</p>
          </div>
          <RadioGroup
            value={answers.find((answer) => answer.questionId === question.id)?.answer}
            className="grid grid-cols-1 xs:grid-cols-2 gap-0"
          >
            {question.options
              .sort((a, b) => a.key.localeCompare(b.key))
              .map((option, index) => (
                <Label
                  key={`${question.id}-${option.key}`}
                  className="flex items-start gap-1.5 text-sm quiz cursor-pointer w-full px-2 py-1 hover:bg-gray-100 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    clickHandler(question.id, option.key);
                  }}
                  id={`${question.id}-${option.key}`}
                >
                  <RadioGroupItem
                    checked={answers.find((answer) => answer.questionId === question.id)?.answer === option.key}
                    value={option.key}
                    id={`${question.id}-${option.key}`}
                    className="h-4 w-4 mt-0.5"
                  />
                  <span className="">({option.key})</span>
                  <div className="">
                    <Label htmlFor={option.key}>
                      <p className="text-[13px] leading-5 mt-[2px]">{option.translatedValue}</p>
                    </Label>
                  </div>
                </Label>
              ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

export default QuizQuestions;
