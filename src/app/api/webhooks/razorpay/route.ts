import { NextResponse } from "next/server";
import { isValidRazorpayWebhook, getRazorpayDemoConfig } from "../../../../lib/razorpay-demo";
import { applyRazorpayWebhookFailure, applyRazorpayWebhookPayment } from "../../../../lib/razorpay-orders";

export const dynamic = "force-dynamic";

type RazorpayWebhook = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string | null; amount?: number; currency?: string; status?: string } } };
};

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !getRazorpayDemoConfig()) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!isValidRazorpayWebhook(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  let event: RazorpayWebhook;
  try { event = JSON.parse(rawBody) as RazorpayWebhook; }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id) return NextResponse.json({ received: true });
  try {
    if (event.event === "payment.captured" && payment.order_id && typeof payment.amount === "number" && payment.currency && payment.status) {
      await applyRazorpayWebhookPayment({ id: payment.id, order_id: payment.order_id, amount: payment.amount, currency: payment.currency, status: payment.status });
    } else if (event.event === "payment.failed") {
      await applyRazorpayWebhookFailure({ id: payment.id, order_id: payment.order_id ?? null });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "razorpay_webhook_processing_failed", error: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
