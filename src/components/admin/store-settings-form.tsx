"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "../ui";
import { updateStoreSettingsAction } from "../../app/admin/settings/actions";

type Settings = { name: string; email: string; phone: string; logoUrl: string; footerText: string };

export function StoreSettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  function updateForm(next: Settings) { setError(""); setForm(next); setIsDirty(true); }
  useEffect(() => { if (!saved) return; const timeout = window.setTimeout(() => setSaved(false), 3000); return () => window.clearTimeout(timeout); }, [saved]);

  function upload(file?: File) {
    if (!file) return;
    if (!(file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp" || file.type === "image/svg+xml") || file.size > 1_500_000) { setError("Choose a PNG, JPG, WebP or SVG image under 1.5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setError(""); setForm((current) => ({ ...current, logoUrl: String(reader.result) })); setIsDirty(true); };
    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    const submitted = { ...form };
    startTransition(async () => {
      try {
        const result = await updateStoreSettingsAction(submitted);
        if ("error" in result) { setError(result.error ?? "Could not save these settings."); return; }
        setIsDirty(false); setSaved(true);
      } catch { setError("We couldn't save your settings. Check your connection and try again."); }
    });
  }

  return <div className="pb-24 sm:pb-28">
    <form id="store-settings-form" onSubmit={submit}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Owner controls</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Store settings</h1><p className="mt-2 text-sm text-muted">Manage your business details and store identity.</p></div>
        <Button type="submit" disabled={pending || !isDirty} className="shrink-0">{pending ? "Saving…" : "Save changes"}<Save size={15} className="ml-2"/></Button>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Business details</h2><p className="mt-1 text-xs text-muted">Your name and contact details shown to shoppers.</p>
          <label className="mt-4 block text-sm font-medium">Store name<Input value={form.name} onChange={(event) => updateForm({ ...form, name: event.target.value })} className="mt-1.5"/></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Contact email<Input type="email" value={form.email} onChange={(event) => updateForm({ ...form, email: event.target.value })} className="mt-1.5"/></label><label className="text-sm font-medium">Phone<Input type="tel" value={form.phone} onChange={(event) => updateForm({ ...form, phone: event.target.value })} className="mt-1.5"/></label></div>
          <label className="mt-4 block text-sm font-medium">Footer note<Textarea maxLength={300} value={form.footerText} onChange={(event) => updateForm({ ...form, footerText: event.target.value })} placeholder="Made with care, sent with love." className="mt-1.5 min-h-20"/></label>
        </section>
        <aside className="h-fit rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Store logo</h2><p className="mt-1 text-xs text-muted">This appears in your store header.</p>
          <div className="mt-4 grid min-h-36 place-items-center overflow-hidden rounded-2xl bg-background">{form.logoUrl ? <Image src={form.logoUrl} alt="Store logo preview" width={240} height={112} unoptimized className="max-h-28 max-w-[80%] object-contain"/> : <span className="text-4xl text-primary">✳</span>}</div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium"><ImagePlus size={16}/>Upload a logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => upload(event.target.files?.[0])}/></label>
          {form.logoUrl && <Button type="button" variant="secondary" onClick={() => updateForm({ ...form, logoUrl: "" })} className="mt-2 w-full"><Trash2 size={15} className="mr-2"/>Remove logo</Button>}
          <label className="mt-3 block text-sm font-medium">Or paste an image URL<Input value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl} onChange={(event) => updateForm({ ...form, logoUrl: event.target.value })} placeholder="https://…" className="mt-1.5"/></label>
          <p className="mt-2 text-[11px] leading-5 text-muted">Uploaded images are stored with your store data. Keep files under 1.5 MB.</p>
        </aside>
      </div>
    </form>
    {error && <div role="alert" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-xl">{error}</div>}
    {saved && !error && <div role="status" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-medium text-emerald-800 shadow-xl">Saved. Your storefront is updated.</div>}
  </div>;
}
