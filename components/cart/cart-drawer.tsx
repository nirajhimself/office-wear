"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X, ArrowRight } from "lucide-react";
import { useCart } from "./cart-provider";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="cart-drawer-backdrop"
            aria-label="Close shopping bag"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          <motion.aside
            className="cart-drawer"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <header className="cart-drawer-head">
              <div>
                <span className="eyebrow-dark">YOUR BAG</span>
                <h2>
                  {itemCount > 0
                    ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                    : "Your bag is empty"}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close bag"
                className="cart-drawer-close"
              >
                <X size={21} strokeWidth={1.6} />
              </button>
            </header>

            {items.length > 0 ? (
              <>
                <div className="cart-drawer-items">
                  {items.map((item) => (
                    <article className="drawer-item" key={item.key}>
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={onClose}
                        className="drawer-image"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100px, 120px"
                        />
                      </Link>

                      <div className="drawer-item-info">
                        <div className="drawer-item-top">
                          <div className="drawer-product-details">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={onClose}
                              className="drawer-product-name"
                            >
                              {item.name}
                            </Link>

                            <p>
                              {item.color} <span>·</span> Size {item.size}
                            </p>
                          </div>

                          <strong className="drawer-item-price">
                            {formatPrice(item.price * item.quantity)}
                          </strong>
                        </div>

                        <div className="drawer-item-bottom">
                          <div
                            className="mini-quantity"
                            aria-label={`Quantity: ${item.quantity}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                item.quantity > 1
                                  ? updateQuantity(item.key, item.quantity - 1)
                                  : removeItem(item.key)
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.key, item.quantity + 1)
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="remove-link"
                            onClick={() => removeItem(item.key)}
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <footer className="drawer-summary">
                  <div className="drawer-delivery-note">
                    {shipping === 0
                      ? "Complimentary delivery on your order"
                      : `Add ${formatPrice(1999 - subtotal)} more for complimentary delivery`}
                  </div>

                  <div className="drawer-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>

                  <div className="drawer-summary-row">
                    <span>Delivery</span>
                    <strong>
                      {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                    </strong>
                  </div>

                  <div className="drawer-total">
                    <span>Total</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>

                  <p className="drawer-tax-note">
                    Taxes included where applicable.
                  </p>

                  <Link
                    className="drawer-checkout"
                    href="/cart"
                    onClick={onClose}
                  >
                    <span>VIEW BAG & CHECKOUT</span>
                    <ArrowRight size={17} />
                  </Link>

                  <button
                    type="button"
                    className="drawer-continue-shopping"
                    onClick={onClose}
                  >
                    Continue shopping
                  </button>
                </footer>
              </>
            ) : (
              <div className="cart-drawer-empty">
                <span className="cart-empty-number">
                  01 — YOUR NEXT FAVOURITE
                </span>
                <h3>
                  Good style.
                  <br />
                  Great essentials.
                </h3>
                <p>
                  Discover considered everyday pieces designed to work harder in
                  your wardrobe.
                </p>

                <Link
                  href="/shop"
                  onClick={onClose}
                  className="drawer-checkout"
                >
                  <span>EXPLORE THE COLLECTION</span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
