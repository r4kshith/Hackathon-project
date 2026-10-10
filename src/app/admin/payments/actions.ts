"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tenantData } from "../../../lib/tenant";
import { getRazorpayDemoConfig } from "../../../lib/razorpay-demo";

export async function updateDemoPaymentSettingsAction(raw: unknown) {
  const parsed = z.object({ razorpayDemoEnabled: z.boolean() }).safeParse(raw);
  if (!parsed.success) return { error: "Choose whether to enable Razorpay test checkout." };
  if (parsed.data.razorpayDemoEnabled && !getRazorpayDemoConfig()) return { error: "Razorpay test keys are missing. Add an rzp_test_ key ID and secret to the server environment first." };
  try {
    const scoped = await tenantData("OWNER");
    const existing = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
    const result = await scoped.storeSettings.update({ contentConfig: { ...existing, razorpayDemoEnabled: parsed.data.razorpayDemoEnabled } });
    if (!result.count) return { error: "Your store could not be found. Refresh and try again." };
    revalidatePath("/admin/payments");
    revalidatePath(`/s/${scoped.store.slug}/checkout`, "page");
    return { ok: true as const };
  } catch (error) {
    console.error("Payment settings save failed", error instanceof Error ? error.name : "unknown error");
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { error: "Your session expired. Sign in again to save these settings." };
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") return { error: "Only the store owner can change payment settings." };
    return { error: "We couldn't save your payment settings. Please try again." };
  }
}
