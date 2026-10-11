"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Check, CreditCard, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { error, success } from "@/lib/utils";

type Profile = { id: string; name: string | null; email: string; image: string | null; plan: "Free" };
const MAX_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Could not load profile.");
      setProfile(payload.data);
      setName(payload.data.name || "");
    } catch (cause) {
      error(cause instanceof Error ? cause.message : "Could not load profile.");
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const persist = async (values: { name: string; image?: string | null }) => {
    const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Profile update failed.");
    setProfile(payload.data);
    await update({ name: payload.data.name, image: payload.data.image });
    return payload.data as Profile;
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 120) { error("Name must be between 1 and 120 characters."); return; }
    setIsSaving(true);
    try { await persist({ name: cleanName }); success("Profile updated."); }
    catch (cause) { error(cause instanceof Error ? cause.message : "Profile update failed."); }
    finally { setIsSaving(false); }
  };

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget; const file = input.files?.[0]; input.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { error("Use a JPG, PNG, WebP, or GIF image."); return; }
    if (file.size <= 0 || file.size > MAX_SIZE) { error("Profile image must be 5 MB or smaller."); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", (name || profile?.name || "").trim());
      const response = await fetch("/api/profile", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Profile picture update failed.");
      setProfile(payload.data);
      setName(payload.data.name || "");
      await update({ name: payload.data.name, image: payload.data.image });
      success("Profile picture updated.");
    } catch (cause) { error(cause instanceof Error ? cause.message : "Profile picture update failed."); }
    finally { setIsUploading(false); }
  };

  const initials = (profile?.name || name || profile?.email || "U").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U";

  if (isLoading) return <main className="mx-auto flex min-h-64 w-full max-w-5xl items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></main>;

  return <main className="mx-auto w-full max-w-5xl space-y-6 p-3 sm:p-5 lg:p-7">
    <header><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700"><UserRound className="h-3.5 w-3.5" /> Account settings</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your profile</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage how your name and picture appear across Quizvera. Your login email is read-only.</p></header>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-slate-900">Personal information</h2><p className="mt-1 text-xs text-slate-500">Your profile is used in menus and shared quiz collaboration.</p></div>
        <div className="p-5 sm:p-6">
          <div className="mb-7 flex flex-wrap items-center gap-4"><div className="relative"><Avatar className="h-20 w-20 border border-slate-200 shadow-sm"><AvatarImage src={profile?.image || undefined} alt={profile?.name || "Profile picture"} /><AvatarFallback className="bg-indigo-100 text-lg font-bold text-indigo-700">{initials}</AvatarFallback></Avatar><span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-indigo-600 text-white"><Camera className="h-3.5 w-3.5" /></span></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">Profile picture</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Upload JPG, PNG, WebP or GIF. Maximum file size is 5 MB.</p><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleImage} /><Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()} className="mt-2 h-8 rounded-lg">{isUploading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Uploading…</> : <><Camera className="mr-2 h-3.5 w-3.5" />Change picture</>}</Button></div></div>
          <form onSubmit={saveProfile} className="space-y-5"><div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="profile-email">Email address</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="profile-email" value={profile?.email || session?.user?.email || ""} readOnly className="h-11 rounded-xl bg-slate-50 pl-9 text-slate-500" /></div><p className="text-[11px] text-slate-400">Changing your sign-in email is not supported here.</p></div><div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={isSaving || !name.trim()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Check className="mr-2 h-4 w-4" />Save changes</>}</Button></div></form>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex items-center justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CreditCard className="h-5 w-5" /></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Active</span></div><h2 className="mt-4 text-lg font-bold text-slate-900">Free plan</h2><p className="mt-1 text-sm leading-5 text-slate-500">Your current Quizvera application plan.</p></div><div className="space-y-3 p-5"><div className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-600" />Quiz and group management</div><div className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-600" />Participant reporting</div><div className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-600" />Quiz collaboration</div><p className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400">Billing and paid plans are not enabled yet.</p></div></section>
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><div><p className="text-xs font-semibold text-slate-700">Account security</p><p className="mt-1 text-xs leading-5 text-slate-500">Your email identifies your account and is used for quiz sharing. Ask an administrator before changing account access.</p></div></div></section>
      </aside>
    </div>
  </main>;
}
