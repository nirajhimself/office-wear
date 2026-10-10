require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: false });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/*
|--------------------------------------------------------------------------
| OFFICE WEAR — DATABASE SEED
|--------------------------------------------------------------------------
| Creates:
| - Categories
| - Collection
| - Products
| - Product images
| - Product variants
| - Inventory
| - Brand settings
| - Welcome coupon
| - Admin user
|--------------------------------------------------------------------------
*/

const products = [
  [
    "ow-001",
    "The Everyday Shirt",
    "the-everyday-shirt",
    "Shirts",
    "Men",
    1490,
    "A clean, easy shirt cut for long workdays and after-hours plans.",
    "photo-1603252110481-7ba873bf42ab",
    "photo-1596755389378-c31d21fd1273",
    ["Stone", "White", "Black"],
    ["S", "M", "L", "XL"],
  ],

  [
    "ow-002",
    "The Relaxed Oxford",
    "the-relaxed-oxford",
    "Shirts",
    "Men",
    1690,
    "Soft structure, relaxed proportions and an understated finish.",
    "photo-1602810318383-e386cc2a3ccf",
    "photo-1621072156002-e2fccdc0b176",
    ["White", "Sky", "Navy"],
    ["S", "M", "L", "XL"],
  ],

  [
    "ow-003",
    "The Fine Stripe",
    "the-fine-stripe",
    "Shirts",
    "Women",
    1590,
    "A refined stripe with an easy drape for desk-to-dinner dressing.",
    "photo-1594633312681-425c7b97ccd1",
    "photo-1603252109303-2751441dd157",
    ["Blue Stripe", "Charcoal"],
    ["XS", "S", "M", "L"],
  ],

  [
    "ow-004",
    "The Tailored Trouser",
    "the-tailored-trouser",
    "Trousers",
    "Men",
    1890,
    "A straight, considered trouser with enough ease for the commute.",
    "photo-1624378439575-d8705ad7ae80",
    "photo-1594938298603-c8148c4dae35",
    ["Charcoal", "Black", "Olive"],
    ["28", "30", "32", "34", "36"],
  ],

  [
    "ow-005",
    "The Wide Trouser",
    "the-wide-trouser",
    "Trousers",
    "Women",
    1990,
    "A fluid wide-leg silhouette designed for a polished everyday uniform.",
    "photo-1594938298603-c8148c4dae35",
    "photo-1509631179647-0177331693ae",
    ["Black", "Stone"],
    ["XS", "S", "M", "L"],
  ],

  [
    "ow-006",
    "The Utility Overshirt",
    "the-utility-overshirt",
    "Jackets",
    "Unisex",
    2290,
    "Light structure and practical pockets, finished with a quiet silhouette.",
    "photo-1548883354-7622d03aca27",
    "photo-1594938298603-c8148c4dae35",
    ["Olive", "Black"],
    ["S", "M", "L", "XL"],
  ],

  [
    "ow-007",
    "The Modern Blazer",
    "the-modern-blazer",
    "Jackets",
    "Women",
    3490,
    "A softened blazer with a clean shoulder and an everyday point of view.",
    "photo-1581044777550-4cfa60707c03",
    "photo-1594938298603-c8148c4dae35",
    ["Black", "Stone"],
    ["XS", "S", "M", "L"],
  ],

  [
    "ow-008",
    "The Essential Tee",
    "the-essential-tee",
    "Essentials",
    "Unisex",
    990,
    "The foundation piece: substantial cotton, clean neck and an easy fit.",
    "photo-1521572163474-6864f9cf17ab",
    "photo-1503341504253-dff4815485f1",
    ["Off White", "Black", "Charcoal"],
    ["XS", "S", "M", "L", "XL"],
  ],

  [
    "ow-009",
    "The Workday Polo",
    "the-workday-polo",
    "Essentials",
    "Men",
    1290,
    "A sharper alternative to the tee, designed to carry you through the week.",
    "photo-1617127365659-c47fa864d8bc",
    "photo-1521572163474-6864f9cf17ab",
    ["Navy", "Black", "Stone"],
    ["S", "M", "L", "XL"],
  ],

  [
    "ow-010",
    "The Fine Knit",
    "the-fine-knit",
    "Essentials",
    "Women",
    1790,
    "A fine-gauge layer that works under tailoring or on its own.",
    "photo-1483985988355-763728e1935b",
    "photo-1485968579580-b6d095142e6e",
    ["Oat", "Black"],
    ["XS", "S", "M", "L"],
  ],

  [
    "ow-011",
    "The Daily Shirt",
    "the-daily-shirt",
    "Shirts",
    "Unisex",
    1390,
    "A pared-back button-down built around a modern, slightly relaxed fit.",
    "photo-1598033129183-c4f50c736f10",
    "photo-1603252109303-2751441dd157",
    ["Black", "White"],
    ["S", "M", "L", "XL"],
  ],

  [
    "ow-012",
    "The Pleated Trouser",
    "the-pleated-trouser",
    "Trousers",
    "Unisex",
    2090,
    "A single-pleat trouser with a clean break and comfortable movement.",
    "photo-1473966968600-fa801b869a1a",
    "photo-1515886657613-9f3515b0c78f",
    ["Stone", "Charcoal"],
    ["28", "30", "32", "34", "36"],
  ],
];

/*
|--------------------------------------------------------------------------
| Image helper
|--------------------------------------------------------------------------
*/

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=88`;

/*
|--------------------------------------------------------------------------
| Category data
|--------------------------------------------------------------------------
*/

const categoryData = {
  Shirts: "Clean layers for meetings, commutes and everything between.",

  Trousers: "Considered shapes built for movement and long days.",

  Jackets: "Soft structure for a sharper workday.",

  Essentials: "The quiet foundations of the modern wardrobe.",
};

/*
|--------------------------------------------------------------------------
| Category images
|--------------------------------------------------------------------------
*/

const categoryImage = {
  Shirts: "photo-1603252110481-7ba873bf42ab",

  Trousers: "photo-1624378439575-d8705ad7ae80",

  Jackets: "photo-1548883354-7622d03aca27",

  Essentials: "photo-1521572163474-6864f9cf17ab",
};

/*
|--------------------------------------------------------------------------
| Main seed function
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("Starting OFFICE WEAR database seed...\n");

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  console.log("Creating categories...");

  for (const [name, description] of Object.entries(categoryData)) {
    await prisma.category.upsert({
      where: {
        slug: name.toLowerCase(),
      },

      update: {
        description,
        image: img(categoryImage[name]),
      },

      create: {
        name,
        slug: name.toLowerCase(),
        description,
        image: img(categoryImage[name]),
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Collection
  |--------------------------------------------------------------------------
  */

  console.log("Creating collection...");

  const collection = await prisma.collection.upsert({
    where: {
      slug: "the-first-edit",
    },

    update: {
      description: "The considered first collection from OFFICE WEAR.",
    },

    create: {
      name: "The First Edit",
      slug: "the-first-edit",
      description: "The considered first collection from OFFICE WEAR.",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  console.log("Creating products...\n");

  for (const [
    id,
    name,
    slug,
    category,
    gender,
    price,
    description,
    image,
    hoverImage,
    colors,
    sizes,
  ] of products) {
    console.log(`Creating ${name}...`);

    const categoryRecord = await prisma.category.findUnique({
      where: {
        slug: category.toLowerCase(),
      },
    });

    if (!categoryRecord) {
      throw new Error(`Category not found: ${category}`);
    }

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    await prisma.product.upsert({
      where: {
        id,
      },

      update: {
        name,
        slug,
        description,
        gender,
        categoryId: categoryRecord.id,
        collectionId: collection.id,
        status: "ACTIVE",
        featured: id === "ow-001" || id === "ow-002",
      },

      create: {
        id,
        name,
        slug,
        description,
        gender,
        categoryId: categoryRecord.id,
        collectionId: collection.id,
        status: "ACTIVE",
        featured: id === "ow-001" || id === "ow-002",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Product images
    |--------------------------------------------------------------------------
    */

    await prisma.productImage.deleteMany({
      where: {
        productId: id,
      },
    });

    await prisma.productImage.createMany({
      data: [
        {
          productId: id,
          url: img(image),
          alt: name,
          sortOrder: 0,
        },

        {
          productId: id,
          url: img(hoverImage),
          alt: `${name} alternate view`,
          sortOrder: 1,
        },
      ],
    });

    /*
    |--------------------------------------------------------------------------
    | Product variants + inventory
    |--------------------------------------------------------------------------
    */

    for (const size of sizes) {
      for (const color of colors) {
        const variantId = `${id}-${size}-${color}`;

        const sku = `OW-${id.replace("ow-", "")}-${size}-${color
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")}`;

        /*
        | Product variant
        */

        await prisma.productVariant.upsert({
          where: {
            id: variantId,
          },

          update: {
            price,
            size,
            color,
          },

          create: {
            id: variantId,
            productId: id,
            sku,
            size,
            color,
            price,
          },
        });

        /*
        | Inventory
        */

        await prisma.inventory.upsert({
          where: {
            variantId,
          },

          update: {},

          create: {
            variantId,
            stock: 10,
          },
        });
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Brand settings
  |--------------------------------------------------------------------------
  */

  console.log("\nCreating brand settings...");

  await prisma.brandSettings.upsert({
    where: {
      id: "brand",
    },

    update: {},

    create: {
      id: "brand",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Welcome coupon
  |--------------------------------------------------------------------------
  */

  console.log("Creating welcome coupon...");

  await prisma.coupon.upsert({
    where: {
      code: "WELCOME10",
    },

    update: {},

    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minOrderValue: 1999,
      active: true,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Admin user
  |--------------------------------------------------------------------------
  */

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log("Creating admin user...");

    const email = process.env.ADMIN_EMAIL.toLowerCase();

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await prisma.user.upsert({
      where: {
        email,
      },

      update: {
        role: "ADMIN",
        passwordHash,
      },

      create: {
        email,
        passwordHash,
        name: "OFFICE WEAR Admin",
        role: "ADMIN",
      },
    });
  } else {
    console.log(
      "ADMIN_EMAIL or ADMIN_PASSWORD not found. Skipping admin user.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Finished
  |--------------------------------------------------------------------------
  */

  console.log("\n========================================");
  console.log("OFFICE WEAR seed complete.");
  console.log("========================================\n");
}

/*
|--------------------------------------------------------------------------
| Run seed
|--------------------------------------------------------------------------
*/

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
