"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "../ui";
import { RazorpayLogo } from "../ui/razorpay-logo";
import { updateDemoPaymentSettingsAction } from "../../app/admin/payments/actions";

export function PaymentsSettings({ enabled, configured }: { enabled: boolean; configured: boolean }) {
  const [active, setActive] = useState(enabled);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(""); setSaved(false);
    const next = !active;
    startTransition(async () => {
      const result = await updateDemoPaymentSettingsAction({ razorpayDemoEnabled: next });
      if ("error" in result) { setError(result.error ?? "Could not update payment settings."); return; }
      setActive(next); setSaved(true);
    });
  }

  return <div className="pb-20">
    <div><p className="text-sm font-medium text-primary">Checkout</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Payments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose how shoppers can pay.</p></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><CreditCard size={20}/></span><div><h2 className="font-semibold">Cash on delivery</h2><p className="mt-1 text-sm leading-5 text-muted">Customers pay when their order arrives.</p></div></div><div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"><Check size={16}/>Available at checkout</div></section>
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-11 shrink-0 place-items-center rounded-xl border border-line bg-white px-3"><RazorpayLogo className="h-auto w-[92px]"/></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Razorpay</h2><span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">Optional</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Test only</span></div><p className="mt-1 text-sm leading-5 text-muted">Try a test checkout. No real payment is collected.</p></div></div>
        {configured ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-[#fafbf9] p-3"><div><p className="text-sm font-semibold">{active ? "Shown at checkout" : "Hidden at checkout"}</p><p className="mt-0.5 text-xs text-muted">Optional test payment for demos.</p></div><Button type="button" variant={active ? "secondary" : "primary"} disabled={pending} onClick={toggle} className="min-w-28">{pending ? "Saving…" : active ? "Turn off" : "Enable test"}</Button></div> : <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-background px-3 py-3"><div><p className="text-sm font-medium">Not set up</p><p className="mt-0.5 text-xs text-muted">Cash on delivery is ready to use.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-muted">Optional</span></div>}
      </section>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {saved && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Payment options updated.</p>}
  </div>;
}
