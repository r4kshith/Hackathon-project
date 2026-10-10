import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "./product-actions";

type NumericValue = number | string | { toNumber(): number };
export type StoreProduct = { id: string; name: string; slug: string; description: string; price: NumericValue; compareAt: NumericValue | null; imageUrl: string | null; stock: number; category?: { name: string; slug: string } | null };

export function ProductCard({ product, storeSlug }: { product: StoreProduct; storeSlug: string }) {
  const price = Number(product.price);
  const compareAt = product.compareAt === null ? null : Number(product.compareAt);
  return <article className="storefront-product-card group min-w-0">
    <Link href={`/s/${storeSlug}/products/${product.slug}`} className="storefront-product-image relative block aspect-[4/5] overflow-hidden rounded-2xl bg-black/5">
      {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 grid place-items-center text-4xl text-black/20" aria-hidden="true">✳</div>}
      {compareAt && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold">A little less</span>}
    </Link>
    <div className="flex items-start justify-between gap-2 pt-3"><div className="min-w-0"><Link href={`/s/${storeSlug}/products/${product.slug}`} className="line-clamp-1 font-medium hover:underline">{product.name}</Link><p className="mt-1 text-sm text-muted">{product.category?.name ?? "Thoughtfully picked"}</p></div><span className="shrink-0 text-sm font-semibold">${price.toFixed(2)}</span></div>
    <AddToCartButton storeSlug={storeSlug} product={{ id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, price, stock: product.stock }} />
  </article>;
}
