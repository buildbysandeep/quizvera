"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { error } from "@/lib/utils";
import { IImage } from "@/types";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { ImagePlus, RefreshCw, UploadCloud } from "lucide-react";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

const ImageUplaod = ({
  type,
  images,
  setImages,
  edit = false,
}: {
  type: string;
  edit?: boolean;
  images: IImage[];
  setImages: React.Dispatch<React.SetStateAction<IImage[]>>;
}) => {
  const image = images.find((img) => img.key === type);
  const inputId = `${type}-image-upload`;
  const createdObjectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const objectUrls = createdObjectUrls.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Reset the input so selecting the same file again triggers onChange.
    input.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Please select a valid image file");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      error("Image size should be less than 1MB");
      return;
    }

    // Revoke a previous local preview for this same image slot.
    if (image?.url?.startsWith("blob:") && createdObjectUrls.current.has(image.url)) {
      URL.revokeObjectURL(image.url);
      createdObjectUrls.current.delete(image.url);
    }

    const previewUrl = URL.createObjectURL(file);
    createdObjectUrls.current.add(previewUrl);

    const updatedImage: IImage = {
      key: type,
      file,
      url: previewUrl,
    };

    setImages((previous) => {
      const existingIndex = previous.findIndex((item) => item.key === type);
      if (existingIndex === -1) return [...previous, updatedImage];

      return previous.map((item, index) => (index === existingIndex ? updatedImage : item));
    });
  };

  return (
    <div className="w-full min-w-0 relative">
      <Input
        type="file"
        id={inputId}
        accept="image/*"
        className="sr-only"
        onChange={handleImageChange}
        aria-describedby={`${inputId}-hint`}
      />

      <Label htmlFor={inputId} className="group block cursor-pointer select-none">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md group-focus-within:ring-2 group-focus-within:ring-indigo-500 group-focus-within:ring-offset-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                <ImagePlus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {type === "left" ? "Left cover image" : type === "right" ? "Right cover image" : `${type} image`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{image ? "Image selected" : "Optional quiz artwork"}</p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
              {image ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  Upload
                </>
              )}
            </span>
          </div>

          <AspectRatio ratio={2.7 / 1}>
            {image ? (
              <div className="relative h-full w-full bg-slate-50 p-2.5">
                <Image
                  src={image.url}
                  quality={80}
                  priority
                  alt={`${type} quiz cover image`}
                  width={720}
                  height={270}
                  sizes="(max-width: 640px) 100vw, 360px"
                  unoptimized={image.url.startsWith("blob:")}
                  className="h-full w-full rounded-lg object-contain"
                />
                <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex justify-end">
                  <span className="rounded-md border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">
                    Preview
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-indigo-50/50 px-3 text-center transition-colors group-hover:from-indigo-50/70 group-hover:to-violet-50/70">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Choose an image to upload</p>
                <p className="text-[10px] text-slate-500">JPG, PNG, WebP · Max 1 MB</p>
              </div>
            )}
          </AspectRatio>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-2.5 sm:px-4">
            <p id={`${inputId}-hint`} className="text-[10px] leading-4 text-slate-500">
              Recommended ratio 2.7:1
            </p>
            <span className="text-[10px] font-medium text-slate-400">{edit ? "Edit quiz" : "New quiz"}</span>
          </div>
        </div>
      </Label>
    </div>
  );
};

export default ImageUplaod;
