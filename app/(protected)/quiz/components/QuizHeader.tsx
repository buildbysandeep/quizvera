import { AspectRatio } from "@/components/ui/aspect-ratio";
import { IImage } from "@/types";
import Image from "next/image";
import React from "react";

const QuizHeader = ({ title, images, editable }: { title: string; images: IImage[]; editable?: boolean }) => {
  const leftImage = images?.find((image) => image.key === "left");
  const rightImage = images?.find((image) => image.key === "right");

  const renderImageSlot = (image: IImage | undefined, label: string) => {
    if (!image && !editable) return <div className="min-w-0" />;

    return (
      <AspectRatio
        ratio={2.7 / 1}
        className={`overflow-hidden rounded-xl border bg-slate-50 ${
          image ? "border-slate-200" : "border-dashed border-slate-300"
        }`}
      >
        {image ? (
          <Image
            src={image.url}
            quality={85}
            priority
            alt={`${label} quiz image`}
            width={0}
            height={0}
            sizes="(max-width: 640px) 30vw, 240px"
            className="h-full w-full rounded-xl object-contain"
          />
        ) : (
          <div className="grid h-full w-full place-items-center px-1 text-center text-[10px] font-medium text-slate-400 sm:text-xs">
            {label}
          </div>
        )}
      </AspectRatio>
    );
  };

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5 bg-slate-900" />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] items-center gap-2 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5">
        <div className="min-w-0">{renderImageSlot(leftImage, "Left image")}</div>

        <div className="flex min-w-0 justify-center">
          <div className="max-w-full rounded-xl border border-indigo-100 bg-indigo-50/70 px-2.5 py-2 text-center sm:px-4 sm:py-3">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-500 sm:text-[10px]">
              Assessment
            </p>
            <h1 className="break-words text-sm font-bold leading-5 tracking-tight text-slate-900 sm:text-xl sm:leading-7 md:text-2xl">
              {title || (editable ? "Quiz title" : "")}
            </h1>
          </div>
        </div>

        <div className="min-w-0">{renderImageSlot(rightImage, "Right image")}</div>
      </div>
    </header>
  );
};

export default QuizHeader;
