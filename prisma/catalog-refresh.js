/*
|------------------------------------------------------------------------------
| OFFICE WEAR — catalog refresh
|------------------------------------------------------------------------------
| Retires the launch catalog and installs a sectioned one.
|
| Products that orders reference CANNOT be deleted: OrderItem -> ProductVariant
| has no cascade rule, so a delete would either fail or strand order history.
| Those are set to ARCHIVED instead, which removes them from the storefront
| (every storefront query filters status: "ACTIVE") while keeping order records
| readable. Products no order touches are deleted outright; their variants,
| images and inventory cascade away with them.
|
| Dry run:  node prisma/catalog-refresh.js
| Apply:    node prisma/catalog-refresh.js --apply
|------------------------------------------------------------------------------
*/

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=88`;

// Only photo IDs already proven to resolve are reused here. Inventing Unsplash
// IDs produces 404s, so the pool is limited to what the previous catalog shipped.
const SHOT = {
  shirtA: "photo-1603252110481-7ba873bf42ab",
  shirtB: "photo-1596755389378-c31d21fd1273",
  shirtC: "photo-1602810318383-e386cc2a3ccf",
  shirtD: "photo-1621072156002-e2fccdc0b176",
  shirtE: "photo-1594633312681-425c7b97ccd1",
  shirtF: "photo-1603252109303-2751441dd157",
  shirtG: "photo-1598033129183-c4f50c736f10",
  trouserA: "photo-1624378439575-d8705ad7ae80",
  trouserB: "photo-1594938298603-c8148c4dae35",
  trouserC: "photo-1509631179647-0177331693ae",
  trouserD: "photo-1473966968600-fa801b869a1a",
  trouserE: "photo-1515886657613-9f3515b0c78f",
  overshirt: "photo-1548883354-7622d03aca27",
  blazer: "photo-1581044777550-4cfa60707c03",
  teeA: "photo-1521572163474-6864f9cf17ab",
  teeB: "photo-1503341504253-dff4815485f1",
  polo: "photo-1617127365659-c47fa864d8bc",
  knitA: "photo-1483985988355-763728e1935b",
  knitB: "photo-1485968579580-b6d095142e6e",
};

const SECTIONS = [
  { order: 1, name: "Shirts", slug: "shirts", description: "Clean layers for meetings, commutes and everything between.", image: SHOT.shirtA },
  { order: 2, name: "Trousers", slug: "trousers", description: "Considered shapes built for movement and long days.", image: SHOT.trouserA },
  { order: 3, name: "T-Shirts", slug: "t-shirts", description: "Weighted cotton, clean necklines, nothing extra.", image: SHOT.teeA },
  { order: 4, name: "Polos", slug: "polos", description: "A sharper alternative to the tee, built for the week.", image: SHOT.polo },
  { order: 5, name: "Overshirts", slug: "overshirts", description: "Light structure for in-between weather.", image: SHOT.overshirt },
  { order: 6, name: "Blazers", slug: "blazers", description: "Soft tailoring with a clean shoulder.", image: SHOT.blazer },
  { order: 7, name: "Co-ord Sets", slug: "co-ord-sets", description: "Two pieces, one considered look.", image: SHOT.shirtE },
  { order: 8, name: "Essentials", slug: "essentials", description: "The quiet foundations of the modern wardrobe.", image: SHOT.knitA },
];

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL"];
const WAIST_SIZES = ["28", "30", "32", "34", "36"];
const ALPHA_SIZES = ["XS", "S", "M", "L"];
const UNISEX_SIZES = ["S", "M", "L", "XL"];

// [sku, name, slug, section, gender, price, compareAt, featured, description, primary, hover, colors, sizes]
const CATALOG = [
  ["ow-101", "The Monday Shirt", "the-monday-shirt", "Shirts", "Men", 1690, null, true,
    "Cotton poplin with a clean placket and a collar that holds its shape from the first meeting to the last.",
    SHOT.shirtA, SHOT.shirtB, ["White", "Stone", "Black"], SHIRT_SIZES],

  ["ow-102", "The Soft Oxford", "the-soft-oxford", "Shirts", "Women", 1790, 1990, false,
    "A washed oxford with relaxed proportions, cut to drape rather than hold a crease.",
    SHOT.shirtC, SHOT.shirtD, ["White", "Sky", "Charcoal"], ALPHA_SIZES],

  ["ow-103", "The Straight Trouser", "the-straight-trouser", "Trousers", "Men", 2190, null, true,
    "A straight leg with a mid rise and enough room through the thigh for a full commute.",
    SHOT.trouserA, SHOT.trouserB, ["Charcoal", "Black", "Olive"], WAIST_SIZES],

  ["ow-104", "The Fluid Trouser", "the-fluid-trouser", "Trousers", "Women", 2290, null, false,
    "A high-rise trouser in a fluid weave that moves with you and presses flat again by morning.",
    SHOT.trouserC, SHOT.trouserD, ["Black", "Stone", "Navy"], ALPHA_SIZES],

  ["ow-105", "The Heavy Tee", "the-heavy-tee", "T-Shirts", "Unisex", 990, null, false,
    "Substantial combed cotton with a ribbed neck that stays flat wash after wash.",
    SHOT.teeA, SHOT.teeB, ["Off White", "Black", "Charcoal"], SHIRT_SIZES],

  ["ow-106", "The Boxy Tee", "the-boxy-tee", "T-Shirts", "Unisex", 1090, null, false,
    "A squared shoulder and a shorter body, made to sit cleanly over trousers untucked.",
    SHOT.teeB, SHOT.teeA, ["Off White", "Clay", "Black"], SHIRT_SIZES],

  ["ow-107", "The Knit Polo", "the-knit-polo", "Polos", "Men", 1590, null, true,
    "A fine-gauge knit polo with a soft collar, the easiest way to sharpen a plain week.",
    SHOT.polo, SHOT.knitA, ["Navy", "Oat", "Black"], UNISEX_SIZES],

  ["ow-108", "The Pique Polo", "the-pique-polo", "Polos", "Men", 1490, null, false,
    "Textured pique cotton, cut slim through the body with a tidy two-button placket.",
    SHOT.polo, SHOT.teeA, ["White", "Navy", "Stone"], UNISEX_SIZES],

  ["ow-109", "The Field Overshirt", "the-field-overshirt", "Overshirts", "Unisex", 2490, null, false,
    "Light structure and two chest pockets, equally at home over a tee or under a coat.",
    SHOT.overshirt, SHOT.shirtG, ["Olive", "Black", "Stone"], UNISEX_SIZES],

  ["ow-110", "The Linen Overshirt", "the-linen-overshirt", "Overshirts", "Unisex", 2390, 2690, false,
    "A breathable linen blend for the months when a jacket is too much and a shirt is not enough.",
    SHOT.overshirt, SHOT.shirtF, ["Sand", "Sky"], UNISEX_SIZES],

  ["ow-111", "The Unstructured Blazer", "the-unstructured-blazer", "Blazers", "Women", 3690, null, true,
    "Unlined through the shoulder so it reads as tailoring without feeling like armour.",
    SHOT.blazer, SHOT.trouserB, ["Black", "Stone"], ALPHA_SIZES],

  ["ow-112", "The Travel Blazer", "the-travel-blazer", "Blazers", "Men", 3890, null, false,
    "A crease-resistant weave that survives a full day of travel and still looks considered.",
    SHOT.blazer, SHOT.trouserA, ["Charcoal", "Navy"], UNISEX_SIZES],

  ["ow-113", "The Weekday Co-ord", "the-weekday-co-ord", "Co-ord Sets", "Women", 3990, 4490, true,
    "A matched shirt and trouser you can wear together as a look or apart all week.",
    SHOT.shirtE, SHOT.trouserC, ["Stone", "Black"], ALPHA_SIZES],

  ["ow-114", "The Linen Co-ord", "the-linen-co-ord", "Co-ord Sets", "Unisex", 3790, null, false,
    "Overshirt and trouser in one weave, the simplest way to look deliberate in warm weather.",
    SHOT.shirtG, SHOT.trouserE, ["Sand", "Charcoal"], UNISEX_SIZES],

  ["ow-115", "The Merino Crew", "the-merino-crew", "Essentials", "Women", 1890, null, false,
    "A fine merino crew that layers under tailoring without adding a millimetre of bulk.",
    SHOT.knitA, SHOT.knitB, ["Oat", "Black", "Navy"], ALPHA_SIZES],

  ["ow-116", "The Everyday Cardigan", "the-everyday-cardigan", "Essentials", "Unisex", 2190, null, false,
    "A mid-weight cardigan that replaces a jacket indoors and keeps its shape on the chair back.",
    SHOT.knitB, SHOT.knitA, ["Charcoal", "Oat"], UNISEX_SIZES],
];

const STOCK_PER_VARIANT = 24;
const NEW_IDS = CATALOG.map((row) => row[0]);

// The Supabase pooler drops a connection that has been held through a long run
// of statements, and it does not always attach a Prisma error code when it does.
// Reconnect and retry rather than losing the whole pass.
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

function isTransient(error) {
  if (error && typeof error.code === "string" && TRANSIENT_CODES.has(error.code)) return true;
  const message = (error && error.message) || "";
  return /closed the connection|Connection reset|socket hang up|ECONNRESET|Timed out fetching/i.test(message);
}

async function withRetry(run, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) throw error;
      await prisma.$disconnect().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      await prisma.$connect().catch(() => undefined);
    }
  }
  throw lastError;
}

async function classifyOldProducts() {
  const existing = await withRetry(() => prisma.product.findMany({
    where: { id: { notIn: NEW_IDS } },
    include: { variants: { include: { orderItems: { select: { id: true } } } } },
  }));
  const archive = [];
  const remove = [];
  for (const product of existing) {
    const refs = product.variants.reduce((n, v) => n + v.orderItems.length, 0);
    (refs > 0 ? archive : remove).push({ id: product.id, name: product.name, refs });
  }
  return { archive, remove };
}

async function main() {
  console.log(APPLY ? "APPLYING catalog refresh\n" : "DRY RUN - nothing is written. Re-run with --apply.\n");

  const { archive, remove } = await classifyOldProducts();
  console.log(`Retiring ${archive.length + remove.length} existing products`);
  console.log(`  archive (orders depend on them): ${archive.length}`);
  archive.forEach((p) => console.log(`      ${p.name}  (${p.refs} order items)`));
  console.log(`  delete  (nothing references them): ${remove.length}`);
  remove.forEach((p) => console.log(`      ${p.name}`));

  console.log(`\nInstalling ${SECTIONS.length} sections / ${CATALOG.length} products`);
  for (const section of SECTIONS) {
    const n = CATALOG.filter((row) => row[3] === section.name).length;
    console.log(`  ${String(section.order).padStart(2, "0")}  ${section.name.padEnd(12)} ${n} pieces`);
  }
  const variants = CATALOG.reduce((n, row) => n + row[11].length * row[12].length, 0);
  console.log(`\n  ${variants} variants, ${variants * STOCK_PER_VARIANT} units of stock`);

  if (!APPLY) {
    await prisma.$disconnect();
    return;
  }

  console.log("\n--- writing ---");

  for (const product of archive) {
    await withRetry(() => prisma.product.update({ where: { id: product.id }, data: { status: "ARCHIVED", featured: false } }));
  }
  console.log(`archived ${archive.length}`);

  for (const product of remove) {
    await withRetry(() => prisma.product.delete({ where: { id: product.id } }));
  }
  console.log(`deleted ${remove.length}`);

  for (const section of SECTIONS) {
    await withRetry(() => prisma.category.upsert({
      where: { slug: section.slug },
      update: { name: section.name, description: section.description, image: img(section.image) },
      create: { name: section.name, slug: section.slug, description: section.description, image: img(section.image) },
    }));
  }
  console.log(`sections upserted ${SECTIONS.length}`);

  const collection = await withRetry(() => prisma.collection.upsert({
    where: { slug: "the-sectioned-edit" },
    update: { name: "The Sectioned Edit", description: "The OFFICE WEAR catalog, organised by section." },
    create: { name: "The Sectioned Edit", slug: "the-sectioned-edit", description: "The OFFICE WEAR catalog, organised by section." },
  }));

  for (const row of CATALOG) {
    const [sku, name, slug, section, gender, price, compareAt, featured, description, primary, hover, colors, sizes] = row;
    const sectionSlug = SECTIONS.find((s) => s.name === section).slug;
    const category = await withRetry(() => prisma.category.findUnique({ where: { slug: sectionSlug } }));
    if (!category) throw new Error(`Section missing: ${section}`);

    await withRetry(() => prisma.product.upsert({
      where: { id: sku },
      update: { name, slug, description, gender, status: "ACTIVE", featured, categoryId: category.id, collectionId: collection.id },
      create: { id: sku, name, slug, description, gender, status: "ACTIVE", featured, categoryId: category.id, collectionId: collection.id },
    }));

    await withRetry(() => prisma.productImage.deleteMany({ where: { productId: sku } }));
    await withRetry(() => prisma.productImage.createMany({
      data: [
        { productId: sku, url: img(primary), alt: `${name} - OFFICE WEAR`, sortOrder: 0 },
        { productId: sku, url: img(hover), alt: `${name} - alternate view`, sortOrder: 1 },
      ],
    }));

    // Batched rather than one upsert per variant: a per-row loop meant roughly
    // 500 sequential round-trips across the whole catalog, which the pooler
    // closed partway through.
    // The id format is load-bearing: lib/commerce.ts resolves a cart line by
    // rebuilding `${productId}-${size}-${color}` from the cart's own values, so
    // the order and the original casing must match exactly or checkout cannot
    // find the variant. Mirrors prisma/seed.js.
    const variantRows = [];
    for (const size of sizes) {
      for (const color of colors) {
        const variantId = `${sku}-${size}-${color}`;
        const variantSku = `OW-${sku.replace("ow-", "")}-${size}-${color.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
        variantRows.push({ id: variantId, productId: sku, sku: variantSku, size, color, price, compareAt });
      }
    }
    const variantIds = variantRows.map((row) => row.id);

    // Clear any variant of this product that is not in the correct id set (an
    // earlier run of this script wrote ids with size and color transposed).
    // Guarded so a variant an order depends on is never removed.
    const stale = await withRetry(() => prisma.productVariant.findMany({
      where: { productId: sku, id: { notIn: variantIds }, orderItems: { none: {} } },
      select: { id: true },
    }));
    if (stale.length) {
      await withRetry(() => prisma.productVariant.deleteMany({ where: { id: { in: stale.map((v) => v.id) } } }));
      console.log(`  ${name.padEnd(26)} removed ${stale.length} mis-keyed variants`);
    }

    await withRetry(() => prisma.productVariant.createMany({ data: variantRows, skipDuplicates: true }));
    await withRetry(() => prisma.productVariant.updateMany({ where: { id: { in: variantIds } }, data: { price, compareAt } }));
    await withRetry(() => prisma.inventory.createMany({
      data: variantIds.map((variantId) => ({ variantId, stock: STOCK_PER_VARIANT, reserved: 0 })),
      skipDuplicates: true,
    }));
    await withRetry(() => prisma.inventory.updateMany({ where: { variantId: { in: variantIds } }, data: { stock: STOCK_PER_VARIANT } }));

    console.log(`  ${name.padEnd(26)} ${variantRows.length} variants`);
  }

  console.log("\ndone");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("FAILED:", error.message);
  await prisma.$disconnect();
  process.exit(1);
});
