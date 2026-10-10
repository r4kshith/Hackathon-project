"use server";

import { z } from "zod";
import { tenantData } from "../../../lib/tenant";

const variantSchema = z.object({ label: z.string().trim().max(30).optional(), values: z.array(z.string().trim().min(1).max(40)).max(30).default([]), stocks: z.array(z.number().int().min(0).max(1_000_000)).max(30).default([]) });
const productSchema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(2).max(4000), price: z.coerce.number().min(0.01).max(1_000_000), compareAt: z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().min(0.01).max(1_000_000).nullable()), sku: z.string().trim().max(60).optional(), stock: z.coerce.number().int().min(0).max(1_000_000), categoryId: z.string().nullable(), imageUrl: z.string().max(2_000_000).nullable(), variants: variantSchema.optional() });

function slugify(value: string) { return `${value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "product"}-${crypto.randomUUID().slice(0, 5)}`; }
function parseInput(raw: unknown) { const parsed = productSchema.safeParse(raw); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the product details." }; if (parsed.data.compareAt !== null && parsed.data.compareAt <= parsed.data.price) return { error: "Original price must be higher than the sale price." }; if (parsed.data.imageUrl && !/^(https:\/\/|data:image\/(png|jpeg|webp|svg\+xml);base64,)/i.test(parsed.data.imageUrl)) return { error: "Use an https image URL or upload a supported image." }; return { data: parsed.data }; }

export async function saveProductAction(raw: unknown, productId?: string) {
  const parsed = parseInput(raw);
  if ("error" in parsed) return parsed;
  const { data } = parsed;
  const variants = (data.variants?.label && data.variants.values.length) ? data.variants.values : [];
  try {
    const scoped = await tenantData();
    if (data.categoryId && !await scoped.categories.exists(data.categoryId)) return { error: "Choose a category from your store." };
    if (!productId) {
      const product = await scoped.products.create({ name: data.name, slug: slugify(data.name), description: data.description, price: data.price, compareAt: data.compareAt, sku: data.sku || null, stock: data.stock, categoryId: data.categoryId || null, imageUrl: data.imageUrl });
      if (variants.length) await scoped.products.replaceVariants(product.id, variants.map((value, index) => ({ name: `${data.variants?.label}: ${value}`, sku: data.sku ? `${data.sku}-${value}`.slice(0, 60) : null, options: { [data.variants?.label ?? "option"]: value }, stock: data.variants?.stocks[index] ?? 0 })));
    } else {
      const result = await scoped.products.update(productId, { name: data.name, description: data.description, price: data.price, compareAt: data.compareAt, sku: data.sku || null, stock: data.stock, categoryId: data.categoryId || null, imageUrl: data.imageUrl, slug: slugify(data.name) });
      if (!result.count) return { error: "That product was not found in this store." };
      const replaced = await scoped.products.replaceVariants(productId, variants.map((value, index) => ({ name: `${data.variants?.label}: ${value}`, sku: data.sku ? `${data.sku}-${value}`.slice(0, 60) : null, options: { [data.variants?.label ?? "option"]: value }, stock: data.variants?.stocks[index] ?? 0 })));
      if (!replaced) return { error: "That product was not found in this store." };
    }
    return { ok: true };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { error: "That SKU is already used by another product in your store." };
    if (error instanceof Error && error.message.includes("Can't reach database server")) return { error: "Database is unavailable. Start PostgreSQL, then try saving again." };
    console.error(JSON.stringify({ level: "error", event: "product_save_failed", error: error instanceof Error ? error.name : "unknown" }));
    return { error: "We couldn't save that product yet." };
  }
}

export async function deleteProductAction(productId: string) {
  const scoped = await tenantData();
  const result = await scoped.products.remove(productId);
  return result.count ? { ok: true } : { error: "That product was not found in this store." };
}

export async function bulkEditProductsAction(raw: unknown) {
  const parsed = z.object({ ids: z.array(z.string().min(1)).min(1).max(100), operation: z.enum(["price-percent", "stock-change"]), value: z.number().min(-90).max(500) }).safeParse(raw);
  if (!parsed.success) return { error: "Choose products and enter a valid bulk update." };
  const scoped = await tenantData();
  const updated = await scoped.products.bulkEdit(parsed.data.ids, parsed.data.operation, parsed.data.value);
  return { ok: true, updated };
}
