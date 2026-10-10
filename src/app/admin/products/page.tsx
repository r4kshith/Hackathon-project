import { tenantData } from "../../../lib/tenant";
import { ProductManager } from "../../../components/admin/product-manager";

export default async function ProductsPage() {
  const scoped = await tenantData();
  const [products, categories] = await Promise.all([scoped.products.list(), scoped.categories.list()]);
  const serializable = products.map((product) => ({ ...product, price: Number(product.price), compareAt: product.compareAt ? Number(product.compareAt) : null, variants: product.variants.map((variant) => ({ ...variant, price: variant.price ? Number(variant.price) : null })) }));
  return <ProductManager initialProducts={serializable} categories={categories.map(({ id, name }) => ({ id, name }))} />;
}
