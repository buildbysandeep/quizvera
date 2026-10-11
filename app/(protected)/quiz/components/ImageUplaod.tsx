"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, RefreshCw, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { error } from "@/lib/utils";
import { uploadImageAPI } from "@/lib/utils";

type QuizImage = { key: string; publicId?: string; file?: File; url: string };
type LibraryImage = { id: string; publicId: string; url: string; createdAt: string; usageCount?: number; usedIn?: { id: string; slug: string | null; title: string }[] };

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ImageUplaod = ({
  type,
  images,
  setImages,
  edit = false,
}: {
  type: "left" | "right";
  edit?: boolean;
  images: QuizImage[];
  setImages: React.Dispatch<React.SetStateAction<QuizImage[]>>;
}) => {
  const image = images.find((img) => img.key === type);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadLibrary = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/image", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load your image library.");
        if (!cancelled) setLibrary(Array.isArray(payload.data) ? payload.data : []);
      } catch (cause) {
        if (!cancelled) error(cause instanceof Error ? cause.message : "Unable to load your image library.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadLibrary();
    return () => { cancelled = true; };
  }, [open]);

  const selectImage = (selected: { publicId: string; url: string }) => {
    setImages((previous) => {
      const next: QuizImage = { key: type, publicId: selected.publicId, url: selected.url };
      const existingIndex = previous.findIndex((item) => item.key === type);
      if (existingIndex === -1) return [...previous, next];
      return previous.map((item, index) => index === existingIndex ? next : item);
    });
    setOpen(false);
  };

  const uploadNewImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      error("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      error("Image size should be 5 MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const payload = await uploadImageAPI(file);
      if (!payload?.ok || !payload?.data?.public_id || !payload?.data?.secure_url) {
        throw new Error(payload?.error || "Unable to upload this image.");
      }
      const fresh = {
        id: payload.data.public_id,
        publicId: payload.data.public_id,
        url: payload.data.secure_url,
        createdAt: new Date().toISOString(),
      } as LibraryImage;
      setLibrary((previous) => [fresh, ...previous.filter((item) => item.publicId !== fresh.publicId)]);
      selectImage({ publicId: fresh.publicId, url: fresh.url });
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Unable to upload this image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative w-full min-w-0">
        <button type="button" onClick={() => setOpen(true)} className="group block w-full cursor-pointer select-none text-left">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{type === "left" ? "Left cover image" : "Right cover image"}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{image ? "Image selected from your library" : "Choose or reuse quiz artwork"}</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                {image ? <><RefreshCw className="h-3.5 w-3.5" /> Change</> : <><UploadCloud className="h-3.5 w-3.5" /> Choose image</>}
              </span>
            </div>
            <AspectRatio ratio={2.7 / 1}>
              {image ? (
                <div className="relative h-full w-full bg-slate-50 p-2.5">
                  <Image src={image.url} quality={80} alt={`${type} quiz cover image`} width={720} height={270} sizes="(max-width: 640px) 100vw, 360px" unoptimized={image.url.startsWith("blob:")} className="h-full w-full rounded-lg object-contain" />
                  <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex justify-end"><span className="rounded-md border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">Preview</span></div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-indigo-50/50 px-3 text-center transition-colors group-hover:from-indigo-50/70 group-hover:to-violet-50/70">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600"><UploadCloud className="h-5 w-5" /></div>
                  <p className="text-xs font-semibold text-slate-700">Choose from your image library</p>
                  <p className="text-[10px] text-slate-500">JPG, PNG, WebP or GIF · Max 5 MB</p>
                </div>
              )}
            </AspectRatio>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-2.5 sm:px-4">
              <p className="text-[10px] leading-4 text-slate-500">Recommended ratio 2.7:1</p>
              <span className="text-[10px] font-medium text-slate-400">{edit ? "Edit quiz" : "New quiz"}</span>
            </div>
          </div>
        </button>
        {image ? <button type="button" onClick={() => setImages((previous) => previous.filter((item) => item.key !== type))} className="mt-2 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-rose-700 hover:underline">Remove this image</button> : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86vh] w-[calc(100%-1.25rem)] max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-xl">Choose a {type} cover image</DialogTitle>
            <DialogDescription className="text-left">Reuse an image you have uploaded before, or add a new image to your personal Quizvera library.</DialogDescription>
          </DialogHeader>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={uploadNewImage} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-900">Your image library</p><p className="mt-0.5 text-xs text-slate-500">Reuse existing art across quizzes. Removing a selection only clears this quiz slot.</p></div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild className="gap-2 rounded-xl"><a href="/image-library" target="_blank" rel="noreferrer"><ImageIcon className="h-4 w-4" /> Manage library</a></Button>
              <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {isUploading ? "Uploading…" : "Upload new image"}
              </Button>
            </div>
          </div>
          {image ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3"><div><p className="text-sm font-semibold text-amber-900">Selected for the {type} slot</p><p className="mt-0.5 text-xs text-amber-800">Remove it from this quiz without deleting it from your library.</p></div><Button type="button" variant="outline" onClick={() => { setImages((previous) => previous.filter((item) => item.key !== type)); setOpen(false); }} className="gap-2 rounded-xl border-amber-200 bg-white text-amber-800 hover:bg-amber-100"><X className="h-4 w-4" /> Remove from quiz</Button></div> : null}
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your images…</div>
          ) : library.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center"><ImagePlus className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">Your library is empty</p><p className="mt-1 text-xs text-slate-500">Upload an image and you can reuse it in every quiz.</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {library.map((item) => {
                const selected = image?.publicId === item.publicId;
                return (
                  <button key={item.publicId} type="button" onClick={() => selectImage({ publicId: item.publicId, url: item.url })} className={`group relative min-w-0 overflow-hidden rounded-xl border bg-white text-left transition hover:border-indigo-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selected ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}>
                    <AspectRatio ratio={1.7}>
                      <Image src={item.url} alt="Saved quiz artwork" width={320} height={180} sizes="(max-width: 640px) 50vw, 200px" className="h-full w-full object-contain p-2" />
                    </AspectRatio>
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2.5 py-2"><span className="truncate text-[10px] font-medium text-slate-600">{item.usageCount ?? 0} {(item.usageCount ?? 0) === 1 ? "quiz" : "quizzes"}</span>{selected ? <Check className="h-4 w-4 shrink-0 text-indigo-600" /> : <span className="text-[10px] font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">Select</span>}</div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageUplaod;
