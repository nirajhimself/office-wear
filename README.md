# OFFICE WEAR — Production Commerce System

OFFICE WEAR is a production-oriented D2C fashion storefront and operations system for the Indian market. This release consolidates the earlier visual work into one business application instead of separate UI phases.

## What is included

### Customer storefront
- Premium OFFICE WEAR visual system and supplied logo asset.
- Database-driven catalog, categories, product variants and inventory.
- Product detail pages with color/size selection, wishlist and quick add.
- Persistent browser bag with server-side price/stock validation at checkout.
- Guest checkout and customer accounts.
- Razorpay online payments with server-side signature verification and webhook verification.
- Cash on delivery flow.
- Order confirmation, order history and cancellation.
- Saved addresses and profile management.
- Wishlist.
- Coupon engine.
- Return request flow and admin refund workflow.
- Search event tracking and basic internal product-view/customer events.

### Operations / admin
- Protected `/admin` dashboard with role-based access.
- Orders and order-status management.
- Product creation and catalog management.
- Variant-level inventory and stock movement records.
- Customers.
- Coupons.
- Returns/refunds.
- Basic analytics signals.

### Integrations
- PostgreSQL through Prisma.
- Razorpay integration via server-side REST API.
- Shiprocket provider abstraction and API implementation.
- Analytics environment hooks for GA4 / Meta Pixel.
- Email/provider abstraction can be connected without changing checkout/order logic.

## Architecture

`Next.js + TypeScript + Tailwind/CSS + Prisma + PostgreSQL + secure server sessions + Razorpay + Shiprocket abstraction`

The storefront is DB-driven. Business-critical values are re-read on the server during checkout, so the browser cannot set the final price or bypass stock checks.

## Run locally

1. Install Node.js 20.19+ (or Node.js 22.13+). Your current Node.js 20.11.1 is slightly too old for some newer ESLint packages.
2. Copy `.env.example` to `.env` (this is important because Prisma CLI reads `.env`). You may also use `.env.local` for Next.js-only overrides.
3. Create a PostgreSQL database (Supabase Postgres works well).
4. Fill `DATABASE_URL` in `.env`. `DIRECT_URL` is not required by this version of the Prisma schema.
5. Run:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

If you ever see `@prisma/client did not initialize yet`, run `FIX-PRISMA.bat` from the project folder.

The seed creates the OFFICE WEAR catalog, variants, inventory, `WELCOME10` coupon and an admin account when `ADMIN_EMAIL` / `ADMIN_PASSWORD` are supplied.

## Production setup

### Database
Use a managed PostgreSQL provider. Keep `DATABASE_URL` in Vercel environment variables. This project intentionally uses one database URL so local setup does not fail when `DIRECT_URL` has not been created. Run the Prisma schema migration process from CI/deployment rather than changing production tables manually.

### Razorpay
Set:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Configure Razorpay Checkout and webhook events against your production domain. Payment success is not trusted from the browser: the server verifies the Checkout signature and also accepts signed webhooks.

### Shipping
Set Shiprocket credentials and the pickup location when the shipping account is ready. The provider lives behind `lib/shipping.ts`, so another carrier can be added without changing checkout/order models.

### Security
- Passwords are bcrypt-hashed.
- Session tokens are random, hashed in the database and sent in HTTP-only, same-site cookies.
- Admin routes are role protected on the server.
- Checkout re-validates product, variant, price, coupon and inventory data server-side.
- Inventory is recorded as stock/reservation movements rather than silently overwritten.
- Razorpay secrets never reach the browser.
- Card numbers, CVV and UPI PINs are never stored by this application.

## Important launch checklist

Before accepting real customers:

- Replace all test Razorpay credentials with live credentials and verify the webhook endpoint.
- Connect and test Shiprocket pickup, courier selection and tracking.
- Configure transactional email/SMS/WhatsApp provider.
- Add the final return, privacy, terms and shipping policy copy approved by the business/legal owner.
- Replace demo product photography/copy where necessary.
- Run end-to-end payment, COD, cancellation, refund, return and low-stock tests.
- Add production error monitoring and database backups.
- Set Vercel environment variables for Production and Preview separately.
- Promote the intended admin user to `ADMIN`; never use the seed admin password in production.

## Business data model

The Prisma schema covers customers, sessions, products, variants, images, categories, collections, inventory transactions, carts, addresses, orders, payments, shipments, coupons, reviews, wishlists, customer events, product views, search events, return requests, refunds, notifications and brand settings.

This is the single consolidated OFFICE WEAR release. The earlier phase ZIPs should not be treated as separate production applications.
