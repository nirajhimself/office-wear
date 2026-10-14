import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { subscribeNewsletter } from "@/lib/marketing/actions";

const footerLinks = {
  Shop: [
    ["New arrivals", "/shop?sort=newest"],
    ["Shirts", "/collections/shirts"],
    ["Trousers", "/collections/trousers"],
    ["Jackets", "/collections/jackets"],
    ["Essentials", "/collections/essentials"],
  ],
  Discover: [
    ["Our story", "/about"],
    ["Journal", "/journal"],
    ["Size guide", "/size-guide"],
  ],
  "Customer care": [
    ["Shipping & delivery", "/shipping"],
    ["Returns & refunds", "/returns"],
    ["My account", "/account"],
    ["Privacy policy", "/privacy"],
    ["Terms of service", "/terms"],
  ],
};

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" aria-label="OFFICE WEAR home">
            <Image
              src="/assets/brand/logo.png"
              alt="OFFICE WEAR"
              width={2048}
              height={2048}
              className="footer-logo"
            />
          </Link>

          <p>
            Thoughtful everyday clothing for work, weekends, and everything in
            between.
          </p>

          <Link href="/shop" className="footer-shop-link">
            Explore the collection <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="footer-columns">
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <span className="footer-label">{title}</span>

              {items.map(([label, href]) => (
                <Link href={href} key={label}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="newsletter">
          <span className="footer-label">The Office Letter</span>

          <h2 className="footer-newsletter-title">A little more considered.</h2>

          <p>
            New collections, styling notes, and occasional early access. Only
            when there is something worth sharing.
          </p>

          <form action={subscribeNewsletter} className="newsletter-form">
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              aria-label="Your email address"
              autoComplete="email"
              required
            />

            <button type="submit">
              Subscribe <ArrowUpRight size={14} />
            </button>
          </form>

          <small className="footer-newsletter-note">
            By subscribing, you agree to receive occasional emails from OFFICE
            WEAR. You can unsubscribe from marketing emails at any time.
          </small>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} OFFICE WEAR</span>
        <span>Clothing for the modern workday.</span>
        <span>India</span>
      </div>
    </footer>
  );
}
