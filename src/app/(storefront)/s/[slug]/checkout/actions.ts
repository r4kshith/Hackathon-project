"use server";

import { z } from "zod";
import { createPublicOrder } from "../../../../../lib/storefront-data";
import { createPublicRazorpayOrder, failPublicRazorpayOrder, verifyPublicRazorpayPayment } from "../../../../../lib/razorpay-orders";
import { getRazorpayDemoConfig } from "../../../../../lib/razorpay-demo";

const checkoutSchema = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(240),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(20),
  items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(50) })).min(1).max(50),
});

export async function placeOrderAction(raw: unknown) {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your shipping details." };
  try { return await createPublicOrder(parsed.data); }
  catch (error) {
    console.error(JSON.stringify({ level: "error", event: "checkout_request_failed", error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't place that order yet. Please try again." };
  }
}

export async function createRazorpayOrderAction(raw: unknown) {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your shipping details." };
  const config = getRazorpayDemoConfig();
  if (!config) return { error: "Razorpay test mode is not configured. Add test API keys to the server environment." };
  try { return await createPublicRazorpayOrder(parsed.data, config); }
  catch (error) {
    console.error(JSON.stringify({ level: "error", event: "razorpay_checkout_order_failed", error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't start the Razorpay test checkout. Please try again." };
  }
}

const razorpayVerificationSchema = z.object({
  slug: z.string().min(1).max(60),
  orderNumber: z.string().min(1).max(60),
  providerOrderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function verifyRazorpayPaymentAction(raw: unknown) {
  const parsed = razorpayVerificationSchema.safeParse(raw);
  if (!parsed.success) return { error: "The payment response is incomplete. Please contact the shop if you were charged." };
  const config = getRazorpayDemoConfig();
  if (!config) return { error: "Razorpay test mode is temporarily unavailable." };
  try { return await verifyPublicRazorpayPayment(parsed.data, config); }
  catch (error) {
    console.error(JSON.stringify({ level: "error", event: "razorpay_payment_verification_failed", orderNumber: parsed.data.orderNumber, error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't confirm this test payment. Please wait briefly and contact the shop if needed." };
  }
}

export async function cancelRazorpayPaymentAction(raw: unknown) {
  const parsed = z.object({ slug: z.string().min(1).max(60), orderNumber: z.string().min(1).max(60) }).safeParse(raw);
  if (parsed.success) await failPublicRazorpayOrder(parsed.data);
  return { ok: true };
}
