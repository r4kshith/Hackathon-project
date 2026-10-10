import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "./product-actions";
import { money } from "../../lib/money";

type NumericValue = number | string | { toNumber(): number };
export type StoreProduct = { id: string; name: string; slug: string; description: string; price: NumericValue; compareAt: NumericValue | null; imageUrl: string | null; stock: number; category?: { name: string; slug: string } | null };

export function ProductCard({ product, storeSlug }: { product: StoreProduct; storeSlug: string }) {
  const price = Number(product.price);
  const compareAt = product.compareAt === null ? null : Number(product.compareAt);
  return <article className="storefront-product-card group min-w-0">
    <Link href={`/s/${storeSlug}/products/${product.slug}`} className="storefront-product-image relative block aspect-square overflow-hidden rounded-2xl bg-black/5 sm:aspect-[4/3]">
      {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 grid place-items-center text-4xl text-black/20" aria-hidden="true">✳</div>}
      {compareAt && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold">A little less</span>}
    </Link>
    <div className="flex items-start justify-between gap-1.5 pt-2 sm:gap-2 sm:pt-3"><div className="min-w-0"><Link href={`/s/${storeSlug}/products/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:underline sm:text-base">{product.name}</Link><p className="mt-1 text-xs text-muted sm:text-sm">{product.category?.name ?? "Thoughtfully picked"}</p></div><span className="shrink-0 text-xs font-semibold sm:text-sm">{money(price)}</span></div>
    <AddToCartButton storeSlug={storeSlug} product={{ id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, price, stock: product.stock }} />
  </article>;
}
