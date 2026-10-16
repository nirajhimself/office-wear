import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  saveAddress,
  updateProfile,
  removeWishlist,
} from "@/lib/account/actions";
import { AddressCard } from "@/components/account/address-card";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [orders, addresses, wishlist] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.wishlist.findMany({
      where: { userId: user.id },
      include: { product: true },
    }),
  ]);

  return (
    <main className="account-page page-shell">
      <header className="account-heading">
        <span className="eyebrow">YOUR OFFICE / ACCOUNT</span>
        <h1>Hello, {user.name.split(" ")[0]}.</h1>
        <p>Your personal space for orders, addresses and saved pieces.</p>
      </header>

      <div className="account-grid">
        <section className="account-panel account-panel-wide">
          <span className="panel-kicker">PROFILE</span>

          <form action={updateProfile} className="account-form">
            <label>
              Name
              <input
                name="name"
                defaultValue={user.name}
                required
                minLength={2}
              />
            </label>

            <label>
              Email
              <input value={user.email} disabled />
            </label>

            <label>
              Phone
              <input name="phone" type="tel" defaultValue={user.phone || ""} />
            </label>

            <button className="button button-dark" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <section className="account-panel account-panel-wide">
          <span className="panel-kicker">ORDERS</span>

          {orders.length > 0 ? (
            <div className="account-orders">
              {orders.map((order) => (
                <Link href={`/order/${order.orderNumber}`} key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>
                      {order.items.length} items ·{" "}
                      {order.createdAt.toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <b>₹{order.total.toLocaleString("en-IN")}</b>

                  <small>{order.status.replaceAll("_", " ")}</small>
                </Link>
              ))}
            </div>
          ) : (
            <p>
              No orders yet. Start with the pieces you’ll reach for on repeat.
            </p>
          )}
        </section>

        <section className="account-panel">
          <span className="panel-kicker">ADDRESSES</span>

          <p className="address-section-description">
            Manage your delivery details, rename locations, and choose your
            default address for checkout.
          </p>

          <div className="account-addresses">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={{
                    id: address.id,
                    label: address.label,
                    name: address.name,
                    phone: address.phone,
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    isDefault: address.isDefault,
                  }}
                />
              ))
            ) : (
              <p className="address-empty">
                You have no saved addresses yet. Add your first address below to
                make checkout easier.
              </p>
            )}
          </div>

          <div className="account-address-add">
            <h3>Add a new address</h3>

            <form action={saveAddress} className="account-form compact">
              <label>
                Address label
                <input
                  name="label"
                  placeholder="Home, Work, Parents' Home"
                  required
                  maxLength={40}
                />
              </label>

              <label>
                Recipient name
                <input name="name" placeholder="Full name" required />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  placeholder="10-digit phone number"
                  required
                />
              </label>

              <label>
                Address
                <input
                  name="line1"
                  placeholder="House number, street, locality"
                  required
                />
              </label>

              <label>
                Apartment / area (optional)
                <input name="line2" placeholder="Apartment, landmark or area" />
              </label>

              <div className="two">
                <label>
                  City
                  <input name="city" placeholder="City" required />
                </label>

                <label>
                  State
                  <input name="state" placeholder="State" required />
                </label>
              </div>

              <label>
                PIN code
                <input
                  name="postalCode"
                  placeholder="6-digit PIN code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </label>

              <button className="button button-dark" type="submit">
                Add address
              </button>
            </form>
          </div>
        </section>

        <section className="account-panel">
          <span className="panel-kicker">WISHLIST</span>

          {wishlist.length > 0 ? (
            <div className="wishlist-list">
              {wishlist.map((item) => (
                <div key={item.id}>
                  <Link href={`/product/${item.product.slug}`}>
                    {item.product.name}
                  </Link>

                  <form action={removeWishlist}>
                    <input
                      type="hidden"
                      name="productId"
                      value={item.productId}
                    />
                    <button type="submit">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <>
              <h2>Saved pieces</h2>
              <p>Keep the pieces you are considering close at hand.</p>
            </>
          )}
        </section>
      </div>

      {user.role === "ADMIN" && (
        <Link href="/admin" className="account-admin-link">
          Open operations dashboard →
        </Link>
      )}

      <form action={logoutAction} className="account-logout">
        <button className="text-button" type="submit">
          Sign out
        </button>
      </form>
    </main>
  );
}
