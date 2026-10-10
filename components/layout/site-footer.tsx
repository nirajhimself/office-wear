import Image from "next/image";
import Link from "next/link";
import { subscribeNewsletter } from "@/lib/marketing/actions";

const footerLinks = {
  Shop: [["New arrivals","/shop?sort=newest"],["Shirts","/collections/shirts"],["Trousers","/collections/trousers"],["Jackets","/collections/jackets"],["Essentials","/collections/essentials"]],
  Company: [["About","/about"],["Journal","/journal"],["Contact","/about"],["Size guide","/product/the-everyday-shirt"]],
  Help: [["Shipping","/shipping"],["Returns","/returns"],["Track order","/account"],["Privacy","/privacy"],["Terms","/terms"]],
};

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Image src="/assets/brand/logo.png" alt="OFFICE WEAR" width={2048} height={2048} className="footer-logo" />
          <p>Clothing for the modern workday.</p>
        </div>
        <div className="footer-columns">
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <span className="footer-label">{title}</span>
              {items.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="newsletter">
          <span className="footer-label">The Office Letter</span>
          <p>New edits, stories and early access. Nothing unnecessary.</p>
          <form action={subscribeNewsletter} className="newsletter-form"><input type="email" placeholder="Email address" aria-label="Email address" /><button type="submit">Join</button></form>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 OFFICE WEAR</span><span>Made for the hours that matter.</span><span>India</span></div>
    </footer>
  );
}
