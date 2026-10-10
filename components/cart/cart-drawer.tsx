"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "./cart-provider";

function formatPrice(value: number) { return `₹${value.toLocaleString("en-IN")}`; }

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="cart-drawer-backdrop" aria-label="Close bag" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="cart-drawer" aria-label="Shopping bag" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .45, ease: [.2,.7,.2,1] }}>
            <header className="cart-drawer-head"><div><span className="eyebrow-dark">Your bag</span><h2>{items.length ? `${items.reduce((sum, item) => sum + item.quantity, 0)} ${items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"}` : "Nothing here yet"}</h2></div><button onClick={onClose} aria-label="Close bag"><X size={20} /></button></header>
            {items.length ? (
              <>
                <div className="cart-drawer-items">
                  {items.map((item) => (
                    <div className="drawer-item" key={item.key}>
                      <Link href={`/product/${item.slug}`} onClick={onClose} className="drawer-image"><Image src={item.image} alt={item.name} fill sizes="96px" /></Link>
                      <div className="drawer-item-info"><div className="drawer-item-top"><div><Link href={`/product/${item.slug}`} onClick={onClose}>{item.name}</Link><p>{item.color} · Size {item.size}</p></div><strong>{formatPrice(item.price * item.quantity)}</strong></div><div className="drawer-item-bottom"><div className="mini-quantity"><button onClick={() => item.quantity > 1 ? updateQuantity(item.key, item.quantity - 1) : removeItem(item.key)} aria-label="Decrease quantity"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Plus size={12} /></button></div><button className="remove-link" onClick={() => removeItem(item.key)}><Trash2 size={13} /> Remove</button></div></div>
                    </div>
                  ))}
                </div>
                <div className="drawer-summary"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Delivery</span><strong>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</strong></div><div className="drawer-total"><span>Total</span><strong>{formatPrice(total)}</strong></div><p>Complimentary delivery on orders over ₹1,999.</p><Link className="drawer-checkout" href="/cart" onClick={onClose}>View bag & checkout</Link></div>
              </>
            ) : (
              <div className="cart-drawer-empty"><span>01</span><h3>Start with something<br />you'll wear often.</h3><p>Considered pieces for meetings, commutes and everything in between.</p><Link href="/shop" onClick={onClose}>Explore the collection <span>→</span></Link></div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
