"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function CartPage() {
  const { items, mounted, subtotal, updateQuantity, removeItem } = useCart();
  const FREE_SHIPPING_THRESHOLD = 999;
  const STANDARD_SHIPPING = 99;

  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING;

  const total = subtotal + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const suggestions = products
    .filter((product) => !items.some((item) => item.productId === product.id))
    .slice(0, 4);

  if (!mounted)
    return (
      <div className="cart-page cart-loading">
        <span className="eyebrow-dark">Your bag</span>
        <h1>Loading your bag.</h1>
      </div>
    );

  return (
    <div className="cart-page">
      <section className="cart-intro">
        <div>
          <span className="eyebrow-dark">OFFICE WEAR · BAG</span>
          <h1>{items.length ? "Your bag." : "Nothing here yet."}</h1>
          <p>
            {items.length
              ? "Review your pieces before you continue to checkout."
              : "Start with the pieces you’ll reach for on repeat."}
          </p>
        </div>
        <span className="cart-index">
          {String(items.reduce((sum, item) => sum + item.quantity, 0)).padStart(
            2,
            "0",
          )}
        </span>
      </section>

      {items.length ? (
        <>
          <section className="cart-layout">
            <div className="cart-items-panel">
              <div className="cart-panel-head">
                <span>Item</span>
                <span>Total</span>
              </div>
              {items.map((item) => (
                <article className="cart-line" key={item.key}>
                  <Link
                    href={`/product/${item.slug}`}
                    className="cart-line-image"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="180px"
                    />
                  </Link>
                  <div className="cart-line-main">
                    <div className="cart-line-copy">
                      <span className="cart-line-category">OFFICE WEAR</span>
                      <Link href={`/product/${item.slug}`}>
                        <h2>{item.name}</h2>
                      </Link>
                      <p>
                        {item.color} · Size {item.size}
                      </p>
                    </div>
                    <strong className="cart-line-price">
                      {formatPrice(item.price * item.quantity)}
                    </strong>
                  </div>
                  <div className="cart-line-actions">
                    <div className="quantity-control">
                      <button
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
                        onClick={() =>
                          updateQuantity(item.key, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      className="remove-cart"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <div className="cart-summary-head">
                <span className="eyebrow-dark">Order summary</span>
                <span>
                  {items.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <div className="summary-rows">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>
                    {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                  </strong>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
              </div>
              {remaining > 0 && (
                <div className="free-shipping-note">
                  <span>
                    You're ₹{remaining.toLocaleString("en-IN")} away from
                    complimentary delivery.
                  </span>
                  <div>
                    <i
                      style={{
                        width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="coupon-note">
                <span>Discount code</span>
                <p>
                  Use a valid code at checkout. Welcome offer: WELCOME10 on
                  qualifying orders.
                </p>
              </div>
              <Link className="checkout-placeholder" href="/checkout">
                Continue to checkout <ArrowRight size={16} />
              </Link>
              <p className="checkout-note">
                Secure checkout with online payment or cash on delivery.
              </p>
              <Link href="/shop" className="continue-shopping">
                Continue shopping <ArrowRight size={14} />
              </Link>
            </aside>
          </section>

          <section className="cart-recommendations">
            <div className="section-heading">
              <div>
                <span className="eyebrow-dark">A considered addition</span>
                <h2>You may like.</h2>
              </div>
              <Link href="/shop" className="text-link">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="product-grid">
              {suggestions.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="empty-cart">
          <div className="empty-cart-mark">
            <ShoppingBag size={28} strokeWidth={1.2} />
          </div>
          <span className="eyebrow-dark">THE FIRST EDIT</span>
          <h2>
            Good pieces deserve
            <br />
            to be worn often.
          </h2>
          <p>
            Explore the collection and find the pieces that make your workday
            feel a little more considered.
          </p>
          <Link href="/shop" className="button button-dark">
            Explore the collection <ArrowRight size={15} />
          </Link>
        </section>
      )}
    </div>
  );
}
