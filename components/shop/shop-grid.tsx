"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { StoreProduct } from "@/lib/storefront";

type Sort = "featured" | "newest" | "price-low" | "price-high";

export function ShopGrid({ products, initialCategory, initialGender, initialNewest = false }: { products: StoreProduct[]; initialCategory?: string; initialGender?: string; initialNewest?: boolean }) {
  const [category, setCategory] = useState(initialCategory ?? "All");
  const [gender, setGender] = useState(initialGender ?? "All");
  const [sort, setSort] = useState<Sort>(initialNewest ? "newest" : "featured");
  const [mobileFilters, setMobileFilters] = useState(false);

  const visible = useMemo(() => {
    const filtered = products.filter((p) => (category === "All" || p.category === category) && (gender === "All" || p.gender === gender || p.gender === "Unisex"));
    const newest = (p: StoreProduct) => (p.createdAt ? Date.parse(p.createdAt) : 0);
    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "newest") return newest(b) - newest(a);
      // Featured: flagged pieces first, then most recent within each group.
      if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
      return newest(b) - newest(a);
    });
  }, [products, category, gender, sort]);

  const filters = <div className="shop-filter-panel">
    <div className="shop-filter-group"><span>Category</span><div>{["All", "Shirts", "Trousers", "T-Shirts", "Polos", "Overshirts", "Blazers", "Co-ord Sets", "Essentials"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
    <div className="shop-filter-group"><span>For</span><div>{["All", "Men", "Women"].map((item) => <button key={item} className={gender === item ? "active" : ""} onClick={() => setGender(item)}>{item}</button>)}</div></div>
  </div>;

  return <>
    <div className="shop-toolbar">
      <button className="mobile-filter-button" onClick={() => setMobileFilters(true)}><SlidersHorizontal size={15} /> Filters</button>
      <span>{visible.length} pieces</span>
      <label>Sort <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price low to high</option><option value="price-high">Price high to low</option></select><ChevronDown size={13} /></label>
    </div>
    <div className="shop-layout"><aside>{filters}</aside><div className="catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
    {visible.length === 0 && <div className="shop-empty"><p>No pieces match this edit.</p><button onClick={() => { setCategory("All"); setGender("All"); }}>Reset filters</button></div>}
    {mobileFilters && <div className="mobile-filter-overlay" role="dialog" aria-modal="true"><div className="mobile-filter-sheet"><header><span>Filter the edit</span><button onClick={() => setMobileFilters(false)} aria-label="Close filters"><X size={20} /></button></header>{filters}<button className="button button-dark filter-done" onClick={() => setMobileFilters(false)}>View {visible.length} pieces</button></div></div>}
  </>;
}
