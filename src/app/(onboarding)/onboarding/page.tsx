import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/auth";
import { ownedStoreSlug } from "../../../lib/onboarding-data";
import { OnboardingWizard } from "./wizard";
import { BrandLogo } from "../../../components/brand/brand-logo";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const existing = await ownedStoreSlug(user.id);
  if (existing) redirect(`/s/${existing.store.slug}`);
  return <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10"><header className="mx-auto flex max-w-5xl items-center justify-between"><BrandLogo /><span className="text-sm text-muted">Setup takes about 3 minutes</span></header><OnboardingWizard ownerName={user.name} /></main>;
}
