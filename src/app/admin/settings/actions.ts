"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { tenantData } from "../../../lib/tenant";

const schema = z.object({
  name: z.string().trim().min(2, "Store name must be at least 2 characters.").max(80, "Store name must be 80 characters or fewer."),
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email address.")]).nullable(),
  phone: z.union([z.literal(""), z.string().trim().min(7, "Phone number must be at least 7 characters.").max(30, "Phone number must be 30 characters or fewer.")]).nullable(),
  logoUrl: z.union([z.literal(""), z.string().max(5_000_000, "Logo image is too large.")]).nullable(),
  footerText: z.string().max(300, "Footer text must be 300 characters or fewer."),
});

export async function updateStoreSettingsAction(raw: unknown) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your settings." };
  const { data } = parsed;
  if (data.logoUrl && !/^(https:\/\/|data:image\/(png|jpeg|webp|svg\+xml);base64,)/i.test(data.logoUrl)) return { error: "Use an https logo URL or upload a supported image." };
  try {
    const scoped = await tenantData("OWNER");
    const old = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
    const result = await scoped.storeSettings.update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      logoUrl: data.logoUrl || null,
      contentConfig: { ...old, footerText: data.footerText }
    });
    if (!result.count) return { error: "Your store could not be found. Refresh and try again." };
    revalidatePath("/admin/settings");
    revalidatePath("/admin/website");
    revalidatePath(`/s/${scoped.store.slug}`, "page");
    return { ok: true };
  } catch (error) {
    console.error("Store settings save failed", error instanceof Error ? error.name : "unknown error");
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { error: "Your session expired. Sign in again to save settings." };
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") return { error: "Only the store owner can change these settings." };
    if (error instanceof Error && error.message.includes("Can't reach database server")) return { error: "Database is unavailable. Start PostgreSQL, then try saving again." };
    return { error: "We couldn't save your settings. Please try again." };
  }
}
