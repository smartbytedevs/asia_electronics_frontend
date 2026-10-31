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

export default function LoginPage() {
  const router = useRouter();
  const [nextPath] = useState(readInternalNext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        setError(error.message ?? "Sign in failed. Please try again.");
        return;
      }
      if (!data) {
        setError("Sign in failed. Please try again.");
        return;
      }
      router.push(nextPath ?? "/account");
      router.refresh();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthBrand />
        <AuthCardHeading
          title="Welcome back"
          subtitle="Sign in to continue to your account"
        />
        <form onSubmit={handleSubmit} className="mt-8">
          <Stagger className="space-y-5">
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
                placeholder="your password"
                autoComplete="current-password"
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
              <AuthSubmit submitting={isSubmitting} submittingLabel="Signing in…">
                Sign in
              </AuthSubmit>
            </StaggerItem>
          </Stagger>
          <p className="mt-7 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="rounded font-semibold text-mocha underline-offset-4 transition-colors hover:text-mocha-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Create one
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
