import { notFound } from "next/navigation";
import { storefrontBySlug } from "../../../../lib/storefront-data";
import { StorefrontShell } from "../../../../components/storefront/storefront-shell";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await storefrontBySlug(slug);
  if (!store) notFound();
  return <StorefrontShell store={store}>{children}</StorefrontShell>;
}
