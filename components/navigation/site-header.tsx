
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  Heart,
  House,
  LayoutGrid,
} from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCart } from "@/components/cart/cart-provider";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Men", href: "/shop?gender=Men" },
  { label: "Women", href: "/shop?gender=Women" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

const mobileLinks = [
  { label: "Home", href: "/", icon: House },
  { label: "Categories", href: "/shop", icon: LayoutGrid },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Bag", href: "/cart", icon: ShoppingBag },
  { label: "Profile", href: "/account", icon: UserRound },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { count, mounted } = useCart();

  const itemCount = mounted ? count : 0;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="mobile-icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link
            href="/"
            className="brand-lockup"
            aria-label="OFFICE WEAR home"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/assets/brand/logo.png"
              alt="OFFICE WEAR"
              width={2048}
              height={2048}
              priority
              className="brand-logo"
            />
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/search" aria-label="Search" title="Search">
              <Search size={21} strokeWidth={1.7} />
            </Link>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              title="Wishlist"
              className="mobile-wishlist"
            >
              <Heart size={21} strokeWidth={1.7} />
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              title="Account"
              className="desktop-account"
            >
              <UserRound size={20} strokeWidth={1.7} />
            </Link>

            <button
              type="button"
              aria-label={`Open shopping bag, ${itemCount} items`}
              title="Shopping bag"
              className="bag-link"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={22} strokeWidth={1.7} />
              <span>{itemCount}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mobile-menu-heading">
                <span>EXPLORE OFFICE WEAR</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {links.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </motion.div>
              ))}

              <div className="mobile-menu-meta">
                <span>OFFICE WEAR</span>
                <span>INDIA · 2026</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
        />
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileLinks.map(({ label, href, icon: Icon }) => {
          if (label === "Bag") {
            return (
              <button
                key={label}
                type="button"
                className="mobile-bottom-item"
                onClick={() => setCartOpen(true)}
                aria-label={`Open bag, ${itemCount} items`}
              >
                <span className="mobile-bottom-icon">
                  <ShoppingBag size={21} strokeWidth={1.7} />
                  {itemCount > 0 && (
                    <span className="mobile-bag-count">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className="mobile-bottom-item"
              onClick={() => setOpen(false)}
            >
              <Icon size={21} strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
