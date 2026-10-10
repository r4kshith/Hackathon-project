"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

export function StoreHeader({ slug, name, logoUrl, primary }: { slug: string; name: string; logoUrl: string | null; primary: string }) {
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try { setCount(JSON.parse(localStorage.getItem(`launch-cart-${slug}`) ?? "[]").reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 0), 0)); } catch { setCount(0); }
    };
    refresh();
    window.addEventListener("store-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("store-cart-updated", refresh); window.removeEventListener("storage", refresh); };
  }, [slug]);
  return <header className="storefront-header border-b border-black/5 bg-white/90 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 sm:gap-6 sm:px-8"><Link href={`/s/${slug}`} className="storefront-brand flex min-h-11 min-w-0 shrink-0 items-center gap-2 font-semibold tracking-tight"><span className="storefront-brand-mark grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-black/5 sm:h-10 sm:w-10">{logoUrl ? <Image src={logoUrl} alt={`${name} logo`} width={40} height={40} unoptimized className="h-full w-full object-cover" /> : <span style={{ color: primary }}>✳</span>}</span><span className="max-w-[27vw] truncate sm:max-w-[24vw]">{name}</span></Link><nav className="storefront-nav hidden shrink-0 items-center gap-4 text-base text-muted sm:flex sm:gap-6 md:text-lg"><Link href={`/s/${slug}`} className="hover:text-foreground">Home</Link><Link href={`/s/${slug}#collections`} className="hover:text-foreground">Collections</Link><Link href={`/s/${slug}#story`} className="hover:text-foreground">Our story</Link></nav><div className="ml-auto flex shrink-0 items-center gap-0.5"><Link href={`/s/${slug}#shop`} aria-label="Search products" className="grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-12 sm:w-12"><Search size={21} strokeWidth={2} /></Link><Link href={`/s/${slug}/cart`} aria-label={`Shopping bag, ${count} items`} className="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-12 sm:w-12"><ShoppingBag size={22} strokeWidth={2} />{count > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: primary }}>{count}</span>}</Link><button type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-black/5 sm:hidden">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button></div></div>{menuOpen && <nav aria-label="Store navigation" className="grid gap-1 border-t border-black/5 px-4 py-2 text-sm text-muted sm:hidden"><Link onClick={() => setMenuOpen(false)} href={`/s/${slug}`} className="min-h-11 rounded-lg px-3 py-3">Home</Link><Link onClick={() => setMenuOpen(false)} href={`/s/${slug}#collections`} className="min-h-11 rounded-lg px-3 py-3">Collections</Link><Link onClick={() => setMenuOpen(false)} href={`/s/${slug}#story`} className="min-h-11 rounded-lg px-3 py-3">Our story</Link></nav>}</header>;
}
