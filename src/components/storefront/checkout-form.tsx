"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button, Input } from "../ui";
import { RazorpayLogo } from "../ui/razorpay-logo";
import { readCart, writeCart, type CartItem } from "../../lib/cart";
import { money } from "../../lib/money";
import { cancelRazorpayPaymentAction, createRazorpayOrderAction, placeOrderAction, verifyRazorpayPaymentAction } from "../../app/(storefront)/s/[slug]/checkout/actions";

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void | Promise<void>;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = { open: () => void; on: (event: string, handler: (event: { error?: { description?: string } }) => void) => void };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance } }

async function loadRazorpayCheckout() {
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (existing.dataset.razorpayLoaded === "true") { resolve(); return; }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("CHECKOUT_SCRIPT_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => { script.dataset.razorpayLoaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("CHECKOUT_SCRIPT_FAILED"));
    document.body.appendChild(script);
  });
  return Boolean(window.Razorpay);
}

export function CheckoutForm({ slug, storeName, razorpayEnabled, razorpayKeyId, primaryColor }: { slug: string; storeName: string; razorpayEnabled: boolean; razorpayKeyId: string; primaryColor: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const router = useRouter();
  useEffect(() => setItems(readCart(slug)), [slug]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shipping = subtotal >= 75 ? 0 : 6;
  const total = subtotal + shipping;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || busy) return;
    setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const checkout = { slug, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address"), city: form.get("city"), postalCode: form.get("postalCode"), items: items.map(({ id, quantity }) => ({ id, quantity })) };

    if (paymentMethod === "cod") {
      try {
        const result = await placeOrderAction(checkout);
        if (!("orderNumber" in result)) { setError("error" in result ? result.error ?? "Could not place your order." : "Could not place your order."); setBusy(false); return; }
        writeCart(slug, []); router.push(`/s/${slug}/order/${result.orderNumber}`);
      } catch { setError("We couldn't place your order. Please try again."); setBusy(false); }
      return;
    }

    let pendingOrderNumber = "";
    try {
      const setup = await createRazorpayOrderAction(checkout);
      if (!("providerOrderId" in setup)) { setError("error" in setup ? setup.error ?? "Could not start test checkout." : "Could not start test checkout."); setBusy(false); return; }
      pendingOrderNumber = setup.orderNumber!;
      if (!(await loadRazorpayCheckout()) || !window.Razorpay) throw new Error("CHECKOUT_SCRIPT_FAILED");
      let cancellationRecorded = false;
      const cancelOrder = async () => {
        if (cancellationRecorded) return;
        cancellationRecorded = true;
        await cancelRazorpayPaymentAction({ slug, orderNumber: pendingOrderNumber });
        setBusy(false);
      };
      const checkoutModal = new window.Razorpay({
        key: razorpayKeyId,
        amount: setup.amount!,
        currency: setup.currency!,
        name: storeName,
        description: "Store order · Test payment",
        order_id: setup.providerOrderId!,
        prefill: { name: String(checkout.name), email: String(checkout.email), contact: String(checkout.phone) },
        theme: { color: primaryColor },
        handler: async (response) => {
          try {
            const verified = await verifyRazorpayPaymentAction({ slug, orderNumber: pendingOrderNumber, providerOrderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
            if (!("ok" in verified)) { setError("error" in verified ? verified.error ?? "We couldn't confirm the test payment." : "We couldn't confirm the test payment."); setBusy(false); return; }
            cancellationRecorded = true;
            writeCart(slug, []);
            router.push(`/s/${slug}/order/${pendingOrderNumber}`);
          } catch { setError("We couldn't confirm the test payment. Please contact the shop before retrying."); setBusy(false); }
        },
        modal: { ondismiss: () => { void cancelOrder(); } },
      });
      checkoutModal.on("payment.failed", (response) => { void cancelOrder(); setError(response.error?.description || "Test payment failed. You can retry or choose cash on delivery."); });
      checkoutModal.open();
    } catch {
      if (pendingOrderNumber) await cancelRazorpayPaymentAction({ slug, orderNumber: pendingOrderNumber });
      setError("Razorpay Checkout could not be loaded. Check your connection and try again.");
      setBusy(false);
    }
  }

  return <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-10 sm:px-8 sm:py-14"><div className="mb-6"><Link href={`/s/${slug}/cart`} className="inline-flex min-h-11 items-center text-sm opacity-70 hover:opacity-100"><ArrowLeft size={16} className="mr-2" />Back to bag</Link></div><div className="grid gap-7 lg:grid-cols-[1fr_340px]"><section><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--store-primary)]">Almost yours</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Checkout</h1><p className="mt-2 text-sm opacity-70">We’ll send your order confirmation by email.</p>{items.length === 0 ? <div className="mt-6 rounded-2xl bg-white p-6"><p>Your bag is empty.</p><Link href={`/s/${slug}#shop`} className="mt-3 inline-block text-sm font-semibold text-[var(--store-primary)] underline">Continue shopping</Link></div> : <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-white p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Full name<Input name="name" autoComplete="name" required minLength={2} className="mt-1.5" /></label><label className="text-sm font-medium">Email<Input name="email" type="email" autoComplete="email" required className="mt-1.5" /></label></div><label className="block text-sm font-medium">Phone<Input name="phone" type="tel" autoComplete="tel" required minLength={7} className="mt-1.5" /></label><label className="block text-sm font-medium">Street address<Input name="address" autoComplete="street-address" required minLength={5} className="mt-1.5" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">City<Input name="city" autoComplete="address-level2" required minLength={2} className="mt-1.5" /></label><label className="text-sm font-medium">Postal code<Input name="postalCode" autoComplete="postal-code" required minLength={2} className="mt-1.5" /></label></div>
      <fieldset><legend className="mb-2 text-sm font-semibold">Payment method</legend><div className="grid gap-2 sm:grid-cols-2"><label className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${paymentMethod === "cod" ? "border-primary bg-accent/35" : "border-line hover:bg-background"}`}><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="h-4 w-4 accent-primary"/><span><strong className="block">Cash on delivery</strong><span className="text-xs opacity-65">Pay when it arrives</span></span></label>{razorpayEnabled && <label className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${paymentMethod === "razorpay" ? "border-primary bg-accent/35" : "border-line hover:bg-background"}`}><input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} className="h-4 w-4 accent-primary"/><span className="flex min-w-0 flex-col gap-1"><RazorpayLogo className="h-auto w-[102px]"/><span className="text-xs opacity-65">Test mode · no real charge</span></span></label>}</div></fieldset>
      {paymentMethod === "cod" ? <div className="rounded-xl bg-[var(--store-accent)]/60 p-4"><p className="text-sm font-semibold">Cash on delivery</p><p className="mt-1 text-xs opacity-70">No payment is collected online. Pay when your order arrives.</p></div> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Razorpay test checkout</p><p className="mt-1 text-xs leading-5 text-amber-900">This opens Razorpay’s test payment window. It does not collect real money.</p></div>}{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}<Button disabled={busy || items.length === 0} className="w-full">{busy ? paymentMethod === "cod" ? "Placing your order…" : "Opening secure test checkout…" : `${paymentMethod === "cod" ? "Place order" : "Pay with Razorpay"} · ${money(total)}`}</Button><p className="flex items-center justify-center gap-1.5 text-xs opacity-55"><LockKeyhole size={13} />Your details are only shared with this shop.</p></form>}</section><aside className="h-fit rounded-2xl border border-black/10 bg-white p-5"><h2 className="font-semibold">Your order</h2><div className="mt-4 space-y-3">{items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.name} <span className="opacity-55">× {item.quantity}</span></span><span className="shrink-0">{money(item.price * item.quantity)}</span></div>)}</div><div className="my-4 h-px bg-black/10"/><div className="flex justify-between text-sm"><span className="opacity-70">Subtotal</span><span>{money(subtotal)}</span></div><div className="mt-2 flex justify-between text-sm"><span className="opacity-70">Shipping</span><span>{shipping === 0 ? "Complimentary" : money(shipping)}</span></div><div className="my-4 h-px bg-black/10"/><div className="flex justify-between font-semibold"><span>Total</span><span>{money(total)}</span></div><p className="mt-2 text-[11px] text-muted">{paymentMethod === "cod" ? "Pay when delivered." : "Test payment only · INR"}</p></aside></div></main>;
}
