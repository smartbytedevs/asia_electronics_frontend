"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthBrand, AuthCardHeading } from "@/components/auth/auth-brand";
import { AuthField } from "@/components/auth/auth-field";
import { AuthError } from "@/components/auth/auth-error";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { Stagger, StaggerItem } from "@/components/auth/auth-stagger";

/**
 * Returns a validated internal redirect path from a `next` query param, or
 * null when absent / external. Only same-site paths are allowed (no scheme,
 * no `//`, no backslashes) so a crafted link can never cause an open redirect.
 */
function readInternalNext() {
  try {
    const raw = new URLSearchParams(window.location.search).get("next");
    if (
      typeof raw !== "string" ||
      !raw.startsWith("/") ||
      raw.startsWith("//") ||
      raw.includes("\\")
    ) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [nextPath] = useState(readInternalNext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) {
        setError(error.message ?? "Could not create account. Please try again.");
        return;
      }
      if (!data) {
        setError("Could not create account. Please try again.");
        return;
      }
      router.push(nextPath ?? "/account");
      router.refresh();
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthBrand />
        <AuthCardHeading
          title="Create your account"
          subtitle="Join us and discover timeless elegance"
        />
        <form onSubmit={handleSubmit} className="mt-8">
          <Stagger className="space-y-5">
            <StaggerItem>
              <AuthField
                id="name"
                label="Name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </StaggerItem>
            <StaggerItem>
              <AuthField
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </StaggerItem>
            <StaggerItem>
              <AuthField
                id="password"
                label="Password"
                type="password"
                placeholder="at least 8 characters"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </StaggerItem>
            {error ? (
              <StaggerItem>
                <AuthError message={error} />
              </StaggerItem>
            ) : null}
            <StaggerItem>
              <AuthSubmit
                submitting={isSubmitting}
                submittingLabel="Creating account…"
              >
                Create account
              </AuthSubmit>
            </StaggerItem>
          </Stagger>
          <p className="mt-7 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="rounded font-semibold text-mocha underline-offset-4 transition-colors hover:text-mocha-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
