import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Our Story | OFFICE WEAR",
  description:
    "Discover the thinking behind OFFICE WEAR: considered everyday clothing for work, weekends, and everything in between.",
};

export default function AboutPage() {
  return (
    <main className="legal-page page-shell">
      <span className="eyebrow-dark">THE THINKING BEHIND THE CLOTHES</span>

      <h1>
        Work doesn’t have
        <br />
        to look <em>ordinary.</em>
      </h1>

      <p className="legal-note">
        OFFICE WEAR is built around a simple idea: everyday clothing should feel
        considered, comfortable, and easy to make your own.
      </p>

      <section>
        <h2>Made for real days</h2>
        <p>
          A working day rarely looks the same from start to finish. There are
          early commutes, long meetings, quick coffee breaks, and plans that
          begin after the workday ends. We believe the clothes you wear should
          feel at home through all of it.
        </p>

        <h2>A considered approach</h2>
        <p>
          Our focus is on wearable silhouettes, versatile pieces, and a
          restrained point of view. Rather than dressing for a single occasion,
          we want to help you build a wardrobe you can return to, season after
          season.
        </p>

        <h2>Less noise. More purpose.</h2>
        <p>
          We believe good everyday style does not need to be complicated. The
          right shirt, a dependable pair of trousers, or a useful layer can make
          getting dressed feel simpler. Each piece should have a place in your
          day and in your wardrobe.
        </p>

        <h2>Our point of view</h2>
        <p>
          OFFICE WEAR is a work in progress, shaped by the people who wear our
          clothes and the everyday needs they bring to us. We aim to make
          thoughtful choices and communicate clearly about every product we
          offer.
        </p>

        <p>Thank you for being here at the beginning.</p>

        <Link href="/shop" className="button button-dark">
          Explore the collection <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
