# OFFICE WEAR — Final production architecture

## Application

- Next.js App Router + TypeScript
- Server Components for DB-backed storefront/admin pages
- Client Components only where interaction requires browser state
- Existing premium OFFICE WEAR visual system retained

## Business data

PostgreSQL is the system of record. Prisma models catalog, variants, inventory transactions, carts, addresses, customers, orders, payments, shipments, coupons, reviews, wishlist, analytics events, returns, refunds and notifications.

## Authentication

Customer/admin credentials are stored as bcrypt password hashes. Sessions are random opaque tokens; only SHA-256 token hashes are stored in PostgreSQL. The browser receives an HTTP-only, same-site session cookie. Authorization is checked on the server for account and admin operations.

## Commerce safety

The browser sends product/variant selections only. At checkout the server reloads the current variant prices and available stock from PostgreSQL, validates quantities and coupons, reserves inventory inside a transaction and creates the order.

For prepaid orders, the server creates the Razorpay order. The browser's success response is never trusted by itself: the server verifies the Razorpay signature and also handles signed webhooks. Inventory moves from reserved to sold only after verified payment.

For COD orders, inventory is confirmed immediately and payment remains an operational COD authorization state.

## Inventory

Available stock and reserved stock are separate. Every reserve, release, sale, return or adjustment creates an `InventoryTransaction` record. This preserves an auditable stock trail.

## Shipping

`lib/shipping.ts` is a provider boundary. Shiprocket is the current implementation. The admin can create a shipment after an order is confirmed. The order stores the delivery address snapshot so guest orders remain fulfilment-safe even if a customer later edits their account address.

## Payments / refunds

Razorpay is isolated under `lib/payments/razorpay.ts`. No card number, CVV or UPI PIN is stored. Refunds are requested through Razorpay when a captured payment has a provider payment ID.

## Admin

`/admin` is server-protected by the ADMIN role. Operations include orders, products, inventory, customers, coupons, returns/refunds and basic analytics.

## Deployment

Vercel hosts the Next.js application. A managed PostgreSQL provider such as Supabase Postgres can host the database. Production secrets belong in the deployment platform's encrypted environment variables, never in Git.
