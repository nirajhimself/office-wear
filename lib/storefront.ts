import "server-only";
import { prisma } from "@/lib/prisma";

export type StoreProduct = {
  id: string; name: string; slug: string; category: string; gender: string; price: number; compareAtPrice?: number; color: string; colors: string[]; sizes: string[]; image: string; hoverImage: string; badge?: string; description: string;
};

function mapProduct(product: any): StoreProduct {
  const variants = product.variants ?? [];
  const images = product.images ?? [];
  const first = images[0]?.url ?? "";
  const second = images[1]?.url ?? first;
  const prices = variants.map((v: any) => v.price).filter((v: any) => typeof v === "number");
  return { id: product.id, name: product.name, slug: product.slug, category: product.category.name, gender: product.gender, price: prices[0] ?? 0, compareAtPrice: variants[0]?.compareAt ?? undefined, color: variants[0]?.color ?? "", colors: [...new Set(variants.map((v: any) => v.color))] as string[], sizes: [...new Set(variants.map((v: any) => v.size))] as string[], image: first, hoverImage: second, badge: product.featured ? "Featured" : undefined, description: product.description };
}

export async function getStoreProducts(options?: { category?: string; gender?: string; limit?: number }) {
  const products = await prisma.product.findMany({ where: { status: "ACTIVE", ...(options?.category ? { category: { name: options.category } } : {}), ...(options?.gender ? { gender: options.gender } : {}) }, include: { category: true, variants: { orderBy: { price: "asc" } }, images: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" }, take: options?.limit });
  return products.map(mapProduct);
}

export async function getStoreProduct(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, status: "ACTIVE" }, include: { category: true, variants: { orderBy: { price: "asc" } }, images: { orderBy: { sortOrder: "asc" } } } });
  return product ? mapProduct(product) : null;
}
