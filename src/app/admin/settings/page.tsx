import { redirect } from "next/navigation";
import { tenantData } from "../../../lib/tenant";
import { StoreSettingsForm } from "../../../components/admin/store-settings-form";

export default async function SettingsPage() {
  let scoped;
  try { scoped = await tenantData("OWNER"); } catch (error) { if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") redirect("/admin"); throw error; }
  const config = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
  return <StoreSettingsForm initial={{ name: scoped.store.name, email: scoped.store.email ?? "", phone: scoped.store.phone ?? "", logoUrl: scoped.store.logoUrl ?? "", footerText: String(config.footerText ?? "") }} />;
}
