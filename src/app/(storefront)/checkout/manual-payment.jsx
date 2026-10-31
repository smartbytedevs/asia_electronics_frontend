"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  CreditCard,
  FileImage,
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { getMyPayment } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import { getGuestId } from "@/lib/guest-id";
import { cn, formatDateTime, formatMinorUnits } from "@/lib/utils";
import { paymentStatusMeta } from "@/app/(admin)/admin/components/status-meta";
import { StatusBadge } from "@/app/(admin)/admin/components/status-badge";

const EASE = [0.22, 1, 0.36, 1];

// Mirrors backend order.constants.js (MANUAL_PAYMENT_METHODS): only these
// order enums accept a manual proof. A payment-method code outside this set
// cannot be sent to /orders/checkout, so it is never offered here.
export const MANUAL_ORDER_ENUMS = ["BKASH", "BANK_TRANSFER", "MANUAL"];

// Mirrors backend payment.constants.js (PROOF_MEDIA_RULES + PROOF_MAX_BYTES).
const PROOF_MEDIA_RULES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};
const PROOF_MAX_BYTES = 2 * 1024 * 1024;
export const PROOF_ACCEPT = Object.keys(PROOF_MEDIA_RULES).join(",");

const INPUT_CLASSES =
  "mt-1.5 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-mocha/40 focus:outline-none focus:ring-2 focus:ring-gold/40";

function proofExtension(name) {
  if (typeof name !== "string") {
    return null;
  }
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) {
    return null;
  }
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Client-side proof validation mirroring the backend rules (JPEG/PNG/WEBP,
 * extension must match the declared type, ≤ 2 MB). The backend re-checks magic
 * bytes on submission — this only gives a fast, clear message first.
 */
export function validateProofFile(file) {
  if (!file) {
    return "Please attach a payment proof image.";
  }
  if (!PROOF_MEDIA_RULES[file.type]) {
    return "The proof must be a JPG, PNG, or WEBP image.";
  }
  if (file.size > PROOF_MAX_BYTES) {
    return "The proof image must be 2 MB or smaller.";
  }
  const allowed = PROOF_MEDIA_RULES[file.type];
  const extension = proofExtension(file.name);
  if (!extension || !allowed.includes(extension)) {
    return `The proof file must end in ${allowed.join(" or ")}.`;
  }
  return null;
}

/**
 * Submits a payment proof with real upload progress. Uses XHR (fetch does not
 * expose upload progress) to the same BFF proxy the fetch helpers use, with
 * the same headers (`X-Guest-Id` + `Idempotency-Key`). Resolves with the same
 * `{ status, ok, payload }` shape as `backendRequest`, so callers handle it
 * identically — never throws.
 */
export function submitPaymentWithProgress(orderId, formData, idempotencyKey, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/backend/orders/${encodeURIComponent(orderId)}/payment`);
    const guestId = getGuestId();
    if (guestId) {
      xhr.setRequestHeader("X-Guest-Id", guestId);
    }
    xhr.setRequestHeader("Idempotency-Key", idempotencyKey);
    if (onProgress && "upload" in xhr) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }
    xhr.addEventListener("load", () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        payload,
      });
    });
    xhr.addEventListener("error", () => resolve({ status: 0, ok: false, payload: null }));
    xhr.addEventListener("abort", () => resolve({ status: 0, ok: false, payload: null }));
    xhr.send(formData);
  });
}

function methodIcon(method, props) {
  switch (method?.code) {
    case "BKASH":
      return <Smartphone {...props} />;
    case "BANK_TRANSFER":
      return <Landmark {...props} />;
    default:
      return <CreditCard {...props} />;
  }
}

/**
 * Prominent, copyable value row (e.g. the account / mobile number the customer
 * transfers to). Copy is a pure UI convenience — the number stays visible.
 */
function CopyValue({ label, value }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  async function handleCopy() {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — the value is still selectable by hand.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="break-all font-semibold text-ink">{value}</p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-gold-soft/70 bg-white px-2.5 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

/**
 * The backend's customer payment-method serializer exposes exactly these
 * fields; every row below is rendered only when the field is present.
 */
export function AccountDetails({ method, className }) {
  const metadata = method?.metadata || {};
  const lines = [
    metadata.bankName
      ? [metadata.bankName, metadata.branch, metadata.district]
          .filter(Boolean)
          .join(" · ")
      : null,
    metadata.accountName ? `Account: ${metadata.accountName}` : null,
    metadata.accountType ? `Account type: ${metadata.accountType}` : null,
    metadata.routingNumber ? `Routing: ${metadata.routingNumber}` : null,
  ].filter(Boolean);

  return (
    <div className={cn("rounded-2xl border border-gold-soft/60 bg-sand/30 p-4", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-soft/50 text-mocha-deep">
          {methodIcon(method, { className: "h-4.5 w-4.5", "aria-hidden": true })}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{method?.displayName}</p>
          <p className="truncate text-xs text-muted">
            {metadata.bankName ? "Bank account" : method?.code === "BKASH" ? "bKash number" : "Account"}
          </p>
        </div>
      </div>

      {metadata.accountNumber ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Transfer to</p>
          <div className="mt-1">
            <CopyValue
              label={method?.code === "BKASH" ? "bKash number" : "account number"}
              value={metadata.accountNumber}
            />
          </div>
        </div>
      ) : null}

      {lines.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-gold-soft/50 pt-3 text-sm text-muted">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {metadata.instructions ? (
        <p className="mt-3 border-t border-gold-soft/50 pt-3 text-xs leading-relaxed text-mocha-deep">
          {metadata.instructions}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Single proof-file picker: validated client-side, previews the image, and
 * reports problems before anything is sent. The parent owns the file so the
 * choice can survive order placement.
 */
export function ProofUploadControl({
  proof,
  onSelect,
  onRemove,
  error,
  disabled = false,
  id,
}) {
  const inputRef = useRef(null);

  function pick() {
    inputRef.current?.click();
  }

  function handleChange(event) {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      onSelect(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-1.5">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={PROOF_ACCEPT}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      {proof ? (
        <div className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.preview}
            alt="Payment proof preview"
            className="h-16 w-16 shrink-0 rounded-lg border border-gold-soft/60 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{proof.file.name}</p>
            <p className="text-xs text-muted">
              {(proof.file.size / 1024).toFixed(0)} KB · proof image
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove proof image"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-[#c9604d] transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-sand bg-sand/20 px-4 py-6 text-sm text-muted transition-colors hover:border-gold/50 hover:bg-gold-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-5 w-5 text-gold" aria-hidden="true" />
          <span className="font-medium text-mocha-deep">Choose payment proof</span>
          <span className="text-xs">JPG, PNG or WEBP · up to 2 MB</span>
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-[#b3412f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Checkout-stage panel shown when a manual method is selected: the transfer
 * details for the chosen account plus the proof-submission fields the backend
 * accepts. Nothing is sent here — the order must exist first, so the entered
 * values are carried into the confirmation step.
 */
export function ManualPaymentSection({
  method,
  amountMinorUnits,
  reference,
  notes,
  onReference,
  onNotes,
  proof,
  onProofSelect,
  onProofRemove,
  proofError,
  disabled = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mt-5 overflow-hidden"
    >
      <div className="rounded-2xl border border-gold-soft/50 bg-white/70 p-4 sm:p-5">
        <AccountDetails method={method} />

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Submit your payment proof
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Complete these details, then place your order — you&apos;ll confirm
            the receipt on the next step. Our team verifies every payment before
            dispatch.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-ink">
                Amount to transfer
              </label>
              <p
                id="paymentAmount"
                className="mt-1.5 rounded-xl border border-sand bg-sand/30 px-4 py-2.5 font-semibold tabular-nums text-ink"
              >
                {formatMinorUnits(amountMinorUnits)}
              </p>
              <p className="mt-1 text-xs text-muted">
                The exact total is confirmed after your order is placed.
              </p>
            </div>
            <div>
              <label htmlFor="transactionReference" className="block text-sm font-medium text-ink">
                Transaction reference
              </label>
              <input
                id="transactionReference"
                type="text"
                maxLength={100}
                placeholder="e.g. TrxID 12A4B5C6D7"
                required
                value={reference}
                onChange={(event) => onReference(event.target.value)}
                disabled={disabled}
                className={INPUT_CLASSES}
              />
              <p className="mt-1 text-xs text-muted">Required · up to 100 characters.</p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="paymentNotes" className="block text-sm font-medium text-ink">
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="paymentNotes"
              rows={2}
              maxLength={1000}
              placeholder="Anything about your transfer?"
              value={notes}
              onChange={(event) => onNotes(event.target.value)}
              disabled={disabled}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-ink">Payment proof</label>
            <ProofUploadControl
              id="proofUpload"
              proof={proof}
              onSelect={onProofSelect}
              onRemove={onProofRemove}
              error={proofError}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Uploading payment proof"
      className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand"
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-gold to-mocha"
        animate={{ width: `${Math.max(progress, 8)}%` }}
        transition={{ duration: 0.2, ease: EASE }}
      />
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

/**
 * Payment status card rendered after a successful submission (from the
 * submission response or a status re-fetch). Mirrors the customer payment
 * serializer fields only.
 */
function PaymentStatusCard({ payment, recovered = false }) {
  const accountLine = [payment.paymentMethod?.displayName, payment.paymentMethod?.accountNumber]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-2xl border border-gold-soft/60 bg-white/80 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge meta={paymentStatusMeta(payment.status)} />
        {payment.createdAt ? (
          <span className="text-xs text-muted">
            Submitted {formatDateTime(payment.createdAt)}
          </span>
        ) : null}
      </div>

      {recovered ? (
        <p className="mt-3 rounded-lg border border-gold-soft/60 bg-gold-soft/30 px-3 py-2 text-xs text-mocha-deep">
          This order already has a submitted payment — here is its current
          status.
        </p>
      ) : null}

      <dl className="mt-3 divide-y divide-sand border-t border-sand pt-1 text-sm">
        {accountLine ? <DetailRow label="Transferred to">{accountLine}</DetailRow> : null}
        {payment.transactionReference ? (
          <DetailRow label="Reference">{payment.transactionReference}</DetailRow>
        ) : null}
        {payment.submittedAmountMinorUnits != null ? (
          <DetailRow label="Submitted amount">
            {formatMinorUnits(payment.submittedAmountMinorUnits)}
          </DetailRow>
        ) : null}
        {payment.notes ? <DetailRow label="Notes">{payment.notes}</DetailRow> : null}
        {payment.proof?.secureUrl ? (
          <div className="flex items-start justify-between gap-6 py-2">
            <dt className="text-sm text-muted">Receipt</dt>
            <dd className="text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.proof.secureUrl}
                alt="Submitted payment proof"
                className="ml-auto h-16 w-16 rounded-lg border border-gold-soft/60 object-cover"
              />
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs leading-relaxed text-emerald-800">
        <span className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Your payment has been recorded for review. Our team will verify it
            before your order is dispatched — no need to send anything else.
          </span>
        </span>
      </p>
    </motion.div>
  );
}

/**
 * Post-order proof submission. Runs only after checkout returns the order, so
 * the amount is the backend's exact `grandTotalMinorUnits` (read-only — partial
 * payments are not supported) and the chosen proof can be uploaded to the real
 * endpoint. Shows upload progress, validation, success and error states.
 */
export function PaymentSubmissionPanel({
  order,
  method,
  initialReference = "",
  initialNotes = "",
  initialProof = null,
  isSignedIn = false,
}) {
  const [reference, setReference] = useState(initialReference);
  const [notes, setNotes] = useState(initialNotes);
  const [proof, setProof] = useState(initialProof);
  const [proofError, setProofError] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  const [recovered, setRecovered] = useState(false);

  const orderId = order?.id;
  const exactAmountMinorUnits = order?.totals?.grandTotalMinorUnits;

  useEffect(() => {
    return () => {
      if (initialProof?.preview) {
        URL.revokeObjectURL(initialProof.preview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProof(file) {
    const problem = validateProofFile(file);
    setProofError(problem || "");
    if (problem) {
      setProof((prev) => {
        if (prev?.preview) {
          URL.revokeObjectURL(prev.preview);
        }
        return null;
      });
      return;
    }
    setProof((prev) => {
      if (prev?.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      return { file, preview: URL.createObjectURL(file) };
    });
  }

  function removeProof() {
    setProof((prev) => {
      if (prev?.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
    setProofError("");
  }

  function validate() {
    if (!orderId) {
      return "We couldn't identify your order. Please refresh and try again.";
    }
    if (!method?.id) {
      return "We couldn't identify the payment account. Please refresh and try again.";
    }
    if (exactAmountMinorUnits == null) {
      return "We couldn't determine the order total. Please refresh and try again.";
    }
    const referenceError = validateProofReference(reference);
    if (referenceError) {
      return referenceError;
    }
    if (proofError) {
      return proofError;
    }
    if (!proof) {
      return "Please attach a payment proof image.";
    }
    const fileError = validateProofFile(proof.file);
    if (fileError) {
      return fileError;
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const formData = new FormData();
    formData.append("paymentMethodId", method.id);
    formData.append("submittedAmountMinorUnits", String(exactAmountMinorUnits));
    formData.append("transactionReference", reference.trim());
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }
    formData.append("proof", proof.file);

    setPhase("uploading");
    setProgress(0);
    try {
      const result = await submitPaymentWithProgress(
        orderId,
        formData,
        idempotencyKey,
        setProgress
      );
      if (result.ok) {
        const submitted = result.payload?.data?.payment ?? null;
        if (!submitted) {
          setError(
            "Your proof was submitted, but we couldn't load its status. Please check again shortly."
          );
          setPhase("error");
          return;
        }
        setPayment(submitted);
        setRecovered(false);
        setPhase("success");
        return;
      }
      if (result.status === 409) {
        // Already submitted/verified (e.g. a prior attempt or a lost response).
        // Recover by reading the existing payment so the customer sees its
        // current status instead of a dead-end error.
        const statusRes = await getMyPayment(orderId);
        if (statusRes.ok && statusRes.payload?.data?.payment) {
          setPayment(statusRes.payload.data.payment);
          setRecovered(true);
          setPhase("success");
          return;
        }
      }
      setError(safeMessage(result.status, result.payload));
      setPhase("error");
    } catch (err) {
      setError(
        err?.message ||
          "Your proof could not be submitted. Please check your connection and try again."
      );
      setPhase("error");
    }
  }

  if (phase === "success" && payment) {
    return <PaymentStatusCard payment={payment} recovered={recovered} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-3xl border border-gold-soft/50 bg-white/80 p-6 shadow-sm shadow-ink/5 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft/50 text-mocha-deep">
          <FileImage className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl text-ink">Complete your payment</h2>
          <p className="text-xs text-muted">
            Order {order?.orderNumber} · {method?.displayName}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <AccountDetails method={method} />
      </div>

      <form onSubmit={handleSubmit} className="mt-5" noValidate>
        <div className="rounded-2xl border border-gold-soft/60 bg-gold-soft/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-mocha-deep">Amount to pay</p>
            <p className="font-display text-xl font-semibold tabular-nums text-ink">
              {formatMinorUnits(exactAmountMinorUnits)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted">
            The backend accepts exactly this amount — partial payments are not
            supported, so the field is fixed to your order total.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="submitReference" className="block text-sm font-medium text-ink">
              Transaction reference
            </label>
            <input
              id="submitReference"
              type="text"
              maxLength={100}
              placeholder="e.g. TrxID 12A4B5C6D7"
              required
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              disabled={phase === "uploading"}
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="submitAmount" className="block text-sm font-medium text-ink">
              Amount (read-only)
            </label>
            <p
              id="submitAmount"
              className="mt-1.5 rounded-xl border border-sand bg-sand/30 px-4 py-2.5 font-semibold tabular-nums text-ink"
            >
              {formatMinorUnits(exactAmountMinorUnits)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="submitNotes" className="block text-sm font-medium text-ink">
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="submitNotes"
            rows={2}
            maxLength={1000}
            placeholder="Anything about your transfer?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={phase === "uploading"}
            className={INPUT_CLASSES}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-ink">Payment proof</label>
          <ProofUploadControl
            id="submitProof"
            proof={proof}
            onSelect={selectProof}
            onRemove={removeProof}
            error={proofError}
            disabled={phase === "uploading"}
          />
        </div>

        {phase === "uploading" ? (
          <div className="mt-5 rounded-xl border border-sand bg-sand/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-mocha-deep">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading your proof…
              <span className="ml-auto tabular-nums text-muted">{progress}%</span>
            </div>
            <ProgressBar progress={progress} />
          </div>
        ) : null}

        {phase === "error" && error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-medium text-[#b3412f]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={phase === "uploading"}
          className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "uploading" ? "Submitting…" : "Submit payment proof"}
        </button>

        <p className="mt-3 text-center text-xs text-muted">
          {isSignedIn
            ? "You can also review this from your order page later."
            : "Keep your order number handy to check this again anytime."}
        </p>
      </form>
    </motion.div>
  );
}

function validateProofReference(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length === 0) {
    return "Please enter the transaction reference from your transfer.";
  }
  if (trimmed.length > 100) {
    return "The transaction reference must be 100 characters or fewer.";
  }
  return null;
}
