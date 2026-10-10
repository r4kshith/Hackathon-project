"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export function StoreHeader({ slug, name, logoUrl, primary }: { slug: string; name: string; logoUrl: string | null; primary: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => {
      try { setCount(JSON.parse(localStorage.getItem(`launch-cart-${slug}`) ?? "[]").reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 0), 0)); } catch { setCount(0); }
    };
    refresh();
    window.addEventListener("store-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("store-cart-updated", refresh); window.removeEventListener("storage", refresh); };
  }, [slug]);
  return <header className="storefront-header border-b border-black/5 bg-white/90 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-8"><Link href={`/s/${slug}`} className="storefront-brand flex min-h-11 min-w-0 shrink-0 items-center gap-2.5 font-semibold tracking-tight"><span className="storefront-brand-mark grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-black/5">{logoUrl ? <Image src={logoUrl} alt={`${name} logo`} width={40} height={40} unoptimized className="h-full w-full object-cover" /> : <span style={{ color: primary }}>✳</span>}</span><span className="max-w-[34vw] truncate sm:max-w-[24vw]">{name}</span></Link><nav className="storefront-nav hidden shrink-0 items-center gap-4 text-base text-muted sm:flex sm:gap-6 md:text-lg"><Link href={`/s/${slug}`} className="hover:text-foreground">Home</Link><Link href={`/s/${slug}#collections`} className="hover:text-foreground">Collections</Link><Link href={`/s/${slug}#story`} className="hover:text-foreground">Our story</Link></nav><div className="ml-auto flex shrink-0 items-center gap-1"><Link href={`/s/${slug}#shop`} aria-label="Search products" className="grid h-12 w-12 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Search size={22} strokeWidth={2} /></Link><Link href={`/s/${slug}/cart`} aria-label={`Shopping bag, ${count} items`} className="relative grid h-12 w-12 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ShoppingBag size={23} strokeWidth={2} />{count > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: primary }}>{count}</span>}</Link></div></div></header>;
}
