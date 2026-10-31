"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { safeMessage } from "@/lib/api/http";
import { submitProductReview } from "@/lib/api/reviews";
import { StarIcon } from "./icons";

const COMMENT_MAX = 2000;

/**
 * Customer review submission for the product detail page.
 *
 * Review identity always comes from the authenticated backend identity — the
 * body only ever carries `rating` and `comment`; `customerId`/`status`/
 * `approvedBy` are server-derived. New reviews are created PENDING and only
 * become visible publicly once an admin approves them, so the storefront shows
 * a clear "submitted for review" confirmation and never lists the new review.
 * Guests can read approved reviews but cannot submit (they see a sign-in
 * prompt instead).
 */
export function ReviewForm({ productId, slug }) {
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isPending) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-sand bg-sand/40 p-6">
        <p className="font-display text-lg text-ink">Share your thoughts</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          We&apos;d love to hear how your new product is treating you. Sign in
          to write a review.
        </p>
        <Link
          href={`/login?next=/products/${encodeURIComponent(slug)}`}
          className="mt-4 inline-flex rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:border-mocha hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await submitProductReview(productId, {
        rating,
        comment: comment.trim(),
      });
      if (!res.ok) {
        setError(safeMessage(res.status, res.payload));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong while submitting your review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          className="rounded-2xl border border-gold-soft bg-sand/40 p-6"
        >
          <p className="font-display text-lg text-ink">
            Thank you for your review
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Your review has been submitted and is awaiting approval. It will
            appear here once our team has reviewed it.
          </p>
        </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-sand bg-white p-6"
    >
      <p className="font-display text-lg text-ink">Write a review</p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Your rating
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={value <= rating}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onClick={() => setRating(value)}
              className="rounded-md p-1 text-gold transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <StarIcon className="h-6 w-6" filled={value <= rating} />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">
            {rating > 0 ? `${rating} / 5` : "Select a rating"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="review-comment"
          className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted"
        >
          Your review (optional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={COMMENT_MAX}
          placeholder="How is the product performing for you?"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-mocha/40 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {comment.length}/{COMMENT_MAX}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-medium text-[#b3412f]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || rating < 1}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-ink px-8 py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
