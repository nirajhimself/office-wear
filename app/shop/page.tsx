export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { ShopGrid } from "@/components/shop/shop-grid";
import { categories } from "@/lib/catalog";
import { getStoreProducts } from "@/lib/storefront";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string; category?: string; gender?: string }> }) {
  const params = await searchParams;
  const products = await getStoreProducts();
  return <main className="shop-page">
    <section className="shop-hero">
      <div><span className="eyebrow-dark">OFFICE WEAR · THE FIRST EDIT</span><h1>Clothing for<br /><span>the modern workday.</span></h1><p>A considered wardrobe of shirts, trousers, layers and essentials designed to move with you.</p></div>
      <span className="shop-index">01 / 04</span>
    </section>
    <section className="shop-category-strip" aria-label="Shop categories">
      {categories.map((c) => <Link href={`/collections/${c.slug}`} key={c.slug}><span>{c.label}</span><ArrowDownRight size={15} /></Link>)}
    </section>
    <section className="shop-catalog section-pad">
      <div className="catalog-intro"><div><span className="eyebrow-dark">THE COLLECTION</span><h2>The First Edit.</h2></div><p>Ten considered pieces to build a quieter, sharper work wardrobe. More will follow as the brand evolves.</p></div>
      <ShopGrid products={products} initialCategory={params.category ? params.category.charAt(0).toUpperCase() + params.category.slice(1) : undefined} initialGender={params.gender} initialNewest={params.sort === "newest"} />
    </section>
  </main>;
}
