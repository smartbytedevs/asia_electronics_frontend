"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { safeMessage } from "@/lib/api/http";

const inputClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

/**
 * Single-field form for the storefront Meta Pixel ID. The value is read from
 * the public settings endpoint and written through the authenticated proxy,
 * which forwards the existing admin JWT.
 */
export function PixelSettingsForm() {
  const [fbPixelId, setFbPixelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getSettings();
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.ok) {
        setFbPixelId(result.payload?.data?.settings?.fbPixelId ?? "");
      } else {
        setError(safeMessage(result.status, result.payload));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateSettings({ fbPixelId: fbPixelId.trim() });
    setSaving(false);

    if (result.ok) {
      setFbPixelId(result.payload?.data?.settings?.fbPixelId ?? "");
      setSaved(true);
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <section className="w-full max-w-xl rounded-2xl border border-gold-soft/70 bg-cream p-6 shadow-xl">
      <h2 className="font-display text-xl text-ink">Meta Pixel</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The Pixel ID is loaded on every storefront page. Leave it empty to
        disable tracking.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-mocha-deep">Pixel ID</span>
          <input
            type="text"
            value={fbPixelId}
            onChange={(event) => {
              setFbPixelId(event.target.value);
              setSaved(false);
            }}
            disabled={loading || saving}
            maxLength={100}
            placeholder="e.g. 123456789012345"
            className={inputClass}
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#c9604d]"
          >
            {error}
          </p>
        ) : null}

        {saved ? (
          <p
            role="status"
            className="rounded-lg border border-gold-soft/70 bg-gold-soft/30 px-3 py-2 text-sm text-mocha-deep"
          >
            Pixel settings saved.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || saving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gold px-4 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
