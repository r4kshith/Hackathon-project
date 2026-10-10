import { redirect } from "next/navigation";
import { WebsiteSettingsForm } from "../../../components/admin/website-settings-form";
import { themes, type ThemeId } from "../../../lib/themes";
import { tenantData } from "../../../lib/tenant";

const defaultHomepageDescription = "Thoughtful finds, made and chosen with care. Take a look around and find something that feels like you.";

export default async function WebsitePage() {
  let scoped;
  try { scoped = await tenantData("OWNER"); } catch (error) { if (error instanceof Error && error.message === "TENANT_ACCESS_DENIED") redirect("/admin"); throw error; }
  const categories = await scoped.categories.list();
  const config = scoped.store.contentConfig && typeof scoped.store.contentConfig === "object" ? scoped.store.contentConfig as Record<string, unknown> : {};
  const themeConfig = scoped.store.themeConfig && typeof scoped.store.themeConfig === "object" ? scoped.store.themeConfig as { colors?: Record<string, string>; font?: string } : {};
  const themeId = (scoped.store.theme in themes ? scoped.store.theme : "atelier") as ThemeId;
  const theme = themes[themeId];
  const savedFont = themeConfig.font;
  const font = savedFont === "Arial, Helvetica, sans-serif" || savedFont === "Georgia, serif" || savedFont === "Trebuchet MS, sans-serif" ? savedFont : theme.font;
  const savedCategoryContent = config.categoryContent && typeof config.categoryContent === "object" ? config.categoryContent as Record<string, { description?: string; imageUrl?: string }> : {};
  const categoryContent = categories.map((category) => ({
    slug: category.slug,
    description: savedCategoryContent[category.slug]?.description ?? "",
    imageUrl: savedCategoryContent[category.slug]?.imageUrl ?? "",
  }));
  return <WebsiteSettingsForm storeName={scoped.store.name} categories={categories.map(({ id, name, slug }) => ({ id, name, slug, description: savedCategoryContent[slug]?.description ?? "", imageUrl: savedCategoryContent[slug]?.imageUrl ?? "" }))} initial={{
    themeId,
    primary: themeConfig.colors?.primary ?? theme.colors.primary,
    background: themeConfig.colors?.background ?? theme.colors.background,
    foreground: themeConfig.colors?.foreground ?? theme.colors.foreground,
    accent: themeConfig.colors?.accent ?? theme.colors.accent,
    font,
    homepageDescription: typeof config.homepageDescription === "string" ? config.homepageDescription : defaultHomepageDescription,
    bannerText: typeof config.bannerText === "string" ? config.bannerText : "",
    showCollections: config.showCollections !== false,
    showStory: config.showStory !== false,
    categoryContent,
  }} />;
}
