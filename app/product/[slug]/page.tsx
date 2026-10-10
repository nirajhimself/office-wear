export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getStoreProduct, getStoreProducts } from "@/lib/storefront";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "@/components/product/product-detail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) notFound();
  const related = (await getStoreProducts({ category: product.category })).filter((item) => item.id !== product.id).slice(0, 3);
  const user = await getCurrentUser();
  const wishlist = user ? await prisma.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }) : null;
  return <ProductDetail product={product} related={related} initialLiked={Boolean(wishlist)} />;
}
