export type CartItem = { id: string; name: string; slug: string; imageUrl: string | null; price: number; stock: number; quantity: number };

export function cartKey(slug: string) { return `launch-cart-${slug}`; }
export function readCart(slug: string): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cartKey(slug)) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => Boolean(item && typeof item.id === "string" && typeof item.quantity === "number"));
  } catch { return []; }
}
export function writeCart(slug: string, items: CartItem[]) {
  localStorage.setItem(cartKey(slug), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("store-cart-updated", { detail: { slug } }));
}
