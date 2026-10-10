"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

type Props = { children: ReactNode; className?: string; delay?: number; when?: "load" | "scroll" };

export function LandingReveal({ children, className, delay = 0, when = "load" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (when === "load") {
      requestAnimationFrame(() => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add("is-visible");
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [when]);

  return <div ref={ref} className={`landing-reveal ${className ?? ""}`} style={{ "--reveal-delay": `${delay}s` } as CSSProperties}>{children}</div>;
}
