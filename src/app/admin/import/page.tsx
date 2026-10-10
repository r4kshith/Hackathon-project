import { tenantData } from "../../../lib/tenant";
import { ProductImport } from "../../../components/admin/product-import";

export default async function ImportPage() {
  const scoped = await tenantData();
  const categories = await scoped.categories.list();
  return <ProductImport categories={categories.map(({ id, name }) => ({ id, name }))} />;
}
