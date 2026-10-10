import { redirect } from "next/navigation";
import { requireTenant } from "../../lib/tenant";
import { AdminFrame } from "../../components/admin/admin-frame";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const { store, role } = await requireTenant();
    return <AdminFrame store={{ name: store.name, slug: store.slug }} role={role}>{children}</AdminFrame>;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") redirect("/onboarding");
    throw error;
  }
}
