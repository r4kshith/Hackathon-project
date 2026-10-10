import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { publicOrderByNumber } from "../../../../../../lib/storefront-data";
import { money } from "../../../../../../lib/money";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ slug: string; orderNumber: string }> }) {
  const { slug, orderNumber } = await params;
  const order = await publicOrderByNumber(slug, orderNumber);
  if (!order) notFound();
  const address = order.shippingAddress as { name?: string; email?: string; line1?: string; city?: string; postalCode?: string };
  const paymentLabel = order.paymentMethod === "RAZORPAY" ? "Razorpay test payment" : "Cash on delivery";
  return <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-4 py-12 sm:px-8"><section className="w-full rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm sm:p-10"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--store-accent)] text-[var(--store-primary)]"><Check size={30} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-[var(--store-primary)]">It’s official</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Thanks, {address.name?.split(" ")[0] ?? "friend"}.</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 opacity-70">Your order is in. {order.store.name} will send an update to {address.email} when it’s ready.</p><div className="mx-auto mt-7 max-w-md rounded-2xl bg-[var(--store-bg)] p-5 text-left"><div className="flex justify-between gap-3 text-sm"><span className="opacity-60">Order number</span><strong>{order.orderNumber}</strong></div><div className="my-4 h-px bg-black/10"/><div className="space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.productName} × {item.quantity}</span><span>{money(Number(item.lineTotal))}</span></div>)}</div><div className="my-4 h-px bg-black/10"/><div className="flex justify-between font-semibold"><span>Total · {paymentLabel}</span><span>{money(Number(order.total))}</span></div><p className="mt-3 text-xs leading-5 opacity-60">Shipping to {address.line1}, {address.city} {address.postalCode}</p></div><Link href={`/s/${slug}`} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[var(--store-primary)] px-6 text-sm font-semibold text-white">Back to {order.store.name}</Link></section></main>;
}
