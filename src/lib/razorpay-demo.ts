import { createHmac, timingSafeEqual } from "node:crypto";

export type RazorpayDemoConfig = { keyId: string; keySecret: string; currency: "INR" };
type RazorpayOrderResponse = { id: string; amount: number; currency: string; status: string };
export type RazorpayPaymentResponse = { id: string; order_id: string; amount: number; currency: string; status: string };

/** This demo intentionally accepts only test keys, so live credentials cannot charge real customers. */
export function getRazorpayDemoConfig(): RazorpayDemoConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId?.startsWith("rzp_test_") || !keySecret) return null;
  return { keyId, keySecret, currency: "INR" };
}

export function isValidRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isValidRazorpayWebhook(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function razorpayRequest<T>(path: string, method: "GET" | "POST", config: RazorpayDemoConfig, body?: object): Promise<T> {
  const authorization = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`RAZORPAY_API_${response.status}`);
  return response.json() as Promise<T>;
}

export function createRazorpayOrder(amount: number, receipt: string, config: RazorpayDemoConfig) {
  return razorpayRequest<RazorpayOrderResponse>("orders", "POST", config, { amount, currency: config.currency, receipt });
}

export function getRazorpayPayment(paymentId: string, config: RazorpayDemoConfig) {
  return razorpayRequest<RazorpayPaymentResponse>(`payments/${encodeURIComponent(paymentId)}`, "GET", config);
}

export function refundRazorpayPayment(paymentId: string, amount: number, config: RazorpayDemoConfig) {
  return razorpayRequest<{ id: string; status: string }>(`payments/${encodeURIComponent(paymentId)}/refund`, "POST", config, { amount });
}
