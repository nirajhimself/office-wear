export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { getCategory } from "@/lib/catalog";
import { ShopGrid } from "@/components/shop/shop-grid";
import { getStoreProducts } from "@/lib/storefront";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = await getStoreProducts({ category: category.label });
  return <main className="collection-page">
    <section className="collection-hero">
      <img src={category.image} alt="" />
      <div className="collection-hero-overlay" />
      <div className="collection-hero-copy"><span>OFFICE WEAR · COLLECTION</span><h1>{category.label}<br /><em>edit.</em></h1><p>{category.description}</p></div>
      <span className="collection-scroll">Scroll to explore ↓</span>
    </section>
    <section className="collection-catalog section-pad">
      <div className="catalog-intro"><div><span className="eyebrow-dark">{category.label.toUpperCase()}</span><h2>Made for the hours that matter.</h2></div><Link className="text-link" href="/shop">View all pieces <ArrowDownRight size={14} /></Link></div>
      <ShopGrid products={products} initialCategory={category.label} />
    </section>
  </main>;
}
