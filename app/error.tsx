"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <main className="legal-page page-shell">
      <span className="eyebrow-dark">SOMETHING WENT WRONG</span>

      <h1>
        We couldn’t load
        <br />
        this <em>page.</em>
      </h1>

      <p className="legal-note">
        This is on us, not on you. The page failed to load just now — please try
        again in a moment.
      </p>

      <section>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button type="button" className="button button-dark" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="button button-outline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
