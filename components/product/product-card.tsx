"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import type { StoreProduct as Product } from "@/lib/storefront";
import { useCart } from "@/components/cart/cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function quickAdd() {
    addItem({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image, size: product.sizes[0], color: product.color, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="catalog-card">
      <div className="catalog-image-wrap">
        <Link href={`/product/${product.slug}`} className="catalog-image" aria-label={`View ${product.name}`}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 560px) 50vw, (max-width: 900px) 50vw, 33vw" />
          <Image className="catalog-image-hover" src={product.hoverImage} alt="" aria-hidden="true" fill sizes="(max-width: 560px) 50vw, (max-width: 900px) 50vw, 33vw" />
          {product.badge && <span className="catalog-badge">{product.badge}</span>}
        </Link>
        <button className={`catalog-wishlist ${liked ? "is-liked" : ""}`} type="button" aria-label={liked ? `Remove ${product.name} from wishlist` : `Save ${product.name}`} onClick={() => setLiked((value) => !value)}><Heart size={16} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} /></button>
        <button className={`catalog-quick-add ${added ? "is-added" : ""}`} type="button" onClick={quickAdd} aria-label={`Quick add ${product.name}`}><Plus size={16} strokeWidth={1.6} /> {added ? "Added" : "Quick add"}</button>
      </div>
      <div className="catalog-meta">
        <div><Link href={`/product/${product.slug}`} className="catalog-name">{product.name}</Link><p>{product.color} · {product.colors.length} colours</p></div>
        <strong>₹{product.price.toLocaleString("en-IN")}</strong>
      </div>
    </article>
  );
}
