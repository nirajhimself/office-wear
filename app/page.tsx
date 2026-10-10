export const dynamic = "force-dynamic";
import { Homepage } from "@/components/marketing/homepage";
import { getStoreProducts } from "@/lib/storefront";

export default async function HomePage() {
  const products = await getStoreProducts({ limit: 4 });
  return <Homepage products={products} />;
}
