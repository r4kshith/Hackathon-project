import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole, OrderStatus } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";
import { categorySeed, productsForCategory } from "../src/lib/catalogue";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "launch-demo-2026";

async function account(email: string, name: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.upsert({ where: { email }, update: { name, passwordHash }, create: { email, name, passwordHash } });
}

async function membership(storeId: string, userId: string, role: UserRole) {
  await prisma.storeMember.upsert({ where: { storeId_userId: { storeId, userId } }, update: { role }, create: { storeId, userId, role } });
}

async function seedStore(input: { slug: string; name: string; theme: string; ownerId: string; staffId?: string }) {
  const store = await prisma.store.upsert({ where: { slug: input.slug }, update: { name: input.name, theme: input.theme, onboardingDone: true }, create: { name: input.name, slug: input.slug, businessType: "Lifestyle", theme: input.theme, onboardingDone: true } });
  await membership(store.id, input.ownerId, UserRole.OWNER);
  if (input.staffId) await membership(store.id, input.staffId, UserRole.STAFF);
  const products: { id: string; price: number; name: string }[] = [];
  for (let categoryIndex = 0; categoryIndex < categorySeed.length; categoryIndex++) {
    const category = categorySeed[categoryIndex]!;
    const savedCategory = await prisma.category.upsert({ where: { storeId_slug: { storeId: store.id, slug: category.prefix } }, update: { name: category.name }, create: { storeId: store.id, name: category.name, slug: category.prefix } });
    for (const product of productsForCategory(categoryIndex)) {
      const saved = await prisma.product.upsert({ where: { storeId_slug: { storeId: store.id, slug: product.slug } }, update: { name: product.name, categoryId: savedCategory.id, description: product.description, price: product.price, compareAt: product.compareAt, stock: product.stock, imageUrl: product.imageUrl, active: true }, create: { storeId: store.id, categoryId: savedCategory.id, ...product } });
      products.push({ id: saved.id, price: product.price, name: product.name });
    }
  }
  await prisma.order.deleteMany({ where: { storeId: store.id } });
  const customer = await prisma.customer.upsert({ where: { storeId_email: { storeId: store.id, email: `customer@${input.slug}.demo` } }, update: { name: "Taylor Morgan" }, create: { storeId: store.id, name: "Taylor Morgan", email: `customer@${input.slug}.demo`, phone: "+1 555 010 2026" } });
  const statuses = [OrderStatus.DELIVERED, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.PLACED] as const;
  for (let i = 0; i < 24; i++) {
    const product = products[(i * 7 + i % 3) % products.length]!;
    const quantity = 1 + (i % 3);
    const subtotal = product.price * quantity;
    const date = new Date(Date.now() - (i * 2 + 1) * 86400000);
    await prisma.order.create({ data: { storeId: store.id, customerId: customer.id, orderNumber: `${input.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(5, "0")}`, status: statuses[i % statuses.length], subtotal, shipping: 0, total: subtotal, createdAt: date, paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", shippingAddress: { name: customer.name, address: "18 Market Street", city: "Portland", postalCode: "97201", country: "United States" }, items: { create: { storeId: store.id, productId: product.id, productName: product.name, quantity, unitPrice: product.price, lineTotal: subtotal } } } });
  }
  return store;
}

async function main() {
  const [ownerA, staffA, ownerB] = await Promise.all([account("owner@demo.launch", "Alex Morgan"), account("staff@demo.launch", "Jamie Lee"), account("owner@demo-b.launch", "Riley Chen")]);
  await seedStore({ slug: "northstar-goods", name: "Northstar Goods", theme: "atelier", ownerId: ownerA.id, staffId: staffA.id });
  await seedStore({ slug: "field-notes-market", name: "Field Notes Market", theme: "grove", ownerId: ownerB.id });
  console.info(`Seeded two demo stores and 48 orders. Shared password: ${DEMO_PASSWORD}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
