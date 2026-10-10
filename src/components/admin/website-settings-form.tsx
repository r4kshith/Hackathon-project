"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Image as ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "../ui";
import { ThemeSettings, type ThemePreferences } from "./theme-settings";
import { createWebsiteCategoryAction, deleteWebsiteCategoryAction, updateWebsiteAction } from "../../app/admin/website/actions";

type CategoryContent = { slug: string; description: string; imageUrl: string };
type WebsiteSettings = ThemePreferences & { homepageDescription: string; bannerText: string; showCollections: boolean; showStory: boolean; categoryContent: CategoryContent[] };
type Category = { id: string; name: string; slug: string; description: string; imageUrl: string };

export function WebsiteSettingsForm({ initial, storeName, categories }: { initial: WebsiteSettings; storeName: string; categories: Category[] }) {
  const [form, setForm] = useState(initial);
  const [categoryList, setCategoryList] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [collectionMessage, setCollectionMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [collectionPending, startCollectionTransition] = useTransition();
  function update(next: WebsiteSettings) { setForm(next); setDirty(true); setError(""); setSaved(false); }
  useEffect(() => { if (!saved) return; const timeout = window.setTimeout(() => setSaved(false), 3000); return () => window.clearTimeout(timeout); }, [saved]);

  function updateCategory(slug: string, patch: Partial<CategoryContent>) {
    update({ ...form, categoryContent: form.categoryContent.map((category) => category.slug === slug ? { ...category, ...patch } : category) });
  }

  function addCategory() {
    setError(""); setCollectionMessage("");
    startCollectionTransition(async () => {
      const result = await createWebsiteCategoryAction(newCategoryName);
      if ("error" in result) { setError(result.error ?? "Could not add this collection."); return; }
      setCategoryList((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((current) => ({ ...current, categoryContent: [...current.categoryContent, { slug: result.category.slug, description: "", imageUrl: "" }] }));
      setNewCategoryName("");
      setCollectionMessage("Collection added. Add its image and description, then save your website changes.");
    });
  }

  function removeCategory(category: Category) {
    if (!window.confirm(`Remove “${category.name}” from your storefront? Its products will stay in your store but become uncategorized.`)) return;
    setError(""); setCollectionMessage("");
    startCollectionTransition(async () => {
      const result = await deleteWebsiteCategoryAction(category.slug);
      if ("error" in result) { setError(result.error ?? "Could not remove this collection."); return; }
      setCategoryList((current) => current.filter((item) => item.id !== category.id));
      setForm((current) => ({ ...current, categoryContent: current.categoryContent.filter((item) => item.slug !== category.slug) }));
      setCollectionMessage("Collection removed. Its products remain in your inventory without a collection.");
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    const submitted = { ...form };
    startTransition(async () => {
      try {
        const result = await updateWebsiteAction(submitted);
        if ("error" in result) { setError(result.error ?? "Could not save your website changes."); return; }
        setDirty(false); setSaved(true);
      } catch { setError("We couldn't save your website changes. Check your connection and try again."); }
    });
  }

  return <div className="pb-24 sm:pb-28">
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Owner controls</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Website</h1><p className="mt-2 text-sm text-muted">Shape your storefront. Changes appear when you save.</p></div><Button type="submit" disabled={pending || !dirty} className="shrink-0">{pending ? "Saving…" : "Save changes"}<Save size={15} className="ml-2"/></Button></div>

      <div className="mt-6 space-y-5">
        <ThemeSettings value={form} onChange={(theme) => update({ ...form, ...theme })} storeName={storeName}/>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div><h2 className="font-semibold">Homepage content</h2><p className="mt-1 text-xs text-muted">Write the first words shoppers see and choose which sections appear.</p></div>
          <label className="mt-5 block text-sm font-medium">Homepage description<Textarea maxLength={400} value={form.homepageDescription} onChange={(event) => update({ ...form, homepageDescription: event.target.value })} placeholder="Tell shoppers what makes your store special." className="mt-1.5 min-h-24"/><span className="mt-1 block text-right text-[11px] font-normal text-muted">{form.homepageDescription.length}/400</span></label>
          <label className="mt-3 block text-sm font-medium">Announcement banner<Input maxLength={140} value={form.bannerText} onChange={(event) => update({ ...form, bannerText: event.target.value })} placeholder="Free shipping on orders over ₹2,000" className="mt-1.5"/></label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{([["showCollections", "Show collections"], ["showStory", "Show maker story"]] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3 rounded-xl bg-background px-3 text-sm"><input type="checkbox" checked={form[key]} onChange={(event) => update({ ...form, [key]: event.target.checked })} className="h-4 w-4 accent-primary"/>{label}</label>)}</div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">Collection images & descriptions</h2><p className="mt-1 text-xs leading-5 text-muted">Add an image URL and a short description to give each collection its own identity. Use an HTTPS image link.</p></div>
            <div className="flex w-full gap-2 sm:w-auto"><Input aria-label="New collection name" maxLength={40} value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCategory(); } }} placeholder="New collection name" className="!mt-0 !h-10 !min-h-10 sm:w-52"/><Button type="button" onClick={addCategory} disabled={collectionPending || newCategoryName.trim().length < 2} className="!h-10 !min-h-10 shrink-0"><Plus size={15} className="mr-1.5"/>Add</Button></div>
          </div>
          {collectionMessage && <p role="status" className="mt-3 text-xs font-medium text-primary">{collectionMessage}</p>}
          {categoryList.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{categoryList.map((category) => {
            const value = form.categoryContent.find((item) => item.slug === category.slug);
            if (!value) return null;
            return <article key={category.id} className="grid gap-3 rounded-xl border border-line bg-[#fafbf9] p-3 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-3">
              <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-accent/60 text-primary">{value.imageUrl ? <Image src={value.imageUrl} alt={`${category.name} collection`} fill unoptimized sizes="48px" className="object-cover"/> : <ImageIcon size={19} aria-hidden="true"/>}</div>
              <div className="min-w-0"><div className="flex min-h-6 items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold">{category.name}</h3><div className="flex items-center gap-1">{value.imageUrl && <button type="button" onClick={() => updateCategory(category.slug, { imageUrl: "" })} className="min-h-8 rounded-lg px-2 text-[11px] font-medium text-muted hover:bg-white hover:text-foreground">Remove image</button>}<button type="button" disabled={collectionPending} onClick={() => removeCategory(category)} aria-label={`Remove ${category.name} collection`} title="Remove collection" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 size={15}/></button></div></div><div className="mt-2 grid gap-2 xl:grid-cols-2"><label className="block text-[11px] font-medium">Image URL<Input type="url" value={value.imageUrl} onChange={(event) => updateCategory(category.slug, { imageUrl: event.target.value })} placeholder="https://example.com/image.jpg" className="!mt-1 !h-9 !min-h-9 !rounded-lg !px-2.5 !text-xs"/></label><label className="block text-[11px] font-medium">Description<Input maxLength={300} value={value.description} onChange={(event) => updateCategory(category.slug, { description: event.target.value })} placeholder={`About ${category.name.toLowerCase()}`} className="!mt-1 !h-9 !min-h-9 !rounded-lg !px-2.5 !text-xs"/></label></div></div>
            </article>;
          })}</div> : <div className="mt-5 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Add a collection first to customize its image and description.</div>}
        </section>
      </div>
    </form>
    {error && <div role="alert" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-xl">{error}</div>}
    {saved && !error && <div role="status" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-medium text-emerald-800 shadow-xl"><Check size={15} className="mr-1 inline"/>Website saved and live.</div>}
  </div>;
}
