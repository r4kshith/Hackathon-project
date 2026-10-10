import { db } from "./db";

export function storefrontBySlug(slug: string) {
  return db.store.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, logoUrl: true, email: true, theme: true, themeConfig: true, contentConfig: true } });
}

export function storefrontHomeData(slug: string) {
  return db.store.findUnique({ where: { slug }, include: { categories: { orderBy: { name: "asc" } }, products: { where: { active: true }, include: { category: true }, orderBy: { createdAt: "desc" } } } });
}

export function storefrontCategory(slug: string, categorySlug: string) {
  return db.category.findFirst({ where: { slug: categorySlug, store: { slug } }, include: { store: { select: { id: true, name: true, contentConfig: true } }, products: { where: { active: true, stock: { gt: 0 } }, include: { category: true }, orderBy: { name: "asc" } } } });
}

export async function storefrontProduct(slug: string, productSlug: string) {
  const product = await db.product.findFirst({ where: { slug: productSlug, active: true, store: { slug } }, include: { store: { select: { id: true, name: true } }, category: true } });
  if (!product) return null;
  const related = await db.product.findMany({ where: { storeId: product.storeId, active: true, id: { not: product.id }, ...(product.categoryId ? { categoryId: product.categoryId } : {}) }, include: { category: true }, take: 4, orderBy: { createdAt: "desc" } });
  return { product, related };
}

export function publicOrderByNumber(slug: string, orderNumber: string) {
  return db.order.findFirst({ where: { orderNumber, store: { slug } }, include: { store: { select: { name: true } }, items: true } });
}

export async function createPublicOrder(input: { slug: string; name: string; email: string; phone: string; address: string; city: string; postalCode: string; items: { id: string; quantity: number }[] }) {
  const store = await db.store.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!store) return { error: "This store is no longer available." };
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  const products = await db.product.findMany({ where: { storeId: store.id, id: { in: [...quantities.keys()] }, active: true } });
  if (products.length !== quantities.size) return { error: "Some items are no longer available. Please refresh your bag." };
  for (const product of products) if (product.stock < quantities.get(product.id)!) return { error: `${product.name} no longer has enough stock. Please update your bag.` };
  const subtotal = products.reduce((sum, product) => sum + Number(product.price) * quantities.get(product.id)!, 0);
  const shipping = subtotal >= 75 ? 0 : 6;
  const orderNumber = `LS-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  try {
    await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { storeId_email: { storeId: store.id, email: input.email.toLowerCase() } },
        update: { name: input.name, phone: input.phone },
        create: { storeId: store.id, name: input.name, email: input.email.toLowerCase(), phone: input.phone },
      });
      for (const product of products) {
        const changed = await tx.product.updateMany({ where: { storeId: store.id, id: product.id, stock: { gte: quantities.get(product.id)! } }, data: { stock: { decrement: quantities.get(product.id)! } } });
        if (changed.count !== 1) throw new Error("OUT_OF_STOCK");
      }
      await tx.order.create({ data: {
        storeId: store.id, customerId: customer.id, orderNumber, subtotal, shipping, total: subtotal + shipping,
        paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING",
        shippingAddress: { name: input.name, email: input.email, phone: input.phone, line1: input.address, city: input.city, postalCode: input.postalCode },
        items: { create: products.map((product) => ({ storeId: store.id, productId: product.id, productName: product.name, quantity: quantities.get(product.id)!, unitPrice: product.price, lineTotal: Number(product.price) * quantities.get(product.id)! })) },
      } });
    });
    return { ok: true, orderNumber };
  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_STOCK") return { error: "Stock changed while you were checking out. Please review your bag." };
    console.error(JSON.stringify({ level: "error", event: "checkout_failed", storeId: store.id, error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't place that order yet. Please try again." };
  }
}
