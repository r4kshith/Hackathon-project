"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FocusEvent } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";

const reasons = [
  { title: "Start selling sooner", text: "Set up your storefront, add products, and share a live link.", image: "photo-1578749556568-bc2c40e68b61", alt: "Handmade ceramic pieces" },
  { title: "Run it all in one place", text: "Manage orders, inventory, and store details from one dashboard.", image: "photo-1547592180-85f173990554", alt: "Fresh goods ready to sell" },
  { title: "Make it your own", text: "Choose a theme and customize the look of your storefront.", image: "photo-1441986300917-64674bd600d8", alt: "Independent clothing boutique" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pointerInteractionRef = useRef(false);

  function closeIfFocusLeaves(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  return <header ref={headerRef} className="relative z-30 mx-auto max-w-6xl" onMouseLeave={() => { if (!headerRef.current?.contains(document.activeElement)) setOpen(false); }} onBlurCapture={closeIfFocusLeaves} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }}>
    <nav aria-label="Main navigation" className="flex min-h-11 items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-6">
        <Link className="group flex min-h-11 items-center gap-2" href="/" aria-label="Dukaan home"><span className="grid size-9 place-items-center rounded-xl bg-[#dce9dc] font-serif text-lg font-semibold text-[#103f32] transition duration-300 group-hover:rotate-[-6deg] group-hover:bg-[#c3f078] motion-reduce:transition-none">D</span><span className="font-serif text-xl font-semibold tracking-[-0.06em] text-[#103f32] sm:text-[1.65rem]">Dukaan</span></Link>
        <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={open ? "why-dukaan-menu" : undefined} aria-haspopup="true" onMouseEnter={() => setOpen(true)} onFocus={() => setOpen(true)} onPointerDown={() => { pointerInteractionRef.current = true; }} onClick={() => { if (pointerInteractionRef.current) setOpen(true); else setOpen((current) => !current); pointerInteractionRef.current = false; }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); requestAnimationFrame(() => firstLinkRef.current?.focus()); } }} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-[#24453a] transition hover:bg-[#e8f0e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-1.5 sm:px-4 sm:text-sm">Why use Dukaan<ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></button>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold text-[#17241f] transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:px-5 sm:text-base" href="/login">Log in</Link>
        <Link className="inline-flex min-h-11 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:px-5 sm:text-sm" href="/signup">Sign up<span className="hidden sm:inline">&nbsp;for free</span></Link>
      </div>
    </nav>
    {open && <div id="why-dukaan-menu" className="absolute left-0 right-0 top-full z-50 pt-3 motion-safe:animate-[menu-enter_180ms_ease-out]" onMouseEnter={() => setOpen(true)}>
      <div role="region" aria-label="Why use Dukaan" className="grid max-h-[calc(100dvh-6rem)] gap-4 overflow-y-auto rounded-3xl border border-line bg-white p-4 text-foreground shadow-[0_24px_64px_rgba(16,63,50,0.18)] sm:p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reasons.map((item, index) => <Link key={item.title} ref={index === 0 ? firstLinkRef : undefined} href="/signup" className="group rounded-2xl p-2 transition-colors hover:bg-[#f2f6f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#e8eee6]"><Image src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=700&q=80`} alt={item.alt} fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" /></div>
          <div className="mt-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">{item.title}</h2><ArrowUpRight size={15} className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div><p className="mt-1 text-xs leading-5 text-muted">{item.text}</p>
        </Link>)}</div>
        <aside className="flex flex-col justify-between rounded-2xl bg-[#103f32] p-5 text-white"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#c3f078]">Built for your next step</p><h2 className="mt-3 text-xl font-semibold">Your business deserves its own corner of the internet.</h2><p className="mt-2 text-sm leading-6 text-white/70">Start simple. Add products, pick a theme, and make it yours.</p></div><Link href="/signup" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#c3f078] px-4 text-sm font-semibold text-[#163e30] transition hover:bg-[#d0f593]">Build your store <span className="ml-2" aria-hidden="true">→</span></Link></aside>
      </div>
    </div>}
  </header>;
}
