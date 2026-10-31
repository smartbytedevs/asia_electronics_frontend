"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 6.5 10 6.5a13.2 13.2 0 0 1-1.67 2.33" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 11.5S5.5 18 12 18a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

/**
 * A premium labeled field for the auth forms.
 *
 * - visible focus ring in the brand gold,
 * - built-in show/hide toggle for password inputs (label announces state),
 * - never changes the submitted value — the caller still receives the plain
 *   password string from `onChange`.
 */
export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  minLength,
  value,
  onChange,
  className,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-[0.8rem] font-medium text-stone-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          className={cn(
            "h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-ink shadow-sm transition-colors duration-200 placeholder:text-stone-400",
            "hover:border-stone-400",
            "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25",
            isPassword && "pr-11",
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
