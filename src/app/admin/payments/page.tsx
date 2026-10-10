import { redirect } from "next/navigation";
import { PaymentsSettings } from "../../../components/admin/payments-settings";
import { getRazorpayDemoConfig } from "../../../lib/razorpay-demo";
import { tenantData } from "../../../lib/tenant";

export default async function PaymentsPage() {
  let scoped;
  try { scoped = await tenantData("OWNER"); } catch (error) { if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") redirect("/admin"); throw error; }
  const content = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
  return <PaymentsSettings enabled={content.razorpayDemoEnabled === true} configured={Boolean(getRazorpayDemoConfig())}/>;
}
