import Link from "next/link";

/*
  Rendered as inline SVG rather than an <img> so the brand faces loaded in
  globals.css (Manrope for display, DM Sans for labels) actually apply — an
  externally referenced SVG cannot fetch webfonts. Colours are the brand
  tokens from docs/brand-guidelines.md.
*/

const BLACK = "#090909";
const PAPER = "#F1F0EB";
const PAPER_2 = "#E9E8E2";
const MUTED = "#8A8A85";

const SECTIONS = [
  "Shirts",
  "Trousers",
  "T-Shirts",
  "Polos",
  "Overshirts",
  "Blazers",
  "Co-ord Sets",
  "Essentials",
];

export function CampaignBanner() {
  return (
    <section className="campaign-banner" aria-label="OFFICE WEAR — the sectioned edit">
      <Link
        href="/shop"
        className="campaign-banner-link"
        aria-label="Shop the OFFICE WEAR sectioned edit"
      >
        <svg
          className="campaign-banner-svg"
          viewBox="0 0 2048 768"
          role="img"
          aria-label="Eight sections. One wardrobe. Explore the OFFICE WEAR edit."
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="2048" height="768" fill={BLACK} />

          {/* Editorial column rules */}
          <g stroke={PAPER} strokeOpacity="0.07" strokeWidth="1">
            {[256, 512, 768, 1024, 1280, 1536, 1792].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="768" />
            ))}
          </g>

          {/* Soft arc motif */}
          <circle
            cx="1690"
            cy="384"
            r="470"
            fill="none"
            stroke={PAPER_2}
            strokeOpacity="0.1"
            strokeWidth="1.5"
          />
          <circle
            cx="1690"
            cy="384"
            r="330"
            fill="none"
            stroke={PAPER_2}
            strokeOpacity="0.07"
            strokeWidth="1.5"
          />

          {/* Eyebrow */}
          <text
            x="140"
            y="188"
            fill={MUTED}
            fontFamily="'DM Sans', Arial, sans-serif"
            fontSize="25"
            fontWeight="500"
            letterSpacing="7"
          >
            OFFICE WEAR · THE SECTIONED EDIT
          </text>

          <line x1="140" y1="228" x2="420" y2="228" stroke={PAPER} strokeOpacity="0.35" strokeWidth="1" />

          {/* Headline */}
          <text
            x="138"
            y="384"
            fill={PAPER}
            fontFamily="Manrope, 'DM Sans', Arial, sans-serif"
            fontSize="132"
            fontWeight="600"
            letterSpacing="-4"
          >
            Eight sections.
          </text>
          <text
            x="138"
            y="510"
            fill={PAPER}
            fontFamily="Manrope, 'DM Sans', Arial, sans-serif"
            fontSize="132"
            fontWeight="600"
            letterSpacing="-4"
            fontStyle="italic"
          >
            One wardrobe.
          </text>

          {/* Supporting line */}
          <text
            x="140"
            y="582"
            fill={MUTED}
            fontFamily="'DM Sans', Arial, sans-serif"
            fontSize="31"
            fontWeight="400"
          >
            Shirts, trousers, tailoring and the essentials in between.
          </text>

          {/* Call to action */}
          <text
            x="140"
            y="666"
            fill={PAPER}
            fontFamily="'DM Sans', Arial, sans-serif"
            fontSize="26"
            fontWeight="500"
            letterSpacing="5"
          >
            EXPLORE THE EDIT
          </text>
          <line x1="140" y1="686" x2="438" y2="686" stroke={PAPER} strokeWidth="1.5" />
          <path d="M452 678 L472 678 M465 671 L472 678 L465 685" stroke={PAPER} strokeWidth="1.5" fill="none" />

          {/* Section index */}
          <g fontFamily="'DM Sans', Arial, sans-serif">
            {SECTIONS.map((name, i) => {
              const col = i < 4 ? 0 : 1;
              const row = i % 4;
              const x = 1420 + col * 290;
              const y = 268 + row * 70;
              return (
                <g key={name}>
                  <text x={x} y={y} fill={MUTED} fontSize="20" fontWeight="500" letterSpacing="3">
                    {String(i + 1).padStart(2, "0")}
                  </text>
                  <text x={x + 52} y={y} fill={PAPER} fontSize="27" fontWeight="400">
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </Link>
    </section>
  );
}
