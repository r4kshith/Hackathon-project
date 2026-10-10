import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeId } from "../../lib/themes";
import { themes } from "../../lib/themes";
import { StoreHeader } from "./header";

export function StorefrontShell({ store, children }: { store: { slug: string; name: string; logoUrl: string | null; email: string | null; theme: string; themeConfig: unknown; contentConfig: unknown }; children: ReactNode }) {
  const baseTheme = themes[(store.theme in themes ? store.theme : "atelier") as ThemeId];
  const themeConfig = store.themeConfig && typeof store.themeConfig === "object" ? store.themeConfig as { colors?: Partial<typeof baseTheme.colors>; font?: string } : {};
  const colors = { ...baseTheme.colors, ...themeConfig.colors };
  const font = themeConfig.font ?? baseTheme.font;
  const content = store.contentConfig && typeof store.contentConfig === "object" ? store.contentConfig as { bannerText?: string; footerText?: string } : {};
  const style = { "--store-bg": colors.background, "--store-fg": colors.foreground, "--store-primary": colors.primary, "--store-accent": colors.accent, "--store-font": font } as CSSProperties;
  return <div data-store-theme={store.theme in themes ? store.theme : "atelier"} style={style} className="storefront-root min-h-screen bg-[var(--store-bg)] font-[var(--store-font)] text-[var(--store-fg)]">
    {content.bannerText && <p className="bg-[var(--store-primary)] px-4 py-2 text-center text-xs font-semibold text-white">{content.bannerText}</p>}
    <StoreHeader slug={store.slug} name={store.name} logoUrl={store.logoUrl} primary={colors.primary} />
    {children}
    <footer className="storefront-footer mt-20 border-t border-black/10"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-8"><div><Link href={`/s/${store.slug}`} className="font-semibold">{store.name}</Link><p className="mt-2 max-w-sm text-sm opacity-70">{content.footerText ?? "Made with care, sent with love. Thanks for shopping small."}</p></div><div className="sm:text-right"><p className="text-sm font-semibold">Need a hand?</p><a href={`mailto:${store.email ?? "hello@example.com"}`} className="mt-2 inline-block text-sm underline underline-offset-4">{store.email ?? "Contact the shop"}</a><p className="mt-5 text-xs opacity-60">© {new Date().getFullYear()} {store.name}. Payments shown as cash on delivery or demo checkout.</p></div></div></footer>
  </div>;
}
