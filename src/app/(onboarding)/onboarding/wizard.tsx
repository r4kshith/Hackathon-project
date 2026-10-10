"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Store } from "lucide-react";
import { Button, Input } from "../../../components/ui";
import { finishOnboardingAction } from "../actions";
import { categorySeed } from "../../../lib/catalogue";
import { themes, type ThemeId } from "../../../lib/themes";

const steps = ["Your store", "Contact", "Categories", "Look & feel"];
type WizardData = { storeName: string; businessType: string; email: string; phone: string; address: string; categories: number[]; customCategory: string; themeId: ThemeId; logoDataUrl: string | null };
const blank: WizardData = { storeName: "", businessType: "Home & lifestyle", email: "", phone: "", address: "", categories: [0], customCategory: "", themeId: "atelier", logoDataUrl: null };

export function OnboardingWizard({ ownerName }: { ownerName: string }) {
  const [data, setData] = useState(blank);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const theme = themes[data.themeId];

  useEffect(() => {
    try { const saved = localStorage.getItem("launch-onboarding"); if (saved) { const parsed = JSON.parse(saved) as { data?: Partial<WizardData>; step?: number }; setData({ ...blank, ...parsed.data }); setStep(Math.min(3, Math.max(0, parsed.step ?? 0))); } }
    catch { localStorage.removeItem("launch-onboarding"); }
  }, []);
  useEffect(() => { localStorage.setItem("launch-onboarding", JSON.stringify({ data, step })); }, [data, step]);

  const selectedNames = useMemo(() => data.categories.map((index) => categorySeed[index]?.name).filter(Boolean), [data.categories]);
  function next() {
    setError("");
    if (step === 0 && data.storeName.trim().length < 2) return setError("Add a store name with at least 2 characters.");
    if (step === 1 && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.phone.trim().length < 7)) return setError("Add a valid email and phone number.");
    if (step === 2 && data.categories.length === 0 && !data.customCategory.trim()) return setError("Choose at least one category.");
    if (step < 3) setStep(step + 1);
  }
  function toggleCategory(index: number) { setData((current) => ({ ...current, categories: current.categories.includes(index) ? current.categories.filter((value) => value !== index) : [...current.categories, index] })); }
  async function chooseLogo(file?: File) {
    if (!file) return;
    if (!(["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) || file.size > 1_500_000) { setError("Choose a PNG, JPG, WebP or SVG logo under 1.5 MB."); return; }
    const reader = new FileReader(); reader.onload = () => setData((current) => ({ ...current, logoDataUrl: String(reader.result) })); reader.readAsDataURL(file);
  }
  function complete() {
    setError("");
    const customCategories = data.customCategory.trim() ? data.customCategory.split(",").map((name) => name.trim()).filter(Boolean) : [];
    const storeTab = window.open("about:blank", "_blank");
    if (storeTab) storeTab.opener = null;
    startTransition(async () => {
      try {
        const result = await finishOnboardingAction({ storeName: data.storeName, businessType: data.businessType, email: data.email, phone: data.phone, address: data.address, categoryIndexes: data.categories, customCategories, themeId: data.themeId, logoDataUrl: data.logoDataUrl });
        if (result.error) { storeTab?.close(); setError(result.error); return; }
        localStorage.removeItem("launch-onboarding");
        if (storeTab && !storeTab.closed) {
          storeTab.location.replace(`/s/${result.slug}`);
          router.push("/admin");
        } else router.push(`/s/${result.slug}`);
      } catch {
        storeTab?.close();
        setError("We couldn't save your store yet. Please try again.");
      }
    });
  }

  return <section className="mx-auto mt-8 max-w-5xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Welcome, {ownerName.split(" ")[0]}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Let’s make it yours.</h1><p className="mt-2 text-muted">A few details, then we’ll build your storefront.</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-muted">Step {step + 1} of {steps.length}</span></div>
    <div className="mt-7 grid grid-cols-4 gap-2" aria-label="Setup progress">{steps.map((label, index) => <div key={label}><div className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-line"}`} /><span className={`mt-2 hidden text-xs sm:block ${index === step ? "font-semibold text-foreground" : "text-muted"}`}>{label}</span></div>)}</div>
    <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="min-h-[430px] rounded-3xl border border-line bg-white p-5 sm:p-8">
        {step === 0 && <div><h2 className="text-xl font-semibold">Start with the basics</h2><p className="mt-1 text-sm text-muted">Your shop name can be changed later.</p><label className="mt-6 block text-sm font-medium">Store name<Input value={data.storeName} onChange={(event) => setData({ ...data, storeName: event.target.value })} placeholder="e.g. Sunday Goods" className="mt-1.5" autoFocus /></label><label className="mt-4 block text-sm font-medium">What do you sell?<select value={data.businessType} onChange={(event) => setData({ ...data, businessType: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"><option>Home & lifestyle</option><option>Apparel & accessories</option><option>Beauty & personal care</option><option>Food & pantry</option><option>Art & stationery</option><option>Plants & garden</option><option>Other</option></select></label><label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-line bg-background p-4"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-accent text-primary">{data.logoDataUrl ? <Image src={data.logoDataUrl} width={48} height={48} unoptimized alt="Your store logo preview" className="h-full w-full object-cover" /> : <ImagePlus size={21} />}</span><span className="flex-1"><strong className="block text-sm">Add a logo <span className="font-normal text-muted">(optional)</span></strong><span className="mt-1 block text-xs text-muted">PNG, JPG, WebP or SVG · up to 1.5 MB</span></span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => chooseLogo(event.target.files?.[0])} aria-label="Upload store logo" /></label></div>}
        {step === 1 && <div><h2 className="text-xl font-semibold">How can customers reach you?</h2><p className="mt-1 text-sm text-muted">These details appear on order updates and your footer.</p><label className="mt-6 block text-sm font-medium">Business email<Input type="email" autoComplete="email" value={data.email} onChange={(event) => setData({ ...data, email: event.target.value })} placeholder="hello@yourshop.com" className="mt-1.5" /></label><label className="mt-4 block text-sm font-medium">Phone number<Input type="tel" autoComplete="tel" value={data.phone} onChange={(event) => setData({ ...data, phone: event.target.value })} placeholder="+1 (555) 123-4567" className="mt-1.5" /></label><label className="mt-4 block text-sm font-medium">Business address <span className="font-normal text-muted">(optional)</span><textarea value={data.address} onChange={(event) => setData({ ...data, address: event.target.value })} placeholder="Street, city, region" className="mt-1.5 min-h-24 w-full rounded-xl border border-line px-3.5 py-3 text-sm" /></label></div>}
        {step === 2 && <div><h2 className="text-xl font-semibold">What’s in your shop?</h2><p className="mt-1 text-sm text-muted">Choose the categories you want to start with.</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{categorySeed.map((category, index) => { const selected = data.categories.includes(index); return <button key={category.prefix} type="button" aria-pressed={selected} onClick={() => toggleCategory(index)} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-sm transition ${selected ? "border-primary bg-accent/60 font-semibold text-primary" : "border-line hover:border-primary/40"}`}><span>{category.name}</span>{selected && <Check size={17} />}</button>; })}</div><label className="mt-5 block text-sm font-medium">Add your own categories <span className="font-normal text-muted">(comma separated)</span><Input value={data.customCategory} onChange={(event) => setData({ ...data, customCategory: event.target.value })} placeholder="e.g. Gift boxes, Ceramics" className="mt-1.5" /></label><p className="mt-3 text-xs text-muted">Want a head start? We’ll add 8 sample products to each selected collection. You can edit or remove them anytime.</p></div>}
        {step === 3 && <div><h2 className="text-xl font-semibold">Pick your storefront style</h2><p className="mt-1 text-sm text-muted">Preview all eight complete looks before you decide.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{(Object.entries(themes) as [ThemeId, typeof themes[ThemeId]][]).map(([id, item]) => <button key={id} type="button" aria-pressed={data.themeId === id} onClick={() => setData({ ...data, themeId: id })} className={`overflow-hidden rounded-2xl border text-left transition ${data.themeId === id ? "border-primary ring-2 ring-primary/20" : "border-line hover:border-primary/40"}`}><div style={{ background: item.colors.background, fontFamily: item.font, color: item.colors.foreground }} className="p-4"><div style={{ background: item.colors.primary }} className="h-2 w-12 rounded-full" /><div className={`mt-4 grid gap-2 ${item.layout === "editorial" ? "grid-cols-[1.2fr_.8fr]" : "grid-cols-2"}`}><div className="aspect-[4/3] rounded-lg" style={{ background: item.colors.accent }} /><div className="flex flex-col justify-center"><span className="text-[10px] uppercase tracking-widest">{item.name}</span><strong className="mt-1 text-xs">A little good thing.</strong></div></div><div className="mt-3 flex gap-1"><i className="h-2 w-2 rounded-full" style={{ background: item.colors.primary }} /><i className="h-2 w-2 rounded-full" style={{ background: item.colors.accent }} /><i className="h-2 w-2 rounded-full" style={{ background: item.colors.foreground }} /></div></div><div className="flex items-center justify-between px-3.5 py-3"><span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted">{item.description}</span></span>{data.themeId === id && <Check className="shrink-0 text-primary" size={18} />}</div></button>)}</div></div>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5"><Button variant="secondary" type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || pending}><ArrowLeft size={16} className="mr-2" />Back</Button>{step < 3 ? <Button type="button" onClick={next}>Continue<ArrowRight size={16} className="ml-2" /></Button> : <Button type="button" onClick={complete} disabled={pending}>{pending ? "Building your store…" : "Build my store"}<ArrowRight size={16} className="ml-2" /></Button>}</div>
      </div>
      <aside className="h-fit rounded-3xl border border-line bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Store size={19} /></span><div><p className="text-xs text-muted">YOUR STORE</p><p className="font-semibold">{data.storeName || "Your new shop"}</p></div></div><div className="my-5 h-px bg-line" /><p className="text-xs font-semibold uppercase tracking-wider text-muted">Setup progress</p><ul className="mt-3 space-y-3 text-sm">{["Store details", "Contact information", "Product categories", "Storefront theme"].map((label, index) => <li key={label} className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full ${index < step ? "bg-primary text-white" : "bg-background text-muted"}`}>{index < step ? <Check size={12} /> : index + 1}</span><span className={index <= step ? "text-foreground" : "text-muted"}>{label}</span></li>)}</ul><div className="mt-5 rounded-2xl p-4 shadow-inner shadow-black/10" style={{ background: "linear-gradient(135deg, #173d30 0%, #286044 58%, #477951 100%)", color: "#f7f8f0", fontFamily: "Arial, Helvetica, sans-serif" }}><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/75">LIVE PREVIEW · {theme.layout}</span><p className="mt-2 text-lg font-bold tracking-tight">{data.storeName || "Your new shop"}</p><div className="mt-3 flex flex-wrap gap-2">{selectedNames.slice(0, 3).map((name) => <span key={name} className="rounded-full border border-white/15 px-2 py-1 text-[10px] text-white/90" style={{ background: "rgba(237, 246, 224, .14)" }}>{name}</span>)}</div><button type="button" className="mt-4 min-h-9 rounded-lg bg-gradient-to-r from-[#c6e4ad] to-[#e5f1c9] px-3 text-xs font-bold text-[#183d30] shadow-md shadow-black/10">Shop collection</button></div><p className="mt-4 text-xs leading-5 text-muted">Your setup is saved on this device as you go. You can change these details later in your dashboard.</p></aside>
    </div>
  </section>;
}
