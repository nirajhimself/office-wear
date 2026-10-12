
"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreProduct as Product } from "@/lib/storefront";
import { useCart } from "@/components/cart/cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadWishlistState() {
      try {
        const response = await fetch("/api/wishlist", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        const items = data.items ?? [];

        if (active) {
          setLiked(
            items.some(
              (item: { productId?: string; product?: { id?: string } }) =>
                (item.productId ?? item.product?.id) === product.id
            )
          );
        }
      } catch {
        // Keep the default heart state if the wishlist cannot load.
      }
    }

    void loadWishlistState();

    return () => {
      active = false;
    };
  }, [product.id]);

  async function toggleWishlist() {
    if (wishlistLoading) return;

    setWishlistLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`
        );
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Could not update wishlist.");
        return;
      }

      setLiked(Boolean(data.liked));
    } catch {
      setMessage("Please check your connection and try again.");
    } finally {
      setWishlistLoading(false);
    }
  }

  function quickAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      size: product.sizes[0],
      color: product.color,
      quantity: 1,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="catalog-card">
      <div className="catalog-image-wrap">
        <Link
          href={`/product/${product.slug}`}
          className="catalog-image"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 560px) 50vw, (max-width: 900px) 50vw, 33vw"
          />
          <Image
            className="catalog-image-hover"
            src={product.hoverImage}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 560px) 50vw, (max-width: 900px) 50vw, 33vw"
          />
          {product.badge && (
            <span className="catalog-badge">{product.badge}</span>
          )}
        </Link>

        <button
          className={`catalog-wishlist ${liked ? "is-liked" : ""}`}
          type="button"
          aria-label={
            liked
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name}`
          }
          aria-pressed={liked}
          disabled={wishlistLoading}
          onClick={toggleWishlist}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={liked ? "currentColor" : "none"}
          />
        </button>

        {message && (
          <span role="status" className="catalog-wishlist-message">
            {message}
          </span>
        )}

        <button
          className={`catalog-quick-add ${added ? "is-added" : ""}`}
          type="button"
          onClick={quickAdd}
          aria-label={`Quick add ${product.name}`}
        >
          <Plus size={16} strokeWidth={1.6} />
          {added ? "Added" : "Quick add"}
        </button>
      </div>

      <div className="catalog-meta">
        <div>
          <Link href={`/product/${product.slug}`} className="catalog-name">
            {product.name}
          </Link>
          <p>
            {product.color} · {product.colors.length} colours
          </p>
        </div>
        <strong>₹{product.price.toLocaleString("en-IN")}</strong>
      </div>
    </article>
  );
}
