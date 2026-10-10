"use client";

import { Check, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { themes, type ThemeId } from "../../lib/themes";

export type ThemePreferences = {
  themeId: ThemeId;
  primary: string;
  background: string;
  foreground: string;
  accent: string;
  font: string;
};

const colorControls = [
  ["primary", "Primary"],
  ["background", "Background"],
  ["foreground", "Text"],
] as const;

export function ThemeSettings({ value, onChange, storeName }: { value: ThemePreferences; onChange: (next: ThemePreferences) => void; storeName: string }) {
  const [previewSize, setPreviewSize] = useState<"desktop" | "mobile">("desktop");
  const selected = themes[value.themeId];
  function chooseTheme(themeId: ThemeId) {
    const theme = themes[themeId];
    onChange({ themeId, primary: theme.colors.primary, background: theme.colors.background, foreground: theme.colors.foreground, accent: theme.colors.accent, font: theme.font });
  }

  return <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
    <div>
      <p className="text-sm font-semibold">Storefront look</p>
      <p className="mt-1 text-xs text-muted">Choose a style, then see your storefront update in the preview.</p>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)] lg:items-start">
      <div>
        <fieldset>
          <legend className="text-sm font-medium">Choose a theme</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">{(Object.entries(themes) as [ThemeId, typeof themes[ThemeId]][]).map(([id, theme]) => <button key={id} type="button" aria-pressed={value.themeId === id} onClick={() => chooseTheme(id)} style={{ color: theme.colors.foreground, background: value.themeId === id ? `linear-gradient(135deg, color-mix(in srgb, ${theme.colors.accent} 68%, ${theme.colors.primary} 32%), color-mix(in srgb, ${theme.colors.background} 82%, ${theme.colors.primary} 18%))` : `linear-gradient(145deg, color-mix(in srgb, ${theme.colors.background} 82%, ${theme.colors.primary} 18%), color-mix(in srgb, ${theme.colors.accent} 68%, ${theme.colors.primary} 32%))`, borderColor: value.themeId === id ? theme.colors.primary : `${theme.colors.primary}70` }} className={`min-h-[76px] rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${value.themeId === id ? "ring-1 ring-primary/30" : "hover:border-primary/70"}`}>
            <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{theme.name}</span>{value.themeId === id && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}</span>
            <span className="mt-1 block text-[11px] leading-4 opacity-75">{theme.description}</span>
            <span aria-hidden="true" className="mt-2 flex gap-1">{[theme.colors.background, theme.colors.primary, theme.colors.accent].map((color) => <i key={color} className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</span>
          </button>)}</div>
        </fieldset>
        <div className="mt-5 grid grid-cols-3 gap-3">{colorControls.map(([key, label]) => <label key={key} className="text-xs font-medium">{label}<span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-2"><input aria-label={`${label} color`} type="color" value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.value })} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent"/><span className="truncate text-[10px] uppercase text-muted">{value[key]}</span></span></label>)}</div>
        <label className="mt-4 block text-sm font-medium">Store font<select value={value.font} onChange={(event) => onChange({ ...value, font: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"><option value="Georgia, serif">Georgia · warm editorial</option><option value="Arial, Helvetica, sans-serif">Arial · clean familiar</option><option value="Trebuchet MS, sans-serif">Trebuchet · friendly modern</option></select></label>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted">Live preview</p><div role="group" aria-label="Preview size" className="inline-flex rounded-xl border border-line bg-background p-1"><button type="button" aria-pressed={previewSize === "desktop"} onClick={() => setPreviewSize("desktop")} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${previewSize === "desktop" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}><Monitor size={14}/>Desktop</button><button type="button" aria-pressed={previewSize === "mobile"} onClick={() => setPreviewSize("mobile")} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${previewSize === "mobile" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}><Smartphone size={14}/>Mobile</button></div></div>
        <div className={`flex justify-center rounded-2xl bg-background p-3 sm:p-4 ${previewSize === "mobile" ? "min-h-[560px]" : ""}`}>
          <aside aria-label={`${selected.name} live storefront ${previewSize} preview`} className={`theme-live-preview overflow-hidden border border-black/10 shadow-[0_18px_44px_rgba(20,32,28,0.12)] transition-[width,border-radius] duration-300 ${previewSize === "mobile" ? "w-full max-w-[340px] rounded-[1.75rem]" : "w-full rounded-2xl"}`} style={{ backgroundColor: value.background, color: value.foreground, fontFamily: value.font }}>
            <div className="flex h-9 items-center gap-1.5 border-b border-current/10 px-3"><i className="h-2 w-2 rounded-full bg-current/20"/><i className="h-2 w-2 rounded-full bg-current/15"/><i className="h-2 w-2 rounded-full bg-current/10"/><span className="ml-2 truncate text-[10px] opacity-55">{storeName || "Your shop"}</span><span className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: value.accent, color: value.foreground }}>LIVE PREVIEW</span></div>
            <div className="px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3"><strong className="max-w-[60%] truncate text-xs">{storeName || "Your shop"}</strong>{previewSize === "desktop" ? <div className="flex gap-3 text-[9px] opacity-60"><span>Shop</span><span>About</span><span>Bag</span></div> : <span aria-label="Open menu" className="text-sm opacity-65">☰</span>}</div>
              <div className={`mt-3 grid items-center gap-3 overflow-hidden p-3 sm:p-4 ${previewSize === "mobile" ? "grid-cols-1" : `min-h-36 sm:min-h-44 ${selected.layout === "minimal" ? "grid-cols-[1.1fr_.9fr]" : "grid-cols-2"}`}`} style={{ backgroundColor: value.accent, borderRadius: selected.layout === "organic" ? "1.5rem 1.5rem .5rem 1.5rem" : selected.layout === "minimal" ? ".3rem" : "1rem" }}>
                <div><span className="text-[8px] font-semibold uppercase tracking-[.16em] opacity-60">{selected.name} collection</span><p className="mt-2 text-sm font-semibold leading-tight sm:text-lg">Good things for every day.</p><span className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[9px] font-semibold text-white" style={{ backgroundColor: value.primary }}>Explore shop</span></div>
                <div className={`theme-preview-art relative overflow-hidden ${previewSize === "mobile" ? "min-h-24" : "min-h-28 sm:min-h-36"}`} style={{ borderRadius: selected.layout === "editorial" ? "50% 50% .5rem .5rem" : selected.layout === "organic" ? "1.3rem .4rem 1.3rem 1.3rem" : selected.layout === "minimal" ? ".25rem" : "1rem", background: `linear-gradient(145deg, ${value.primary}, ${value.accent})` }}><span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-1 text-[8px] font-semibold" style={{ color: value.foreground }}>Handpicked for you</span></div>
              </div>
              <div className="mt-3 flex items-center justify-between"><strong className="text-[10px]">Featured finds</strong><span className="text-[9px] opacity-55">View collection</span></div>
              <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-xl border border-current/10 bg-white/55 p-2"><div className="h-12 rounded-lg" style={{ background: `linear-gradient(135deg, ${value.accent}, ${value.primary}55)` }}/><span className="mt-1 block truncate text-[9px] font-medium">Sunday Morning Candle</span><span className="text-[9px] opacity-65">$28.00</span></div><div className="rounded-xl border border-current/10 bg-white/55 p-2"><div className="h-12 rounded-lg" style={{ background: `linear-gradient(135deg, ${value.primary}35, ${value.accent})` }}/><span className="mt-1 block truncate text-[9px] font-medium">Everyday Ceramic Mug</span><span className="text-[9px] opacity-65">$34.00</span></div></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>;
}
