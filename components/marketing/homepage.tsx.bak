"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, Plus } from "lucide-react";
import { motion } from "framer-motion";

import type { StoreProduct } from "@/lib/storefront";
const categories = [
  { name: "Shirts", eyebrow: "01 / Shirts", image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=1500&q=88", href: "/shop?category=shirts" },
  { name: "Trousers", eyebrow: "02 / Trousers", image: "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=1500&q=88", href: "/shop?category=trousers" },
  { name: "Jackets", eyebrow: "03 / Jackets", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1500&q=88", href: "/shop?category=jackets" },
  { name: "Essentials", eyebrow: "04 / Essentials", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=88", href: "/shop?category=essentials" },
];

const principles = [
  ["01", "Considered cuts", "Clean proportions designed to move through a full working day."],
  ["02", "Useful comfort", "Softness, structure and breathability where they matter most."],
  ["03", "Quiet confidence", "A restrained point of view made to stay relevant beyond a season."],
];

export function Homepage({ products }: { products: StoreProduct[] }) {
  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-content">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>OFFICE WEAR / THE FIRST EDIT</motion.p>
          <motion.h1 id="hero-title" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}>THE MODERN<br /><em>WORKDAY.</em></motion.h1>
          <motion.div className="hero-bottom" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
            <p className="hero-copy">Clothing designed for movement,<br className="desktop-only" /> confidence and everyday work.</p>
            <div className="hero-actions">
              <Link href="/shop?gender=Men" className="button button-light">Shop men <ArrowRight size={15} /></Link>
              <Link href="/shop?gender=Women" className="button button-outline">Shop women <ArrowRight size={15} /></Link>
            </div>
          </motion.div>
        </div>
        <div className="hero-meta"><span>01 / 01</span><span>New Delhi · India</span></div>
        <div className="hero-scroll"><span className="scroll-line" /><span>Scroll to explore</span><ArrowDownRight size={15} /></div>
      </section>

      <section className="intro section-pad" aria-labelledby="intro-title">
        <div className="intro-kicker"><span>01</span><span>The first edit</span></div>
        <div className="intro-main">
          <p className="display-overline">A wardrobe, edited.</p>
          <h2 id="intro-title">Designed to work<br /><span>with you.</span></h2>
          <div className="intro-lower">
            <p>A considered collection of everyday work essentials — cut clean, made to move and built for the hours between the first meeting and the last train home.</p>
            <Link href="/shop" className="text-link">Explore the edit <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="product-section section-pad" aria-labelledby="collection-title">
        <div className="section-heading">
          <div><span className="eyebrow-dark">02 / The collection</span><h2 id="collection-title">The First Edit</h2></div>
          <div className="section-heading-side"><p>Four pieces. One point of view.</p><Link href="/shop" className="text-link">View all <ArrowRight size={16} /></Link></div>
        </div>
        <div className="product-grid">
          {products.map((product, i) => (
            <motion.article className="product-card" key={product.name} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ delay: i * 0.06, duration: 0.65 }}>
              <Link href={`/product/${products[i]?.slug ?? "shop"}`} className="product-image" aria-label={`View ${product.name}`}>
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="product-tag">{product.badge ?? (i < 2 ? "New" : "Core")}</span>
                <span className="product-add"><Plus size={15} /></span>
              </Link>
              <div className="product-meta"><div><h3>{product.name}</h3><p>{product.color} · {product.category}</p></div><strong>₹{product.price.toLocaleString("en-IN")}</strong></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="editorial" aria-labelledby="editorial-title">
        <div className="editorial-image" role="img" aria-label="Tailored modern workwear" />
        <div className="editorial-copy">
          <span className="eyebrow-dark">03 / The philosophy</span>
          <h2 id="editorial-title">MADE FOR<br /><span>THE HOURS</span><br />THAT MATTER.</h2>
          <p>Work doesn't have to look ordinary. OFFICE WEAR brings a quieter confidence to the modern workday — considered silhouettes, honest materials and pieces that earn their place in your wardrobe.</p>
          <Link href="/about" className="button button-dark">Our story <ArrowRight size={16} /></Link>
          <div className="editorial-note"><span>OFFICE WEAR / 001</span><span>Designed in India</span></div>
        </div>
      </section>

      <section className="categories section-pad" aria-labelledby="categories-title">
        <div className="section-heading category-heading"><div><span className="eyebrow-dark">04 / Shop by category</span><h2 id="categories-title">Built around<br />the workday.</h2></div><p>Start with the pieces you reach for most.</p></div>
        <div className="category-grid">
          {categories.map((cat, i) => (
            <Link href={cat.href} className={`category-tile category-${i + 1}`} key={cat.name}>
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <div className="category-shade" />
              <div className="category-content"><span>{cat.eyebrow}</span><h3>{cat.name}</h3><ArrowRight size={20} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="principles section-pad" aria-labelledby="principles-title">
        <div className="principles-head"><span className="eyebrow-dark">05 / Our point of view</span><h2 id="principles-title">Less, but better.</h2></div>
        <div className="principles-grid">
          {principles.map(([number, title, copy]) => <div className="principle" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="manifesto" aria-label="Brand manifesto">
        <div className="manifesto-inner"><span className="eyebrow">06 / OFFICE WEAR</span><p>“Work doesn't have to look ordinary.”</p><span className="manifesto-caption">Modern clothing for the hours that matter.</span><Link href="/about" className="manifesto-link">Discover the story <ArrowRight size={15} /></Link></div>
      </section>

      <section className="newsletter-band section-pad" aria-labelledby="newsletter-title">
        <div><span className="eyebrow-dark">07 / Stay in the loop</span><h2 id="newsletter-title">The Office Letter.</h2></div>
        <div className="newsletter-band-right"><p>New edits, useful stories and early access to the things we're making. No noise.</p><form className="newsletter-form large" onSubmit={(e) => e.preventDefault()}><input type="email" placeholder="Your email address" aria-label="Your email address" required /><button type="submit">Subscribe <ArrowRight size={14} /></button></form><small>By subscribing, you agree to receive occasional updates from OFFICE WEAR.</small></div>
      </section>
    </div>
  );
}
