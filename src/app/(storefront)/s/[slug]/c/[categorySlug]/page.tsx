import { notFound } from "next/navigation";
import Image from "next/image";
import { storefrontCategory } from "../../../../../../lib/storefront-data";
import { ProductCard } from "../../../../../../components/storefront/product-card";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string; categorySlug: string }> }) {
  const { slug, categorySlug } = await params;
  const category = await storefrontCategory(slug, categorySlug);
  if (!category) notFound();
  const config = category.store.contentConfig && typeof category.store.contentConfig === "object" ? category.store.contentConfig as { categoryContent?: Record<string, { description?: string; imageUrl?: string }> } : {};
  const collection = config.categoryContent?.[category.slug];
  return <main className="storefront-collection-page mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14"><div className="grid items-center gap-8 md:grid-cols-[1fr_.8fr]"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--store-primary)]">Collection · {category.store.name}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">{category.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 opacity-70">{collection?.description || `A considered collection from ${category.store.name}, chosen to make your everyday a little brighter.`}</p><p className="mt-7 text-sm opacity-60">{category.products.length} available {category.products.length === 1 ? "piece" : "pieces"}</p></div>{collection?.imageUrl && <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-[var(--store-accent)]"><Image src={collection.imageUrl} alt={`${category.name} collection`} fill priority sizes="(max-width: 768px) 100vw, 40vw" unoptimized className="object-cover"/></div>}</div>{category.products.length ? <div className="storefront-product-grid mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">{category.products.map((product) => <ProductCard key={product.id} product={product} storeSlug={slug} />)}</div> : <div className="mt-8 rounded-3xl bg-white/70 p-12 text-center"><p className="text-xl font-semibold">This collection is getting a refresh.</p><p className="mt-2 text-sm opacity-70">Check back soon for new arrivals.</p></div>}</main>;
}
