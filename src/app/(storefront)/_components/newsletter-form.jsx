"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

/**
 * Newsletter signup — marketing-only for now; there is no backend endpoint,
 * so a successful submit just confirms the signup visually.
 */
export function NewsletterForm() {
  const { showToast } = useCart();
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setEmail("");
    showToast("Thank you — you're on the list");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email address"
        className="w-full flex-1 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white placeholder:text-white/40 focus-visible:border-electric/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
      />
      <button
        type="submit"
        className="rounded-full bg-electric px-7 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        Subscribe
      </button>
    </form>
  );
}
