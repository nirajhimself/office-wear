import Link from "next/link";

export const metadata = {
  title: "Returns & Refunds | OFFICE WEAR",
  description:
    "Find information about return requests and refunds for OFFICE WEAR orders.",
};

export default function ReturnsPage() {
  return (
    <main className="legal-page page-shell">
      <span className="eyebrow-dark">CUSTOMER INFORMATION / 02</span>

      <h1>
        Returns &
        <br />
        <em>refunds.</em>
      </h1>

      <p className="legal-note">
        Return eligibility, request deadlines, product exclusions, and refund
        timelines must be confirmed by OFFICE WEAR before this page is treated
        as the final customer policy.
      </p>

      <section>
        <h2>Before requesting a return</h2>
        <p>
          Please review the final return conditions that apply to your order
          before sending an item back. These conditions should explain which
          products are eligible, the permitted request period, and the condition
          in which items must be returned.
        </p>

        <h2>How to request a return</h2>
        <p>
          Where return requests are enabled for your order, sign in to your
          account and open the relevant order to review the available options. A
          request may be subject to review and approval before a return can
          proceed.
        </p>

        <h2>Product condition</h2>
        <p>
          The final policy should specify the requirements for unworn or unused
          items, original tags, packaging, and any product categories that
          cannot be returned. Please confirm these requirements before
          dispatching an item back.
        </p>

        <h2>Refunds</h2>
        <p>
          Refund eligibility and processing depend on the outcome of the return
          review, the original payment method, and the applicable business
          process. The final policy should state expected processing timelines
          and how refunds for cash-on- delivery orders will be handled.
        </p>

        <h2>Questions about a return</h2>
        <p>
          Keep your order details available when contacting the support channel
          published by OFFICE WEAR.
        </p>

        <Link href="/account" className="text-link">
          Review your orders
        </Link>
      </section>
    </main>
  );
}
