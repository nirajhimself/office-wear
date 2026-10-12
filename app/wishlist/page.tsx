
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  gender: string;
  images: { url: string; alt?: string | null }[];
  variants: { price: number }[];
};

type WishlistItem = {
  id: string;
  productId: string;
  product: WishlistProduct;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/login?next=%2Fwishlist");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load your wishlist.");
      }

      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  async function removeItem(productId: string) {
    if (removingId) return;

    setRemovingId(productId);
    setError("");

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        router.push("/login?next=%2Fwishlist");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove this item.");
      }

      if (data.liked === false) {
        setItems((current) =>
          current.filter((item) => item.productId !== productId)
        );
      } else {
        throw new Error("The item was not removed. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove this item."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="wishlist-page">
      <header className="wishlist-heading">
        <span className="eyebrow">YOUR PERSONAL EDIT</span>
        <h1>Wishlist<span>.</span></h1>
        <p>
          {loading
            ? "Loading your saved pieces…"
            : `${items.length} ${items.length === 1 ? "piece" : "pieces"} saved`}
        </p>
      </header>

      {loading ? (
        <div className="wishlist-status" role="status">
          Loading your wishlist…
        </div>
      ) : error ? (
        <div className="wishlist-status" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadWishlist()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <section className="wishlist-empty">
          <Heart size={28} strokeWidth={1.3} />
          <h2>Nothing saved. Yet.</h2>
          <p>
            Keep the pieces you love close. Tap the heart on any product to
            save it here.
          </p>
          <Link href="/shop">
            <ShoppingBag size={15} />
            Explore the collection
          </Link>
        </section>
      ) : (
        <section className="wishlist-grid" aria-label="Saved products">
          {items.map((item) => {
            const product = item.product;
            const image = product.images[0];
            const price = product.variants[0]?.price;

            return (
              <article className="wishlist-card" key={item.id}>
                <Link
                  href={`/product/${product.slug}`}
                  className="wishlist-card-image"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      fill
                      sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="wishlist-no-image">OFFICE WEAR</div>
                  )}
                </Link>

                <button
                  type="button"
                  className="wishlist-remove"
                  onClick={() => void removeItem(product.id)}
                  disabled={removingId !== null}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <Trash2 size={15} />
                </button>

                <div className="wishlist-card-meta">
                  <div>
                    <Link href={`/product/${product.slug}`}>
                      {product.name}
                    </Link>
                    <p>{product.gender}</p>
                  </div>
                  {price !== undefined && (
                    <strong>₹{price.toLocaleString("en-IN")}</strong>
                  )}
                </div>

                <Link
                  href={`/product/${product.slug}`}
                  className="wishlist-view"
                >
                  View product
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
