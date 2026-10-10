import Link from "next/link";
import { ArrowUpRight, Box, CreditCard, LayoutDashboard, PackageCheck, PanelsTopLeft, Settings2, Upload, WandSparkles } from "lucide-react";
import { clearSession } from "../../lib/auth";
import { BrandLogo } from "../brand/brand-logo";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & stock", icon: Box },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/import", label: "Import catalogue", icon: Upload },
  { href: "/admin/assistant", label: "Store assistant", icon: WandSparkles },
  { href: "/admin/website", label: "Website", icon: PanelsTopLeft, ownersOnly: true },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, ownersOnly: true },
  { href: "/admin/settings", label: "Store settings", icon: Settings2, ownersOnly: true },
];

export function AdminFrame({ children, store, role }: { children: React.ReactNode; store: { name: string; slug: string }; role: "OWNER" | "STAFF" }) {
  return <div className="min-h-screen bg-[#f5f7f5] text-foreground lg:grid lg:grid-cols-[245px_1fr]">
    <aside className="border-b border-line bg-white px-4 py-3 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <BrandLogo badge="Admin" wordmarkClassName="text-[1.65rem]" />
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-background p-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Your store</p><p className="truncate text-sm font-semibold">{store.name}</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-primary">{role === "OWNER" ? "Owner" : "Staff"}</span></div>
      <nav aria-label="Admin navigation" className="admin-sidebar-nav mt-4 flex gap-1 overflow-x-auto lg:mt-5 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">{nav.filter((item) => !item.ownersOnly || role === "OWNER").map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-background hover:text-foreground lg:w-full"><Icon size={17} />{label}</Link>)}</nav>
      <div className="mt-3 hidden shrink-0 rounded-2xl bg-accent/60 p-3 lg:block"><p className="text-sm font-semibold">Your shop is live</p><p className="mt-1 text-xs leading-5 text-muted">Give customers a peek at what you’ve made.</p><Link href={`/s/${store.slug}`} target="_blank" className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-primary">View storefront <ArrowUpRight size={14} className="ml-1" /></Link></div>
      <form action={async () => { "use server"; await clearSession(); }} className="mt-2 shrink-0 border-t border-line pt-2 lg:mt-2"><button className="min-h-11 w-full rounded-xl px-3 text-left text-sm text-muted hover:bg-background">Sign out</button></form>
    </aside>
    <div className="min-w-0"><header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8"><p className="truncate text-sm text-muted">{store.name} <span className="mx-1 opacity-50">/</span> <span className="text-foreground">Workspace</span></p><Link href={`/s/${store.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-accent/60">View shop <ArrowUpRight size={15} /></Link></header><main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-9">{children}</main></div>
  </div>;
}
