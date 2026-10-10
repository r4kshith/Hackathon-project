import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";
import { getSessionUser } from "./auth";
import { db } from "./db";
import { byStoreAndId, forStore } from "./tenant-scope";

/** Resolve tenant membership from the signed-in identity; never accept storeId from client input. */
export async function requireTenant(requiredRole?: UserRole) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const membership = await db.storeMember.findFirst({
    where: { userId: user.id, ...(requiredRole ? { role: requiredRole } : {}) },
    include: { store: true }, orderBy: { createdAt: "asc" },
  });
  if (!membership) throw new Error("TENANT_ACCESS_DENIED");
  return { user, storeId: membership.storeId, role: membership.role, store: membership.store };
}

/** All store data queries should go through this scoped client factory. */
export async function tenantData(requiredRole?: UserRole) {
  const context = await requireTenant(requiredRole);
  const { storeId } = context;
  return {
    ...context,
    categories: {
      list: () => db.category.findMany({ where: forStore(storeId), orderBy: { name: "asc" } }),
      exists: (id: string) => db.category.findFirst({ where: byStoreAndId(storeId, id), select: { id: true } }),
      create: (name: string, slug: string) => db.category.create({ data: { storeId, name, slug } }),
      byName: (name: string) => db.category.findFirst({ where: { storeId, name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true, slug: true } }),
      remove: (id: string) => db.$transaction(async (tx) => {
        const category = await tx.category.findFirst({ where: byStoreAndId(storeId, id), select: { id: true } });
        if (!category) return false;
        await tx.product.updateMany({ where: { storeId, categoryId: id }, data: { categoryId: null } });
        const deleted = await tx.category.deleteMany({ where: byStoreAndId(storeId, id) });
        return deleted.count === 1;
      }),
    },
    storeSettings: {
      update: (data: Prisma.StoreUncheckedUpdateManyInput) => db.store.updateMany({ where: { id: storeId }, data }),
    },
    products: {
      list: () => db.product.findMany({ where: forStore(storeId), include: { category: true, variants: true }, orderBy: { createdAt: "desc" } }),
      byId: (id: string) => db.product.findFirst({ where: byStoreAndId(storeId, id) }),
      create: (data: Omit<Prisma.ProductUncheckedCreateInput, "storeId">) => db.product.create({ data: { ...data, storeId } }),
      update: (id: string, data: Prisma.ProductUncheckedUpdateManyInput) => db.product.updateMany({ where: byStoreAndId(storeId, id), data }),
      remove: (id: string) => db.product.deleteMany({ where: byStoreAndId(storeId, id) }),
      bulkEdit: async (ids: string[], operation: "price-percent" | "stock-change", value: number) => {
        const rows = await db.product.findMany({ where: { storeId, id: { in: ids } }, select: { id: true, price: true, stock: true } });
        await db.$transaction(rows.map((row) => db.product.updateMany({ where: byStoreAndId(storeId, row.id), data: operation === "price-percent" ? { price: Math.max(0.01, Number(row.price) * (1 + value / 100)) } : { stock: Math.max(0, row.stock + Math.trunc(value)) } })));
        return rows.length;
      },
      replaceVariants: async (productId: string, variants: { name: string; sku: string | null; options: object; stock: number }[]) => db.$transaction(async (tx) => {
        const product = await tx.product.findFirst({ where: byStoreAndId(storeId, productId), select: { id: true } });
        if (!product) return false;
        await tx.productVariant.deleteMany({ where: { storeId, productId } });
        if (variants.length) await tx.productVariant.createMany({ data: variants.map((variant) => ({ ...variant, storeId, productId })) });
        return true;
      }),
    },
    orders: {
      list: () => db.order.findMany({ where: forStore(storeId), include: { items: true, customer: true }, orderBy: { createdAt: "desc" } }),
      updateStatus: async (id: string, status: OrderStatus) => db.$transaction(async (tx) => {
        const order = await tx.order.findFirst({ where: byStoreAndId(storeId, id), include: { customer: { select: { email: true } } } });
        if (!order) return false;
        if (order.paymentMethod === PaymentMethod.RAZORPAY && order.paymentStatus !== PaymentStatus.PAID) return false;
        const updated = await tx.order.updateMany({ where: byStoreAndId(storeId, id), data: { status } });
        if (!updated.count) return false;
        await tx.notification.create({ data: { storeId, orderId: order.id, channel: "EMAIL_LOG", recipient: order.customer?.email ?? null, subject: `Order ${order.orderNumber} update`, message: `Your order status is now ${status.toLowerCase()}.` } });
        return true;
      }),
    },
    assistant: {
      async topProducts(period: "week" | "month" | "all", limit: number) {
        const since = period === "all" ? undefined : new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000);
        const settled = { OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] };
        const items = await db.orderItem.findMany({ where: { storeId, order: { ...settled, status: { not: "CANCELLED" }, ...(since ? { createdAt: { gte: since } } : {}) } }, select: { productName: true, quantity: true, lineTotal: true } });
        const totals = new Map<string, { product: string; units: number; revenue: number }>();
        for (const item of items) { const row = totals.get(item.productName) ?? { product: item.productName, units: 0, revenue: 0 }; row.units += item.quantity; row.revenue += Number(item.lineTotal); totals.set(item.productName, row); }
        return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, limit);
      },
      lowStock: (threshold: number) => db.product.findMany({ where: { storeId, active: true, stock: { lte: threshold } }, select: { name: true, sku: true, stock: true }, orderBy: { stock: "asc" }, take: 50 }),
      async revenueCompare(periodA: "this_week" | "last_week" | "this_month" | "last_month", periodB: "this_week" | "last_week" | "this_month" | "last_month") {
        const settled = { OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] };
        const sum = async (period: typeof periodA) => { const now = new Date(); const start = new Date(now); start.setHours(0, 0, 0, 0); const weekDay = (start.getDay() + 6) % 7; if (period.endsWith("week")) { start.setDate(start.getDate() - weekDay - (period === "last_week" ? 7 : 0)); const end = new Date(start); end.setDate(end.getDate() + 7); return { value: await db.order.aggregate({ where: { storeId, ...settled, status: { not: "CANCELLED" }, createdAt: { gte: start, lt: end } }, _sum: { total: true } }).then((row) => Number(row._sum.total ?? 0)), label: period.replaceAll("_", " ") }; } start.setDate(1); if (period === "last_month") start.setMonth(start.getMonth() - 1); const end = new Date(start); end.setMonth(end.getMonth() + 1); const result = await db.order.aggregate({ where: { storeId, ...settled, status: { not: "CANCELLED" }, createdAt: { gte: start, lt: end } }, _sum: { total: true } }); return { value: Number(result._sum.total ?? 0), label: period.replaceAll("_", " ") }; };
        const [a, b] = await Promise.all([sum(periodA), sum(periodB)]);
        return [{ period: a.label, revenue: a.value }, { period: b.label, revenue: b.value }];
      },
      ordersByStatus: async () => { const rows = await db.order.groupBy({ by: ["status"], where: { storeId, OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] }, _count: { _all: true } }); return rows.map((r) => ({ status: r.status, orders: r._count._all })); },
      salesByCategory: async () => { const rows = await db.orderItem.findMany({ where: { storeId, order: { status: { not: "CANCELLED" }, OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] }, product: { category: { isNot: null } } }, select: { lineTotal: true, product: { select: { category: { select: { name: true } } } } } }); const totals = new Map<string, number>(); for (const row of rows) { const name = row.product?.category?.name ?? "Uncategorized"; totals.set(name, (totals.get(name) ?? 0) + Number(row.lineTotal)); } return [...totals].map(([category, revenue]) => ({ category, revenue })); },
      recentOrders: async (limit: number) => { const rows = await db.order.findMany({ where: { storeId, OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] }, take: limit, orderBy: { createdAt: "desc" }, select: { orderNumber: true, status: true, total: true, createdAt: true } }); return rows.map((r) => ({ order: r.orderNumber, status: r.status, total: Number(r.total), date: r.createdAt.toISOString() })); },
      customerCount: async () => [{ customers: await db.customer.count({ where: { storeId } }) }],
    },
    dashboard: async () => {
      const today = new Date(); const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
      const settled = { OR: [{ paymentMethod: PaymentMethod.CASH_ON_DELIVERY }, { paymentStatus: PaymentStatus.PAID }] };
      const [orderCount, orders, products, lowStock, recentOrders, weeklyOrders] = await Promise.all([
        db.order.count({ where: { ...forStore(storeId), ...settled } }),
        db.order.findMany({ where: { ...forStore(storeId), ...settled, status: { not: "CANCELLED" } }, select: { total: true } }),
        db.product.count({ where: { ...forStore(storeId), active: true } }),
        db.product.findMany({ where: { ...forStore(storeId), active: true, stock: { lte: 5 } }, select: { id: true, name: true, stock: true }, orderBy: { stock: "asc" }, take: 4 }),
        db.order.findMany({ where: { ...forStore(storeId), ...settled }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
        db.order.findMany({ where: { ...forStore(storeId), ...settled, status: { not: "CANCELLED" }, createdAt: { gte: weekStart } }, select: { createdAt: true, total: true } }),
      ]);
      return { orderCount, revenue: orders.reduce((sum, order) => sum + Number(order.total), 0), products, lowStock, recentOrders, weeklyOrders, weekStart };
    },
  };
}
