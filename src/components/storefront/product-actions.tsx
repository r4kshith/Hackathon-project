"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "../ui";
import { readCart, writeCart } from "../../lib/cart";
type CartProduct = { id: string; name: string; slug: string; imageUrl: string | null; price: number; stock: number };

export function AddToCartButton({ storeSlug, product, fullWidth = true }: { storeSlug: string; product: CartProduct; fullWidth?: boolean }) {
  const [added, setAdded] = useState(false);
  function add() {
    const items = readCart(storeSlug);
    const current = items.find((item) => item.id === product.id);
    if (current) current.quantity = Math.min(product.stock, current.quantity + 1);
    else items.push({ id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, price: product.price, stock: product.stock, quantity: 1 });
    writeCart(storeSlug, items);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }
  return <Button type="button" onClick={add} disabled={product.stock <= 0} style={{ backgroundColor: "var(--store-primary)" }} className={`storefront-add-button mt-3 text-white transition hover:opacity-90 ${fullWidth ? "w-full" : ""}`}>
    {added ? <><Check size={16} className="mr-2" />Added to bag</> : <><ShoppingBag size={16} className="mr-2" />{product.stock > 0 ? "Add to bag" : "Sold out"}</>}
  </Button>;
}
