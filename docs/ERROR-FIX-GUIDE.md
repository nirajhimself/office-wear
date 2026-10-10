# OFFICE WEAR — Error Fix Guide (Simple)

The traceback you reported had **one main Prisma schema problem** and **two follow-up problems** caused by it.

## 1. `This line is not an enum value definition`

You had enum declarations written on one line, for example:

```prisma
enum ProductStatus { DRAFT ACTIVE ARCHIVED }
```

Prisma expects enum values on separate lines. The schema has been changed to:

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

The same fix was applied to every enum in the schema.

### Simple meaning
An enum is a fixed list of allowed values. Prisma needs to see each allowed value clearly.

---

## 2. `Environment variable not found: DIRECT_URL`

The schema required `DIRECT_URL`, but your `.env.local` did not have it.

For this release, the Prisma schema was simplified to use only:

```env
DATABASE_URL="..."
```

`DIRECT_URL` is no longer required.

### Simple meaning
The application only needs one database connection for this setup, so there is no reason to make local installation fail because a second URL is missing.

---

## 3. `@prisma/client did not initialize yet`

This was not a separate database bug.

`npm install` runs:

```bash
prisma generate
```

but Prisma generation failed because the schema was invalid. Therefore the generated Prisma client did not exist correctly.

After the schema is fixed, running `npm install` or `npx prisma generate` creates the client normally.

### Simple meaning
Prisma is like a translator between your JavaScript code and your database. The translator could not be generated because the schema had errors.

---

## 4. ESLint / Node warning

Your log showed:

```text
Node v20.11.1
eslint-visitor-keys requires Node ^20.19.0 || ^22.13.0 || >=24
```

This was a **warning**, not the Prisma failure.

The project now pins ESLint to a compatible version instead of allowing npm to silently install a newer version.

Still, for the cleanest development environment, use Node.js 20.19+ or Node.js 22.13+.

---

# Clean installation on Windows

Because your previous `node_modules` was created during the failed installation, use a clean install.

Open Command Prompt inside the project folder and run:

```bat
rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install
```

Then create `.env.local` from `.env.example` and put your real PostgreSQL connection string into:

```env
DATABASE_URL="your-postgresql-connection-string"
```

Then run:

```bat
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# What each command does

### `npm install`
Downloads the project's libraries.

### `npx prisma generate`
Creates the Prisma database client used by the application.

### `npm run db:push`
Creates/updates the database tables to match `prisma/schema.prisma`.

### `npm run db:seed`
Adds the initial OFFICE WEAR products, categories, variants, inventory, coupon and optional admin account.

### `npm run dev`
Starts the website locally.

---

# Important

Do not paste passwords, Razorpay secret keys or production database credentials into chat.

Put them only in your local `.env.local` file and in the hosting provider's encrypted environment variables.


## Prisma Client not initialized
If Next.js shows `@prisma/client did not initialize yet`, the project now runs `prisma generate` automatically before dev/build/start. If you want to repair it manually, run:

```bash
npm run db:generate
npm run dev
```

If it still appears, delete `node_modules` and `package-lock.json`, run `npm install`, then run `npm run db:generate`.

## Important local environment rule
Use `.env` for `DATABASE_URL` because Prisma CLI reads `.env`. `.env.local` can be used for Next.js-only overrides, but do not keep the only database URL in `.env.local`.
