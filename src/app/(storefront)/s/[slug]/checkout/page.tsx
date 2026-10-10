import { CheckoutForm } from "../../../../../components/storefront/checkout-form";
import { notFound } from "next/navigation";
import { storefrontBySlug } from "../../../../../lib/storefront-data";
import { getRazorpayDemoConfig } from "../../../../../lib/razorpay-demo";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await storefrontBySlug(slug);
  if (!store) notFound();
  const content = store.contentConfig && typeof store.contentConfig === "object" ? store.contentConfig as Record<string, unknown> : {};
  const config = getRazorpayDemoConfig();
  const themeConfig = store.themeConfig && typeof store.themeConfig === "object" ? store.themeConfig as { colors?: { primary?: string } } : {};
  return <CheckoutForm slug={slug} storeName={store.name} razorpayEnabled={content.razorpayDemoEnabled === true && Boolean(config)} razorpayKeyId={config?.keyId ?? ""} primaryColor={themeConfig.colors?.primary ?? "#386b5b"} />;
}
