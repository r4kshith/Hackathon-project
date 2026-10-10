import Link from "next/link";
import { Sparkles, Store } from "lucide-react";

type BrandLogoProps = {
  href?: string;
  className?: string;
  wordmarkClassName?: string;
  badge?: string;
};

export function BrandLogo({ href = "/", className = "", wordmarkClassName = "", badge }: BrandLogoProps) {
  return <Link href={href} aria-label="Dukaan home" className={`group inline-flex min-h-11 items-center gap-2.5 ${className}`}>
    <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-[#4d876d] via-[#23624e] to-[#103f32] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_5px_12px_rgba(16,63,50,.18)] transition duration-300 group-hover:-rotate-3 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_8px_18px_rgba(16,63,50,.24)] motion-reduce:transition-none">
      <Store size={22} strokeWidth={1.8} />
      <Sparkles size={10} strokeWidth={2.2} className="absolute right-1 top-1 fill-[#d4f28f] text-[#d4f28f]" />
    </span>
    <span className={`brand-wordmark text-[1.8rem] leading-none text-[#103f32] transition-colors group-hover:text-[#23624e] ${wordmarkClassName}`}>Dukaan</span>
    {badge && <span className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">{badge}</span>}
  </Link>;
}
