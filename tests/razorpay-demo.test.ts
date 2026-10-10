import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { getRazorpayDemoConfig, isValidRazorpaySignature, isValidRazorpayWebhook } from "../src/lib/razorpay-demo.ts";

test("Razorpay demo config refuses live credentials", () => {
  const previousId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_live_not-for-demo";
  process.env.RAZORPAY_KEY_SECRET = "secret";
  assert.equal(getRazorpayDemoConfig(), null);
  process.env.RAZORPAY_KEY_ID = "rzp_test_demo";
  assert.deepEqual(getRazorpayDemoConfig(), { keyId: "rzp_test_demo", keySecret: "secret", currency: "USD" });
  if (previousId === undefined) delete process.env.RAZORPAY_KEY_ID; else process.env.RAZORPAY_KEY_ID = previousId;
  if (previousSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET; else process.env.RAZORPAY_KEY_SECRET = previousSecret;
});

test("payment and webhook signatures are checked against their expected payloads", () => {
  const secret = "demo-secret";
  const paymentSignature = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
  assert.equal(isValidRazorpaySignature("order_1", "pay_1", paymentSignature, secret), true);
  assert.equal(isValidRazorpaySignature("order_1", "pay_2", paymentSignature, secret), false);

  const body = '{"event":"payment.captured"}';
  const webhookSignature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(isValidRazorpayWebhook(body, webhookSignature, secret), true);
  assert.equal(isValidRazorpayWebhook(`${body} `, webhookSignature, secret), false);
});
