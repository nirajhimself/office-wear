import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Find your fit with the OFFICE WEAR size guide and simple measuring tips.",
};

export default function SizeGuidePage() {
  return (
    <main className="legal-page page-shell">
      <span className="eyebrow-dark">OFFICE WEAR · FIT GUIDE</span>

      <h1>
        Find your
        <br />
        <em>right fit.</em>
      </h1>

      <p className="legal-note">
        A good fit starts with knowing your measurements. Use this guide to help
        choose your size before ordering.
      </p>

      <section>
        <h2>How to measure</h2>

        <p>
          Use a flexible measuring tape and keep it comfortably close to your
          body without pulling it tight.
        </p>

        <h2>Chest</h2>
        <p>
          Measure around the fullest part of your chest, keeping the tape level
          across your back.
        </p>

        <h2>Waist</h2>
        <p>
          Measure around your natural waist without holding your breath or
          pulling the tape too tight.
        </p>

        <h2>Hips</h2>
        <p>Stand naturally and measure around the fullest part of your hips.</p>

        <h2>Inside leg</h2>
        <p>
          For trousers, measure from the top of your inner thigh down to your
          preferred trouser length.
        </p>

        <h2>Between sizes?</h2>
        <p>
          Check the fit description on the individual product page. Your
          preferred fit and the garment's cut can affect which size feels most
          comfortable.
        </p>

        <p>
          Need help choosing? <Link href="/about">Contact OFFICE WEAR</Link>{" "}
          through the available business contact details.
        </p>

        <p>
          <Link href="/shop">Explore the collection →</Link>
        </p>
      </section>
    </main>
  );
}
