import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/components/cart/cart-provider";

export const metadata: Metadata = {
  title: {
    default: "OFFICE WEAR — Clothing for the modern workday",
    template: "%s — OFFICE WEAR",
  },
  description:
    "OFFICE WEAR creates modern, considered clothing for the modern workday.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/assets/brand/logo.png",
    apple: "/assets/brand/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <CartProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
