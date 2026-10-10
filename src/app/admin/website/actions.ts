"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  font: z.enum(["Arial, Helvetica, sans-serif", "Georgia, serif", "Trebuchet MS, sans-serif"]),
  homepageDescription: z.string().trim().min(1, "Add a short description for your homepage.").max(400),
  bannerText: z.string().trim().max(140),
  showCollections: z.boolean(),
  showStory: z.boolean(),
  categoryContent: z.array(categorySchema).max(20),
});

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
