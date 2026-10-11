"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, Search, ShieldCheck, Trash2, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loading from "@/components/shared/Loading";
import { error, success, uploadImageAPI } from "@/lib/utils";

type LibraryImage = {
  id: string;
  publicId: string;
  url: string;
  createdAt: string;
  usageCount: number;
  profileUsageCount?: number;
  usedIn: { id: string; slug: string | null; title: string }[];
};
type Filter = "all" | "used" | "unused";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ImageLibraryPage() {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<LibraryImage | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/image", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not load image library.");
      setImages(Array.isArray(payload.data) ? payload.data : []);
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not load image library.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const isImageInUse = (image: LibraryImage) => image.usageCount > 0;
  const usedCount = images.filter(isImageInUse).length;
  const unusedCount = images.length - usedCount;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleImages = useMemo(() => images.filter((image) => {
    const matchesQuery = !normalizedQuery || image.publicId.toLowerCase().includes(normalizedQuery) ||
      image.usedIn.some((quiz) => quiz.title.toLowerCase().includes(normalizedQuery));
    const matchesFilter = filter === "all" || (filter === "used" ? isImageInUse(image) : !isImageInUse(image));
    return matchesQuery && matchesFilter;
  }), [images, normalizedQuery, filter]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      error("Upload a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      error("Image size must be 5 MB or smaller.");
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadImageAPI(file);
      if (!result?.ok || !result.data?.public_id || !result.data?.secure_url) throw new Error(result?.error || "Image upload failed.");
      await refresh();
      success("Image uploaded to your library.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    const image = deleteCandidate;
    if (!image || isImageInUse(image) || deleting) return;
    setDeleting(image.publicId);
    try {
      const params = new URLSearchParams({ public_ids: image.publicId });
      const response = await fetch(`/api/image?${params.toString()}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not delete this image.");
      setImages((current) => current.filter((item) => item.publicId !== image.publicId));
      setDeleteCandidate(null);
      success(payload.warning || "Image removed from your library.");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not delete this image.");
      await refresh();
    } finally {
      setDeleting(null);
    }
  };

  return <main className="mx-auto w-full max-w-[1440px] space-y-6 p-3 sm:p-5 lg:p-7">
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
      <div className="max-w-2xl"><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700"><ImageIcon className="h-3.5 w-3.5" /> Asset workspace</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Image library</h1><p className="mt-2 text-sm leading-6 text-slate-500">Reuse cover images across quizzes. Check where each asset is used before removing it from the library.</p></div>
      <div className="flex flex-wrap items-center gap-2"><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUpload} /><Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="h-10 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{isUploading ? "Uploading…" : "Upload image"}</Button></div>
    </header>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">Total library assets</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{images.length}</p></div>
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><p className="text-xs font-medium text-indigo-700">Used by quizzes</p><p className="mt-2 text-2xl font-bold tabular-nums text-indigo-800">{usedCount}</p><p className="mt-1 text-[11px] text-indigo-700/70">Deletion blocked until usage reaches zero</p></div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"><p className="text-xs font-medium text-emerald-700">Unused assets</p><p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">{unusedCount}</p><p className="mt-1 text-[11px] text-emerald-700/70">Eligible for permanent deletion</p></div>
    </section>

    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search image or quiz name…" className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:ring-indigo-500" aria-label="Search image library" /></div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{([{value:"all",label:`All (${images.length})`},{value:"used",label:`In use (${usedCount})`},{value:"unused",label:`Unused (${unusedCount})`}] as const).map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{item.label}</button>)}</div>
    </div>

    {isLoading ? <div className="flex min-h-48 items-center justify-center"><Loading /></div> : visibleImages.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><ImageIcon className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-base font-semibold text-slate-900">{images.length ? "No images match this filter" : "Your library is empty"}</h2><p className="mt-1 text-sm text-slate-500">{images.length ? "Try another search or status filter." : "Upload an image once and reuse it across all your quizzes."}</p></div> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleImages.map((image) => <article key={image.publicId} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md">
        <div className="relative bg-slate-50 p-3"><div className="relative aspect-[2/1] w-full"><Image src={image.url} alt="Quiz library image" fill sizes="(max-width: 768px) 100vw, 420px" unoptimized className="object-contain" /></div><span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isImageInUse(image) ? "border-indigo-200 bg-white/95 text-indigo-700" : "border-emerald-200 bg-white/95 text-emerald-700"}`}>{isImageInUse(image) ? <ShieldCheck className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}{image.usageCount} {image.usageCount === 1 ? "quiz" : "quizzes"}</span></div>
        <div className="flex flex-1 flex-col p-4"><p className="break-all text-xs font-semibold text-slate-800">{image.publicId.split("/").slice(-1)[0]}</p><p className="mt-1 text-[11px] text-slate-400">Added {new Date(image.createdAt).toLocaleDateString()}</p>
          <div className="mt-3 flex-1 space-y-2">{isImageInUse(image) ? <>{image.usageCount > 0 ? <><p className="text-xs font-semibold text-slate-700">Used in quizzes</p>{image.usedIn.length ? <div className="space-y-1.5">{image.usedIn.map((quiz) => <Link key={`${quiz.id}-${quiz.slug}`} href={quiz.slug ? `/quiz/${quiz.slug}` : `/quiz/${quiz.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><span className="truncate">{quiz.title}</span><ExternalLink className="h-3 w-3 shrink-0" /></Link>)}</div> : <p className="text-xs text-slate-500">Referenced by {image.usageCount} {image.usageCount === 1 ? "quiz" : "quizzes"} you may not have direct access to.</p>}</> : null}<p className="flex items-start gap-1.5 text-[11px] leading-5 text-amber-700"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> This image cannot be deleted while any quiz references it.</p></> : <p className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Not attached to any quiz. Safe to delete.</p>}</div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-[10px] text-slate-400">{isImageInUse(image) ? "In use · reusable" : "Unused asset"}</span><Button type="button" variant="outline" size="sm" disabled={isImageInUse(image) || deleting === image.publicId} onClick={() => setDeleteCandidate(image)} title={isImageInUse(image) ? "Detach from quizzes or change the profile picture before deleting" : "Permanently delete unused image"} className="gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45">{deleting === image.publicId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isImageInUse(image) ? <XCircle className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}{isImageInUse(image) ? "In use" : "Delete"}</Button></div>
        </div>
      </article>)}
    </section>}
    <Dialog open={Boolean(deleteCandidate)} onOpenChange={(open) => { if (!deleting && !open) setDeleteCandidate(null); }}>
      <DialogContent className="w-[calc(100%-1.25rem)] rounded-2xl border-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100"><Trash2 className="h-5 w-5" /></div>
          <DialogTitle>Delete this image permanently?</DialogTitle>
          <DialogDescription>This removes the image from your personal library. Quizvera blocks removal while any quiz references it. The Cloudinary asset is deleted only when no quiz or other personal library still references it.</DialogDescription>
        </DialogHeader>
        {deleteCandidate ? <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={deleteCandidate.url} alt="Image selected for deletion" fill sizes="96px" unoptimized className="object-contain" /></div><div className="min-w-0"><p className="break-all text-sm font-semibold text-slate-900">{deleteCandidate.publicId.split("/").slice(-1)[0]}</p><p className="mt-1 text-xs text-emerald-700">No quiz or profile references detected</p></div></div> : null}
        <DialogFooter className="gap-2 sm:gap-2"><Button type="button" variant="outline" onClick={() => setDeleteCandidate(null)} disabled={Boolean(deleting)} className="rounded-xl">Cancel</Button><Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={Boolean(deleting) || !deleteCandidate || (deleteCandidate ? isImageInUse(deleteCandidate) : true)} className="rounded-xl">{deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete image</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </main>;
}
