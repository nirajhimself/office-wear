import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery | OFFICE WEAR",
  description:
    "Learn about order processing, delivery information, and shipment tracking at OFFICE WEAR.",
};

export default function ShippingPage() {
  return (
    <main className="legal-page page-shell">
      <span className="eyebrow-dark">CUSTOMER INFORMATION / 01</span>

      <h1>
        Shipping &
        <br />
        <em>delivery.</em>
      </h1>

      <p className="legal-note">
        Please review the delivery information shown at checkout. Final
        processing timelines, serviceable locations, and carrier commitments
        must be confirmed by OFFICE WEAR before launch.
      </p>

      <section>
        <h2>Where we deliver</h2>
        <p>
          Delivery availability depends on the destination and the service
          offered by our shipping partners. Please enter your delivery address
          at checkout to review the options available for your order.
        </p>

        <h2>Order processing</h2>
        <p>
          Orders are subject to product availability and order confirmation.
          Processing and delivery estimates should be treated as estimates
          rather than guaranteed arrival dates. Any confirmed timeline shown
          during checkout or in your order communication should be used as your
          reference.
        </p>

        <h2>Delivery charges</h2>
        <p>
          Applicable delivery charges are displayed during checkout before you
          place your order. If complimentary delivery is offered for your order,
          the qualifying conditions will be shown at checkout.
        </p>

        <h2>Tracking your order</h2>
        <p>
          Where shipment tracking is available, use the tracking reference
          shared in your order or dispatch communication. Tracking updates
          depend on the shipping provider.
        </p>

        <h2>Need help?</h2>
        <p>
          If you have a question about an existing order, sign in to your
          account to review the available order information. If you still need
          assistance, use the support contact published by OFFICE WEAR.
        </p>

        <Link href="/account" className="text-link">
          Visit your account
        </Link>
      </section>
    </main>
  );
}
