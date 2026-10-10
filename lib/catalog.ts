export type Product = {
  id: string;
  name: string;
  slug: string;
  category: "Shirts" | "Trousers" | "Jackets" | "Essentials";
  gender: "Men" | "Women" | "Unisex";
  price: number;
  compareAtPrice?: number;
  color: string;
  colors: string[];
  sizes: string[];
  image: string;
  hoverImage: string;
  badge?: string;
  description: string;
};

const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=88`;

export const products: Product[] = [
  { id: "ow-001", name: "The Everyday Shirt", slug: "the-everyday-shirt", category: "Shirts", gender: "Men", price: 1490, color: "Stone", colors: ["Stone", "White", "Black"], sizes: ["S", "M", "L", "XL"], image: img("photo-1603252110481-7ba873bf42ab"), hoverImage: img("photo-1596755389378-c31d21fd1273"), badge: "The First Edit", description: "A clean, easy shirt cut for long workdays and after-hours plans." },
  { id: "ow-002", name: "The Relaxed Oxford", slug: "the-relaxed-oxford", category: "Shirts", gender: "Men", price: 1690, color: "White", colors: ["White", "Sky", "Navy"], sizes: ["S", "M", "L", "XL"], image: img("photo-1602810318383-e386cc2a3ccf"), hoverImage: img("photo-1621072156002-e2fccdc0b176"), badge: "New", description: "Soft structure, relaxed proportions and an understated finish." },
  { id: "ow-003", name: "The Fine Stripe", slug: "the-fine-stripe", category: "Shirts", gender: "Women", price: 1590, color: "Blue Stripe", colors: ["Blue Stripe", "Charcoal"], sizes: ["XS", "S", "M", "L"], image: img("photo-1594633312681-425c7b97ccd1"), hoverImage: img("photo-1551488831-00ddcb6c6bd3"), badge: "New", description: "A refined stripe with an easy drape for desk-to-dinner dressing." },
  { id: "ow-004", name: "The Tailored Trouser", slug: "the-tailored-trouser", category: "Trousers", gender: "Men", price: 1890, color: "Charcoal", colors: ["Charcoal", "Black", "Olive"], sizes: ["28", "30", "32", "34", "36"], image: img("photo-1624378439575-d8705ad7ae80"), hoverImage: img("photo-1594938298603-c8148c4dae35"), description: "A straight, considered trouser with enough ease for the commute." },
  { id: "ow-005", name: "The Wide Trouser", slug: "the-wide-trouser", category: "Trousers", gender: "Women", price: 1990, color: "Black", colors: ["Black", "Stone"], sizes: ["XS", "S", "M", "L"], image: img("photo-1506629905607-d9b1e7a0f4e0"), hoverImage: img("photo-1509631179647-0177331693ae"), badge: "New", description: "A fluid wide-leg silhouette designed for a polished everyday uniform." },
  { id: "ow-006", name: "The Utility Overshirt", slug: "the-utility-overshirt", category: "Jackets", gender: "Unisex", price: 2290, color: "Olive", colors: ["Olive", "Black"], sizes: ["S", "M", "L", "XL"], image: img("photo-1548883354-7622d03aca27"), hoverImage: img("photo-1551488831-00ddcb6c6bd3"), badge: "The First Edit", description: "Light structure and practical pockets, finished with a quiet silhouette." },
  { id: "ow-007", name: "The Modern Blazer", slug: "the-modern-blazer", category: "Jackets", gender: "Women", price: 3490, color: "Black", colors: ["Black", "Stone"], sizes: ["XS", "S", "M", "L"], image: img("photo-1581044777550-4cfa60707c03"), hoverImage: img("photo-1594938298603-c8148c4dae35"), description: "A softened blazer with a clean shoulder and an everyday point of view." },
  { id: "ow-008", name: "The Essential Tee", slug: "the-essential-tee", category: "Essentials", gender: "Unisex", price: 990, color: "Off White", colors: ["Off White", "Black", "Charcoal"], sizes: ["XS", "S", "M", "L", "XL"], image: img("photo-1521572163474-6864f9cf17ab"), hoverImage: img("photo-1503341504253-dff4815485f1"), badge: "Essential", description: "The foundation piece: substantial cotton, clean neck and an easy fit." },
  { id: "ow-009", name: "The Workday Polo", slug: "the-workday-polo", category: "Essentials", gender: "Men", price: 1290, color: "Navy", colors: ["Navy", "Black", "Stone"], sizes: ["S", "M", "L", "XL"], image: img("photo-1625910513413-5fc45d2b7a2c"), hoverImage: img("photo-1617127365659-c47fa864d8bc"), badge: "New", description: "A sharper alternative to the tee, designed to carry you through the week." },
  { id: "ow-010", name: "The Fine Knit", slug: "the-fine-knit", category: "Essentials", gender: "Women", price: 1790, color: "Oat", colors: ["Oat", "Black"], sizes: ["XS", "S", "M", "L"], image: img("photo-1483985988355-763728e1935b"), hoverImage: img("photo-1485968579580-b6d095142e6e"), description: "A fine-gauge layer that works under tailoring or on its own." },
  { id: "ow-011", name: "The Daily Shirt", slug: "the-daily-shirt", category: "Shirts", gender: "Unisex", price: 1390, color: "Black", colors: ["Black", "White"], sizes: ["S", "M", "L", "XL"], image: img("photo-1598033129183-c4f50c736f10"), hoverImage: img("photo-1603252109303-2751441dd157"), description: "A pared-back button-down built around a modern, slightly relaxed fit." },
  { id: "ow-012", name: "The Pleated Trouser", slug: "the-pleated-trouser", category: "Trousers", gender: "Unisex", price: 2090, color: "Stone", colors: ["Stone", "Charcoal"], sizes: ["28", "30", "32", "34", "36"], image: img("photo-1473966968600-fa801b869a1a"), hoverImage: img("photo-1515886657613-9f3515b0c78f"), description: "A single-pleat trouser with a clean break and comfortable movement." },
];

export const categories = [
  { slug: "shirts", label: "Shirts", description: "Clean layers for meetings, commutes and everything between.", image: img("photo-1603252110481-7ba873bf42ab", 1600) },
  { slug: "trousers", label: "Trousers", description: "Considered shapes built for movement and long days.", image: img("photo-1624378439575-d8705ad7ae80", 1600) },
  { slug: "jackets", label: "Jackets", description: "Soft structure for a sharper workday.", image: img("photo-1548883354-7622d03aca27", 1600) },
  { slug: "essentials", label: "Essentials", description: "The quiet foundations of the modern wardrobe.", image: img("photo-1521572163474-6864f9cf17ab", 1600) },
];

export function getProduct(slug: string) { return products.find((p) => p.slug === slug); }
export function getCategory(slug: string) { return categories.find((c) => c.slug === slug); }
