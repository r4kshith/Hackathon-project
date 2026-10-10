"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { tenantData } from "../../../lib/tenant";

const categorySchema = z.object({
  slug: z.string().min(1).max(120),
  description: z.string().trim().max(300, "Collection descriptions must be 300 characters or fewer."),
  imageUrl: z.union([z.literal(""), z.string().url().max(2048)]),
});

const schema = z.object({
  themeId: z.enum(["atelier", "market", "studio", "grove", "sunset", "aurora", "midnight", "forest"]),
  primary: z.string().regex(/^#[0-9a-f]{6}$/i),
  background: z.string().regex(/^#[0-9a-f]{6}$/i),
  foreground: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  font: z.enum(["var(--font-bodoni), Georgia, serif", "var(--font-dm-sans), system-ui, sans-serif", "var(--font-manrope), system-ui, sans-serif"]),
  homepageDescription: z.string().trim().min(1, "Add a short description for your homepage.").max(400),
  bannerText: z.string().trim().max(140),
  showCollections: z.boolean(),
  showStory: z.boolean(),
  categoryContent: z.array(categorySchema).max(20),
});

const categoryNameSchema = z.string().trim().min(2, "Collection name must be at least 2 characters.").max(40, "Collection names must be 40 characters or fewer.");

function categorySlug(name: string) {
  const base = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "collection";
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createWebsiteCategoryAction(rawName: unknown) {
  const parsed = categoryNameSchema.safeParse(rawName);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a collection name." };
  try {
    const scoped = await tenantData("OWNER");
    if ((await scoped.categories.list()).length >= 20) return { error: "You can have up to 20 collections in your store." };
    if (await scoped.categories.byName(parsed.data)) return { error: "A collection with that name already exists." };
    const category = await scoped.categories.create(parsed.data, categorySlug(parsed.data));
    revalidatePath("/admin/website");
    revalidatePath(`/s/${scoped.store.slug}`, "page");
    return { ok: true, category: { id: category.id, name: category.name, slug: category.slug, description: "", imageUrl: "" } };
  } catch (error) {
    console.error("Website collection creation failed", error instanceof Error ? error.name : "unknown error");
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { error: "Your session expired. Sign in again to add a collection." };
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") return { error: "Only the store owner can manage collections." };
    return { error: "We couldn't add this collection. Please try again." };
  }
}

export async function deleteWebsiteCategoryAction(rawSlug: unknown) {
  const parsed = z.string().min(1).max(120).safeParse(rawSlug);
  if (!parsed.success) return { error: "Choose a valid collection to remove." };
  try {
    const scoped = await tenantData("OWNER");
    const category = (await scoped.categories.list()).find((item) => item.slug === parsed.data);
    if (!category) return { error: "This collection no longer exists. Refresh the page and try again." };
    const removed = await scoped.categories.remove(category.id);
    if (!removed) return { error: "This collection changed while you were editing. Refresh and try again." };
    const previous = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
    const existingContent = previous.categoryContent && typeof previous.categoryContent === "object" ? previous.categoryContent as Record<string, unknown> : {};
    const categoryContent = Object.fromEntries(Object.entries(existingContent).filter(([slug]) => slug !== category.slug)) as Prisma.InputJsonObject;
    await scoped.storeSettings.update({ contentConfig: { ...previous, categoryContent } as Prisma.InputJsonObject });
    revalidatePath("/admin/website");
    revalidatePath(`/s/${scoped.store.slug}`, "page");
    revalidatePath(`/s/${scoped.store.slug}/c/${category.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("Website collection deletion failed", error instanceof Error ? error.name : "unknown error");
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { error: "Your session expired. Sign in again to remove a collection." };
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") return { error: "Only the store owner can manage collections." };
    return { error: "We couldn't remove this collection. Please try again." };
  }
}

export async function updateWebsiteAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your website details." };
  const data = parsed.data;
  if (data.categoryContent.some((category) => category.imageUrl && !category.imageUrl.startsWith("https://"))) return { error: "Collection image URLs must use HTTPS." };
  if (new Set(data.categoryContent.map((category) => category.slug)).size !== data.categoryContent.length) return { error: "A collection is listed more than once. Refresh and try again." };

  try {
    const scoped = await tenantData("OWNER");
    const categories = await scoped.categories.list();
    const knownSlugs = new Set(categories.map((category) => category.slug));
    if (data.categoryContent.some((category) => !knownSlugs.has(category.slug))) return { error: "A collection changed while you were editing. Refresh and try again." };
    const previous = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
    const categoryContent = Object.fromEntries(data.categoryContent.map(({ slug, description, imageUrl }) => [slug, { description, imageUrl: imageUrl || "" }]));
    const result = await scoped.storeSettings.update({
      theme: data.themeId,
      themeConfig: { colors: { primary: data.primary, background: data.background, foreground: data.foreground, accent: data.accent }, font: data.font },
      contentConfig: { ...previous, homepageDescription: data.homepageDescription, bannerText: data.bannerText, showCollections: data.showCollections, showStory: data.showStory, categoryContent },
    });
    if (!result.count) return { error: "Your store could not be found. Refresh and try again." };
    revalidatePath("/admin/website");
    revalidatePath(`/s/${scoped.store.slug}`, "page");
    for (const category of categories) revalidatePath(`/s/${scoped.store.slug}/c/${category.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("Website customization save failed", error instanceof Error ? error.name : "unknown error");
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { error: "Your session expired. Sign in again to save your website." };
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") return { error: "Only the store owner can customize this website." };
    if (error instanceof Error && error.message.includes("Can't reach database server")) return { error: "Database is unavailable. Start PostgreSQL, then try saving again." };
    return { error: "We couldn't save your website changes. Please try again." };
  }
}
