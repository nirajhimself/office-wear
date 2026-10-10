"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Heart, Minus, Plus, Ruler, ShieldCheck, Truck, X, ZoomIn } from "lucide-react";
import type { StoreProduct as Product } from "@/lib/storefront";
import { useCart } from "@/components/cart/cart-provider";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ProductDetail({ product, related, initialLiked = false }: { product: Product; related: Product[]; initialLiked?: boolean }) {
  const gallery = useMemo(() => [product.image, product.hoverImage, related[0]?.image, related[1]?.image].filter(Boolean) as string[], [product, related]);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.color);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(initialLiked);
  const [zoom, setZoom] = useState(false);
  const [added, setAdded] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  async function toggleWishlist() {
    const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
    if (res.status === 401) { router.push("/login?next=/product/" + product.slug); return; }
    if (res.ok) { const data = await res.json(); setLiked(Boolean(data.liked)); }
  }

  const next = () => setActive((value) => (value + 1) % gallery.length);
  const previous = () => setActive((value) => (value - 1 + gallery.length) % gallery.length);

  function buyNow() {
    if (!size) return;
    addItem({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image, size, color, quantity });
    router.push("/checkout");
  }

  function addToBag() {
    if (!size) return;
    addItem({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.image, size, color, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <main className="product-detail-page">
      <div className="product-breadcrumb"><Link href="/shop">Shop</Link><span>/</span><Link href={`/collections/${product.category.toLowerCase()}`}>{product.category}</Link><span>/</span><strong>{product.name}</strong></div>

      <section className="product-detail-shell">
        <div className="product-gallery-wrap">
          <div className="product-thumbs" aria-label="Product images">
            {gallery.map((image, index) => (
              <button key={`${image}-${index}`} className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`View image ${index + 1}`}>
                <Image src={image} alt="" fill sizes="90px" />
              </button>
            ))}
          </div>
          <div className="product-gallery-main">
            <button className="gallery-image-button" onClick={() => setZoom(true)} aria-label="Zoom product image">
              <Image src={gallery[active]} alt={`${product.name} — ${color}`} fill priority sizes="(max-width: 900px) 100vw, 57vw" />
              <span><ZoomIn size={15} /> View larger</span>
            </button>
            <button className="gallery-arrow gallery-arrow-left" onClick={previous} aria-label="Previous image"><ChevronLeft size={18} /></button>
            <button className="gallery-arrow gallery-arrow-right" onClick={next} aria-label="Next image"><ChevronRight size={18} /></button>
            <span className="gallery-count">{String(active + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="product-info-panel">
          <div className="product-kicker">{product.category} · {product.gender}</div>
          <div className="product-title-row">
            <div><h1>{product.name}</h1><p>{product.description}</p></div>
            <button className={`product-like ${liked ? "liked" : ""}`} onClick={toggleWishlist} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}><Heart size={20} fill={liked ? "currentColor" : "none"} /></button>
          </div>
          <div className="product-price-row"><strong>{formatPrice(product.price)}</strong>{product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}</div>
          <p className="tax-note">Inclusive of applicable taxes. Shipping calculated at checkout.</p>

          <div className="detail-rule" />
          <div className="choice-block">
            <div className="choice-heading"><span>Colour</span><strong>{color}</strong></div>
            <div className="color-options">
              {product.colors.map((item) => <button key={item} className={item === color ? "selected" : ""} onClick={() => setColor(item)} aria-label={`Select ${item}`}>{item}<i /></button>)}
            </div>
          </div>

          <div className="choice-block">
            <div className="choice-heading"><span>Size</span><button onClick={() => setSizeGuide(true)}><Ruler size={13} /> Size guide</button></div>
            <div className="size-options">
              {product.sizes.map((item) => <button key={item} className={item === size ? "selected" : ""} onClick={() => setSize(item)}>{item}</button>)}
            </div>
            {!size && <p className="selection-hint">Select a size to continue.</p>}
          </div>

          <div className="quantity-row"><span>Quantity</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div></div>

          <button className={`add-bag-button ${added ? "added" : ""}`} disabled={!size} onClick={addToBag}>{added ? <><Check size={16} /> Added to bag</> : "Add to bag"}</button>
          <button className="buy-button" disabled={!size} onClick={buyNow}>Buy now</button>

          <div className="delivery-notes">
            <div><Truck size={17} /><div><strong>Complimentary delivery</strong><span>On orders over ₹1,999 across India.</span></div></div>
            <div><ShieldCheck size={17} /><div><strong>Easy returns</strong><span>Return eligibility shown at checkout.</span></div></div>
          </div>

          <details className="detail-accordion" open><summary>Details <span>+</span></summary><div><p>{product.description}</p><dl><dt>Fabric</dt><dd>Premium blended fabric</dd><dt>Fit</dt><dd>Modern relaxed fit</dd><dt>Care</dt><dd>Machine wash cold. Hang dry.</dd></dl></div></details>
          <details className="detail-accordion"><summary>Shipping & returns <span>+</span></summary><div><p>Dispatch and estimated delivery information will be confirmed at checkout. Final return conditions will follow the OFFICE WEAR return policy.</p></div></details>
        </div>
      </section>

      <section className="complete-look"><div><span className="eyebrow">Complete the look</span><h2>Made to work<br />together.</h2></div><div className="complete-grid">{related.slice(0, 3).map((item) => <Link href={`/product/${item.slug}`} key={item.id}><div><Image src={item.image} alt={item.name} fill sizes="(max-width: 700px) 33vw, 22vw" /></div><span>{item.name}</span><small>{formatPrice(item.price)}</small></Link>)}</div></section>

      <section className="product-reassurance"><div><span>01</span><strong>Considered materials</strong><p>Chosen for comfort, structure and repeat wear.</p></div><div><span>02</span><strong>Built for movement</strong><p>Silhouettes designed around the rhythm of a workday.</p></div><div><span>03</span><strong>Quiet confidence</strong><p>Less noise. Better proportions. More ways to wear.</p></div></section>

      {zoom && <div className="zoom-modal" role="dialog" aria-modal="true" aria-label="Product image viewer"><button className="zoom-close" onClick={() => setZoom(false)} aria-label="Close image viewer"><X size={21} /></button><Image src={gallery[active]} alt={`${product.name} enlarged`} fill sizes="100vw" className="zoom-image" /><button className="zoom-prev" onClick={previous} aria-label="Previous image"><ChevronLeft /></button><button className="zoom-next" onClick={next} aria-label="Next image"><ChevronRight /></button></div>}
      {sizeGuide && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Size guide" onMouseDown={(e) => e.target === e.currentTarget && setSizeGuide(false)}><div className="size-guide-modal"><div className="modal-head"><div><span className="eyebrow">OFFICE WEAR</span><h2>Size guide</h2></div><button onClick={() => setSizeGuide(false)} aria-label="Close size guide"><X size={20} /></button></div><p>Use your usual size as a starting point. For a closer fit, size down; for a relaxed fit, size up.</p><div className="size-table"><div><span>Size</span><span>Chest / Waist</span><span>EU</span></div>{["XS","S","M","L","XL"].map((item, index) => <div key={item}><span>{item}</span><span>{index === 0 ? "32–34 / 26–28" : index === 1 ? "34–36 / 28–30" : index === 2 ? "36–38 / 30–32" : index === 3 ? "38–40 / 32–34" : "40–42 / 34–36"}</span><span>{42 + index * 2}</span></div>)}</div></div></div>}
    </main>
  );
}
