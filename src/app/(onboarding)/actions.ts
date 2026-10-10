"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/auth";
import { createOnboardedStore } from "../../lib/onboarding-data";

const inputSchema = z.object({
  storeName: z.string().trim().min(2).max(80), businessType: z.string().trim().min(2).max(80), email: z.email(), phone: z.string().trim().min(7).max(30), address: z.string().trim().max(240),
  categoryIndexes: z.array(z.number().int().min(0).max(7)).min(1).max(8), customCategories: z.array(z.string().trim().min(2).max(40)).max(10), themeId: z.enum(["atelier", "market", "studio", "grove", "sunset", "aurora", "midnight", "forest"]), logoDataUrl: z.string().max(2_000_000).nullable().refine((value) => !value || /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(value), "Logo must be a valid supported image."),
});

export async function finishOnboardingAction(raw: unknown) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const data = parsed.data;
  try {
    const store = await createOnboardedStore(user.id, data);
    return { ok: true, slug: store.slug };
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_HAS_STORE") return { error: "Your account already belongs to a store. Open it from your dashboard." };
    console.error(JSON.stringify({ level: "error", event: "onboarding_failed", error: error instanceof Error ? error.message : "unknown" }));
    return { error: "We couldn't save your store yet. Please try again." };
  }
}
