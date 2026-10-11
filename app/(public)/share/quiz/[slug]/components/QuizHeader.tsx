import { AspectRatio } from "@/components/ui/aspect-ratio";
import { IImage } from "@/types";
import Image from "next/image";
import React from "react";
import { BookOpenCheck } from "lucide-react";

const QuizHeader = ({ title, images }: { title: string; images: IImage[] }) => {
  const leftImage = images?.find((image) => image.key === "left");
  const rightImage = images?.find((image) => image.key === "right");

  return (
    <header className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mb-6">
      <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-4 sm:gap-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          {leftImage ? (
            <AspectRatio ratio={2.7 / 1} className="relative w-full max-w-[190px] overflow-hidden">
              <Image
                src={leftImage.url}
                alt="Quiz logo"
                fill
                sizes="(max-width: 640px) 28vw, 190px"
                className="object-contain object-left"
                priority
              />
            </AspectRatio>
          ) : (
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpenCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] sm:inline">Assessment</span>
            </div>
          )}
        </div>

        <div className="max-w-[min(56vw,600px)] text-center">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-600 sm:text-[10px]">
            Quiz assessment
          </p>
          <h1 className="line-clamp-3 break-words text-sm font-bold leading-5 tracking-tight text-slate-950 sm:text-xl sm:leading-7 md:text-2xl">
            {title}
          </h1>
        </div>

        {/* make the picture on right side  */}
        <div className="flex min-w-0 justify-end">
          {rightImage ? (
            <AspectRatio ratio={2.7 / 1} className="relative w-full max-w-[190px] overflow-hidden justify-self-end">
              <Image
                src={rightImage.url}
                alt="Quiz logo"
                fill
                sizes="(max-width: 640px) 28vw, 190px"
                className="object-contain object-right"
                priority
              />
            </AspectRatio>
          ) : (
            <div className="hidden text-right text-[10px] font-medium text-slate-300 sm:block">
              Please read the instructions carefully
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;
