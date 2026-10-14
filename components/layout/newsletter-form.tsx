"use client";

import { useActionState } from "react";
import { ArrowUpRight } from "lucide-react";
import { subscribeNewsletter } from "@/lib/marketing/actions";

const initialState = {
  status: "idle" as "idle" | "success" | "error",
  message: "",
};

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletter,
    initialState,
  );

  return (
    <div>
      <form action={formAction} className="newsletter-form">
        <input
          type="email"
          name="email"
          placeholder="Your email address"
          aria-label="Your email address"
          autoComplete="email"
          required
          disabled={isPending}
        />

        <button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Subscribe"}
          {!isPending && <ArrowUpRight size={14} />}
        </button>
      </form>

      <p
        role="status"
        aria-live="polite"
        className="footer-newsletter-feedback"
      >
        {state.message}
      </p>
    </div>
  );
}
