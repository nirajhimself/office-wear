"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { AuthStatus } from "@/components/auth/auth-status";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCart } from "@/components/cart/cart-provider";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { label: "Shop", href: "/shop" },
  { label: "New", href: "/shop?sort=newest" },
  { label: "Men", href: "/shop?gender=Men" },
  { label: "Women", href: "/shop?gender=Women" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { count, mounted } = useCart();
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="mobile-icon" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>

        <Link href="/" className="brand-lockup" aria-label="OFFICE WEAR home">
          <Image src="/assets/brand/logo.png" alt="OFFICE WEAR" width={2048} height={2048} priority className="brand-logo" />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => <Link key={link.label} href={link.href}>{link.label}</Link>)}
        </nav>

        <div className="header-actions">
          <Link href="/search" aria-label="Search"><Search size={19} strokeWidth={1.6} /></Link>
          <Link href="/account" aria-label="Account"><UserRound size={19} strokeWidth={1.6} /></Link>
          <button aria-label={`Bag${mounted ? `, ${count} items` : ""}`} className="bag-link" onClick={() => setCartOpen(true)}><ShoppingBag size={19} strokeWidth={1.6} /><span>{mounted ? count : 0}</span></button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {links.map((link, index) => (
              <motion.div key={link.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
                <Link href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
              </motion.div>
            ))}
            <div className="mobile-menu-meta"><span>OFFICE WEAR</span><span>India · 2026</span></div>
          </motion.div>
        )}
      </AnimatePresence>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
