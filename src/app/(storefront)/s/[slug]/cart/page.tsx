import { CartScreen } from "../../../../../components/storefront/cart-screen";

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CartScreen slug={slug} />;
}
