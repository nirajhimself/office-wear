export type Product = {
  id: string;
  name: string;
  slug: string;
  category: "Shirts" | "Trousers" | "T-Shirts" | "Polos" | "Overshirts" | "Blazers" | "Co-ord Sets" | "Essentials";
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
  { id: "ow-101", name: "The Monday Shirt", slug: "the-monday-shirt", category: "Shirts", gender: "Men", price: 1690, color: "White", colors: ["White", "Stone", "Black"], sizes: ["XS", "S", "M", "L", "XL"], image: img("photo-1603252110481-7ba873bf42ab"), hoverImage: img("photo-1596755389378-c31d21fd1273"), badge: "New", description: "Cotton poplin with a clean placket and a collar that holds its shape from the first meeting to the last." },
  { id: "ow-102", name: "The Soft Oxford", slug: "the-soft-oxford", category: "Shirts", gender: "Women", price: 1790, compareAtPrice: 1990, color: "White", colors: ["White", "Sky", "Charcoal"], sizes: ["XS", "S", "M", "L"], image: img("photo-1602810318383-e386cc2a3ccf"), hoverImage: img("photo-1621072156002-e2fccdc0b176"), description: "A washed oxford with relaxed proportions, cut to drape rather than hold a crease." },
  { id: "ow-103", name: "The Straight Trouser", slug: "the-straight-trouser", category: "Trousers", gender: "Men", price: 2190, color: "Charcoal", colors: ["Charcoal", "Black", "Olive"], sizes: ["28", "30", "32", "34", "36"], image: img("photo-1624378439575-d8705ad7ae80"), hoverImage: img("photo-1594938298603-c8148c4dae35"), badge: "New", description: "A straight leg with a mid rise and enough room through the thigh for a full commute." },
  { id: "ow-104", name: "The Fluid Trouser", slug: "the-fluid-trouser", category: "Trousers", gender: "Women", price: 2290, color: "Black", colors: ["Black", "Stone", "Navy"], sizes: ["XS", "S", "M", "L"], image: img("photo-1509631179647-0177331693ae"), hoverImage: img("photo-1473966968600-fa801b869a1a"), description: "A high-rise trouser in a fluid weave that moves with you and presses flat again by morning." },
  { id: "ow-105", name: "The Heavy Tee", slug: "the-heavy-tee", category: "T-Shirts", gender: "Unisex", price: 990, color: "Off White", colors: ["Off White", "Black", "Charcoal"], sizes: ["XS", "S", "M", "L", "XL"], image: img("photo-1521572163474-6864f9cf17ab"), hoverImage: img("photo-1503341504253-dff4815485f1"), badge: "Essential", description: "Substantial combed cotton with a ribbed neck that stays flat wash after wash." },
  { id: "ow-106", name: "The Boxy Tee", slug: "the-boxy-tee", category: "T-Shirts", gender: "Unisex", price: 1090, color: "Off White", colors: ["Off White", "Clay", "Black"], sizes: ["XS", "S", "M", "L", "XL"], image: img("photo-1503341504253-dff4815485f1"), hoverImage: img("photo-1521572163474-6864f9cf17ab"), description: "A squared shoulder and a shorter body, made to sit cleanly over trousers untucked." },
  { id: "ow-107", name: "The Knit Polo", slug: "the-knit-polo", category: "Polos", gender: "Men", price: 1590, color: "Navy", colors: ["Navy", "Oat", "Black"], sizes: ["S", "M", "L", "XL"], image: img("photo-1617127365659-c47fa864d8bc"), hoverImage: img("photo-1483985988355-763728e1935b"), badge: "New", description: "A fine-gauge knit polo with a soft collar, the easiest way to sharpen a plain week." },
  { id: "ow-108", name: "The Pique Polo", slug: "the-pique-polo", category: "Polos", gender: "Men", price: 1490, color: "White", colors: ["White", "Navy", "Stone"], sizes: ["S", "M", "L", "XL"], image: img("photo-1617127365659-c47fa864d8bc"), hoverImage: img("photo-1521572163474-6864f9cf17ab"), description: "Textured pique cotton, cut slim through the body with a tidy two-button placket." },
  { id: "ow-109", name: "The Field Overshirt", slug: "the-field-overshirt", category: "Overshirts", gender: "Unisex", price: 2490, color: "Olive", colors: ["Olive", "Black", "Stone"], sizes: ["S", "M", "L", "XL"], image: img("photo-1548883354-7622d03aca27"), hoverImage: img("photo-1598033129183-c4f50c736f10"), description: "Light structure and two chest pockets, equally at home over a tee or under a coat." },
  { id: "ow-110", name: "The Linen Overshirt", slug: "the-linen-overshirt", category: "Overshirts", gender: "Unisex", price: 2390, compareAtPrice: 2690, color: "Sand", colors: ["Sand", "Sky"], sizes: ["S", "M", "L", "XL"], image: img("photo-1548883354-7622d03aca27"), hoverImage: img("photo-1603252109303-2751441dd157"), description: "A breathable linen blend for the months when a jacket is too much and a shirt is not enough." },
  { id: "ow-111", name: "The Unstructured Blazer", slug: "the-unstructured-blazer", category: "Blazers", gender: "Women", price: 3690, color: "Black", colors: ["Black", "Stone"], sizes: ["XS", "S", "M", "L"], image: img("photo-1581044777550-4cfa60707c03"), hoverImage: img("photo-1594938298603-c8148c4dae35"), badge: "New", description: "Unlined through the shoulder so it reads as tailoring without feeling like armour." },
  { id: "ow-112", name: "The Travel Blazer", slug: "the-travel-blazer", category: "Blazers", gender: "Men", price: 3890, color: "Charcoal", colors: ["Charcoal", "Navy"], sizes: ["S", "M", "L", "XL"], image: img("photo-1581044777550-4cfa60707c03"), hoverImage: img("photo-1624378439575-d8705ad7ae80"), description: "A crease-resistant weave that survives a full day of travel and still looks considered." },
  { id: "ow-113", name: "The Weekday Co-ord", slug: "the-weekday-co-ord", category: "Co-ord Sets", gender: "Women", price: 3990, compareAtPrice: 4490, color: "Stone", colors: ["Stone", "Black"], sizes: ["XS", "S", "M", "L"], image: img("photo-1594633312681-425c7b97ccd1"), hoverImage: img("photo-1509631179647-0177331693ae"), badge: "New", description: "A matched shirt and trouser you can wear together as a look or apart all week." },
  { id: "ow-114", name: "The Linen Co-ord", slug: "the-linen-co-ord", category: "Co-ord Sets", gender: "Unisex", price: 3790, color: "Sand", colors: ["Sand", "Charcoal"], sizes: ["S", "M", "L", "XL"], image: img("photo-1598033129183-c4f50c736f10"), hoverImage: img("photo-1515886657613-9f3515b0c78f"), description: "Overshirt and trouser in one weave, the simplest way to look deliberate in warm weather." },
  { id: "ow-115", name: "The Merino Crew", slug: "the-merino-crew", category: "Essentials", gender: "Women", price: 1890, color: "Oat", colors: ["Oat", "Black", "Navy"], sizes: ["XS", "S", "M", "L"], image: img("photo-1483985988355-763728e1935b"), hoverImage: img("photo-1485968579580-b6d095142e6e"), description: "A fine merino crew that layers under tailoring without adding a millimetre of bulk." },
  { id: "ow-116", name: "The Everyday Cardigan", slug: "the-everyday-cardigan", category: "Essentials", gender: "Unisex", price: 2190, color: "Charcoal", colors: ["Charcoal", "Oat"], sizes: ["S", "M", "L", "XL"], image: img("photo-1485968579580-b6d095142e6e"), hoverImage: img("photo-1483985988355-763728e1935b"), description: "A mid-weight cardigan that replaces a jacket indoors and keeps its shape on the chair back." },
];

export const categories = [
  { slug: "shirts", label: "Shirts", description: "Clean layers for meetings, commutes and everything between.", image: img("photo-1603252110481-7ba873bf42ab", 1600) },
  { slug: "trousers", label: "Trousers", description: "Considered shapes built for movement and long days.", image: img("photo-1624378439575-d8705ad7ae80", 1600) },
  { slug: "t-shirts", label: "T-Shirts", description: "Weighted cotton, clean necklines, nothing extra.", image: img("photo-1521572163474-6864f9cf17ab", 1600) },
  { slug: "polos", label: "Polos", description: "A sharper alternative to the tee, built for the week.", image: img("photo-1617127365659-c47fa864d8bc", 1600) },
  { slug: "overshirts", label: "Overshirts", description: "Light structure for in-between weather.", image: img("photo-1548883354-7622d03aca27", 1600) },
  { slug: "blazers", label: "Blazers", description: "Soft tailoring with a clean shoulder.", image: img("photo-1581044777550-4cfa60707c03", 1600) },
  { slug: "co-ord-sets", label: "Co-ord Sets", description: "Two pieces, one considered look.", image: img("photo-1594633312681-425c7b97ccd1", 1600) },
  { slug: "essentials", label: "Essentials", description: "The quiet foundations of the modern wardrobe.", image: img("photo-1483985988355-763728e1935b", 1600) },
];

export function getProduct(slug: string) { return products.find((p) => p.slug === slug); }
export function getCategory(slug: string) { return categories.find((c) => c.slug === slug); }
