import { PaymentMethod, PaymentStatus, OrderStatus } from "../generated/prisma/enums";
import { db } from "./db";
import { createRazorpayOrder, getRazorpayDemoConfig, getRazorpayPayment, isValidRazorpaySignature, refundRazorpayPayment, type RazorpayDemoConfig, type RazorpayPaymentResponse } from "./razorpay-demo";

export type PublicCheckoutInput = {
  slug: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  items: { id: string; quantity: number }[];
};

function enabledForStore(contentConfig: unknown) {
  return Boolean(contentConfig && typeof contentConfig === "object" && "razorpayDemoEnabled" in contentConfig && contentConfig.razorpayDemoEnabled === true);
}

export async function createPublicRazorpayOrder(input: PublicCheckoutInput, config: RazorpayDemoConfig) {
  const store = await db.store.findUnique({ where: { slug: input.slug }, select: { id: true, contentConfig: true } });
  if (!store || !enabledForStore(store.contentConfig)) return { error: "Online test payments are not enabled for this shop." };

  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  const products = await db.product.findMany({ where: { storeId: store.id, id: { in: [...quantities.keys()] }, active: true } });
  if (products.length !== quantities.size) return { error: "Some items are no longer available. Please refresh your bag." };
  for (const product of products) if (product.stock < quantities.get(product.id)!) return { error: `${product.name} no longer has enough stock. Please update your bag.` };

  const subtotal = products.reduce((sum, product) => sum + Number(product.price) * quantities.get(product.id)!, 0);
  const shipping = subtotal >= 75 ? 0 : 6;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const orderNumber = `DK-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { storeId_email: { storeId: store.id, email: input.email.toLowerCase() } },
      update: { name: input.name, phone: input.phone },
      create: { storeId: store.id, name: input.name, email: input.email.toLowerCase(), phone: input.phone },
    });
    return tx.order.create({ data: {
      storeId: store.id, customerId: customer.id, orderNumber, subtotal, shipping, total,
      paymentMethod: PaymentMethod.RAZORPAY, paymentStatus: PaymentStatus.PENDING,
      shippingAddress: { name: input.name, email: input.email, phone: input.phone, line1: input.address, city: input.city, postalCode: input.postalCode },
      items: { create: products.map((product) => ({ storeId: store.id, productId: product.id, productName: product.name, quantity: quantities.get(product.id)!, unitPrice: product.price, lineTotal: Number(product.price) * quantities.get(product.id)! })) },
    }, select: { id: true } });
  });

  try {
    const providerOrder = await createRazorpayOrder(Math.round(total * 100), orderNumber.slice(0, 40), config);
    await db.order.updateMany({ where: { id: order.id, storeId: store.id }, data: { gatewayOrderId: providerOrder.id } });
    return { orderNumber, providerOrderId: providerOrder.id, amount: providerOrder.amount, currency: providerOrder.currency, keyId: config.keyId };
  } catch (error) {
    await db.order.updateMany({ where: { id: order.id, storeId: store.id, paymentStatus: PaymentStatus.PENDING }, data: { paymentStatus: PaymentStatus.FAILED } });
    console.error(JSON.stringify({ level: "error", event: "razorpay_order_create_failed", storeId: store.id, status: error instanceof Error ? error.message : "unknown" }));
    return { error: "Razorpay could not create a test payment. Check the test API keys and try again." };
  }
}

async function settleCapturedPayment(orderId: string, payment: RazorpayPaymentResponse) {
  const existing = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!existing) return { error: "We could not match this payment to an order." };
  if (existing.paymentStatus === PaymentStatus.PAID) return existing.gatewayPaymentId === payment.id ? { ok: true as const } : { error: "A different payment is already confirmed for this order." };
  if (existing.paymentStatus === PaymentStatus.REFUNDED) return { error: "This payment has already been refunded." };
  const expectedAmount = Math.round(Number(existing.total) * 100);
  if (payment.order_id !== existing.gatewayOrderId || payment.amount !== expectedAmount || payment.currency !== "USD" || payment.status !== "captured") return { error: "The payment details do not match this order." };

  try {
    await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: existing.id }, include: { items: true } });
      if (!current) throw new Error("ORDER_NOT_FOUND");
      if (current.paymentStatus === PaymentStatus.PAID) return;
      if (current.paymentStatus === PaymentStatus.REFUNDED) throw new Error("PAYMENT_REFUNDED");
      for (const item of current.items) {
        if (!item.productId) continue;
        const changed = await tx.product.updateMany({ where: { id: item.productId, storeId: current.storeId, active: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new Error("STOCK_CHANGED");
      }
      const updated = await tx.order.updateMany({ where: { id: current.id, storeId: current.storeId, gatewayOrderId: payment.order_id, paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } }, data: { paymentStatus: PaymentStatus.PAID, gatewayPaymentId: payment.id } });
      if (updated.count !== 1) throw new Error("PAYMENT_STATE_CHANGED");
    });
    return { ok: true as const };
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "STOCK_CHANGED") throw error;
    try {
      const refund = await refundRazorpayPayment(payment.id, payment.amount, getRazorpayDemoConfig()!);
      if (!refund.id) throw new Error("REFUND_NOT_CREATED");
      await db.order.updateMany({ where: { id: existing.id, storeId: existing.storeId, gatewayOrderId: payment.order_id, paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } }, data: { paymentStatus: PaymentStatus.REFUNDED, gatewayPaymentId: payment.id, status: OrderStatus.CANCELLED } });
      return { error: "The payment went through, but stock changed before confirmation. A refund has been requested." };
    } catch {
      return { error: "The payment went through, but stock changed before confirmation. Contact the shop to arrange a refund." };
    }
  }
}

export async function verifyPublicRazorpayPayment(input: { slug: string; orderNumber: string; providerOrderId: string; paymentId: string; signature: string }, config: RazorpayDemoConfig) {
  const store = await db.store.findUnique({ where: { slug: input.slug }, select: { id: true, contentConfig: true } });
  if (!store || !enabledForStore(store.contentConfig)) return { error: "Online test payments are not enabled for this shop." };
  const order = await db.order.findFirst({ where: { storeId: store.id, orderNumber: input.orderNumber, paymentMethod: PaymentMethod.RAZORPAY } });
  if (!order || !order.gatewayOrderId || order.gatewayOrderId !== input.providerOrderId) return { error: "We could not match this payment to your order." };
  if (order.paymentStatus === PaymentStatus.PAID) return order.gatewayPaymentId === input.paymentId ? { ok: true as const } : { error: "A different payment is already confirmed for this order." };

  if (!isValidRazorpaySignature(order.gatewayOrderId, input.paymentId, input.signature, config.keySecret)) return { error: "Razorpay could not verify this payment. Please contact the shop before trying again." };
  const payment = await getRazorpayPayment(input.paymentId, config);
  if (payment.status !== "captured") return { error: "Payment is not captured yet. Wait a moment and try again." };
  return settleCapturedPayment(order.id, payment);
}

export async function failPublicRazorpayOrder(input: { slug: string; orderNumber: string }) {
  const store = await db.store.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!store) return;
  await db.order.updateMany({ where: { storeId: store.id, orderNumber: input.orderNumber, paymentMethod: PaymentMethod.RAZORPAY, paymentStatus: PaymentStatus.PENDING }, data: { paymentStatus: PaymentStatus.FAILED } });
}

export async function applyRazorpayWebhookPayment(payment: RazorpayPaymentResponse) {
  if (payment.status !== "captured") return;
  const order = await db.order.findFirst({ where: { gatewayOrderId: payment.order_id, paymentMethod: PaymentMethod.RAZORPAY } });
  if (!order) return;
  const result = await settleCapturedPayment(order.id, payment);
  if ("error" in result) console.error(JSON.stringify({ level: "error", event: "razorpay_webhook_reconcile_failed", orderId: order.id, reason: result.error }));
}

export async function applyRazorpayWebhookFailure(payment: { id: string; order_id: string | null }) {
  if (!payment.order_id) return;
  await db.order.updateMany({
    where: { gatewayOrderId: payment.order_id, paymentMethod: PaymentMethod.RAZORPAY, paymentStatus: PaymentStatus.PENDING },
    data: { paymentStatus: PaymentStatus.FAILED },
  });
}
