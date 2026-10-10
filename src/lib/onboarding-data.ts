import { db } from "./db";
import { categorySeed, productsForCategory } from "./catalogue";
import { themes, type ThemeId } from "./themes";

function toSlug(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "my-store";
}

async function uniqueSlug(name: string) {
  const base = toSlug(name);
  for (let suffix = 1; suffix < 100; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    if (!(await db.store.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function ownedStoreSlug(userId: string) {
  return db.storeMember.findFirst({ where: { userId, role: "OWNER" }, select: { store: { select: { slug: true } } } });
}

export async function createOnboardedStore(userId: string, data: { storeName: string; businessType: string; email: string; phone: string; address: string; categoryIndexes: number[]; customCategories: string[]; themeId: ThemeId; logoDataUrl: string | null }) {
  const slug = await uniqueSlug(data.storeName);
  const selected = [...new Map([...data.categoryIndexes.map((index) => categorySeed[index]?.name).filter((name): name is string => Boolean(name)), ...data.customCategories].map((name) => [toSlug(name), name])).values()];
  return db.$transaction(async (tx) => {
    if (await tx.storeMember.findFirst({ where: { userId }, select: { id: true } })) throw new Error("ALREADY_HAS_STORE");
    const store = await tx.store.create({ data: {
      name: data.storeName, slug, businessType: data.businessType, email: data.email, phone: data.phone,
      address: data.address ? { line1: data.address } : undefined, logoUrl: data.logoDataUrl,
      theme: data.themeId, themeConfig: themes[data.themeId], onboardingDone: true, onboardingStep: 5,
    } });
    await tx.storeMember.create({ data: { storeId: store.id, userId, role: "OWNER" } });
    for (const categoryName of selected) {
      const category = await tx.category.create({ data: { storeId: store.id, name: categoryName, slug: toSlug(categoryName) } });
      const seedIndex = data.categoryIndexes.find((categoryIndex) => categorySeed[categoryIndex]?.name === categoryName);
      if (seedIndex !== undefined) {
        for (const product of productsForCategory(seedIndex)) await tx.product.create({ data: { ...product, price: product.price, compareAt: product.compareAt, storeId: store.id, categoryId: category.id } });
      }
    }
    return { id: store.id, slug: store.slug };
  });
}
