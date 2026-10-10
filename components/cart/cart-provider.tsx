"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  mounted: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "office-wear-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setMounted(true);

    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    window.addEventListener("office-wear-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("office-wear-cart-updated", sync);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, mounted]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    mounted,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item) => setItems((current) => {
      const key = `${item.productId}-${item.color}-${item.size}`;
      const existing = current.find((entry) => entry.key === key);
      if (existing) return current.map((entry) => entry.key === key ? { ...entry, quantity: entry.quantity + item.quantity } : entry);
      return [...current, { ...item, key }];
    }),
    updateQuantity: (key, quantity) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: (key) => setItems((current) => current.filter((item) => item.key !== key)),
    clearCart: () => setItems([]),
  }), [items, mounted]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
