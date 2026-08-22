import DeleteQuestion from "@/components/dialogs/DeleteQuestion";
import EditQuestion from "@/components/dialogs/EditQuestion";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { IQuestion, IQuiz } from "@/types";
import React from "react";

const QuizQuestions = ({
  questions,
  data,
  setData,
}: {
  questions: IQuestion[];
  data: IQuiz | null;
  setData?: React.Dispatch<React.SetStateAction<IQuiz | null>>;
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {questions.map((question, index) => (
        <div key={question.id}>
          <div className={`flex flex-col gap-2 group relative p-2 rounded border border-gray-400 hover:border-black pb-5`}>
            <div className="hidden absolute top-1 right-1 group-hover:block cursor-pointer">
              <EditQuestion question={question} data={data} setData={setData} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-base font-medium">
                <span>{index + 1}.</span>
                <div className="min-w-0 w-full">
                  <p>{question.title}</p>
                  {question.showSnippet && (
                    <CodeBlock lang={question.snippetLang || "plaintext"}>{question.snippet}</CodeBlock>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                {question.options
                  .sort((a, b) => a.key.localeCompare(b.key))
                  .map((option, index) => (
                    <div key={option.id} className="flex gap-2 text-sm items-top">
                      <span className="mt-[-2px]">({option.key})</span>
                      <p className="leading-4">{option.value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {data?.translationEnabled && (
              <div className="flex flex-col gap-1 border-t border-dashed border-gray-500 pt-2">
                <div className="flex gap-2 text-base font-medium">
                  {/* <span>-</span> */}
                  <p className="text-[14px]">{question.translatedTitle}</p>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                  {question.options
                    .sort((a, b) => a.key.localeCompare(b.key))
                    .map((option, index) => (
                      <div key={option.id} className="flex gap-2 text-[13px] items-start">
                        <span className="mt-[-2px]">({option.key})</span>
                        <p className="leading-5">{option.translatedValue}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="">
              <p className="text-sm absolute bottom-1 left-1">Answer: {question.answer}</p>
              <div className="hidden absolute bottom-1 right-1 group-hover:block cursor-pointer">
                <DeleteQuestion questionId={question.id} data={data} setData={setData} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizQuestions;
