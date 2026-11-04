"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { checkoutOrder } from "@/lib/api/orders";
import { getPaymentMethods } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import { useCart } from "../_components/cart-context";
import { EmptyState } from "../_components/empty-state";
import { formatMinorUnits, formatDate } from "@/lib/utils";
import {
  DISTRICTS,
  getDefaultPostOffice,
  getPostOffices,
  isValidPostalCode,
  postOfficeKey,
} from "@/lib/bangladesh-postal-codes";
import {
  MANUAL_ORDER_ENUMS,
  ManualPaymentSection,
  PaymentSubmissionPanel,
  validateProofFile,
} from "./manual-payment";

const EASE = [0.22, 1, 0.36, 1];

// 16px on phones (text-base) prevents iOS Safari from zooming the whole page
// when a field is focused; it drops back to 14px from the `sm` breakpoint up.
const INPUT_CLASSES =
  "mt-1.5 w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted focus:border-mocha/40 focus:outline-none focus:ring-2 focus:ring-gold/40 sm:px-4 sm:text-sm";

// Mirrors the backend order.limits (ORDER_LIMITS) so the form never sends a
// value the server would reject; the backend stays authoritative.
const FIELD_LIMITS = {
  fullName: 150,
  phone: 30,
  line: 300,
  city: 100,
  area: 100,
  district: 100,
  postalCode: 20,
  email: 254,
  notes: 1000,
};

// Mirrors backend order.constants.js (DELIVERY_ZONES + DELIVERY_FEES_MINOR_UNITS).
// The customer picks the zone their address is in; the backend charges the
// matching fee (minor units) server-side, never from the client.
const DELIVERY_ZONE_OPTIONS = [
  { value: "INSIDE_CHITTAGONG", label: "Inside Chittagong", feeMinorUnits: 8000 },
  { value: "OUTSIDE_CHITTAGONG", label: "Outside Chittagong", feeMinorUnits: 15000 },
];

// Kept outside the component so the React Compiler's purity rule never sees an
// impure call (Date.now / Math.random) during render analysis.
function createIdempotencyKey() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Field({
  id,
  label,
  className = "",
  hint,
  hintClassName = "text-muted",
  ...props
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} {...props} className={INPUT_CLASSES} />
      {hint ? (
        <p className={`mt-1.5 text-xs ${hintClassName}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function SelectField({ id, label, className = "", children, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select id={id} {...props} className={INPUT_CLASSES}>
        {children}
      </select>
    </div>
  );
}

// Post offices arrive sorted by thana, so consecutive entries can be grouped
// into <optgroup>s without another lookup table.
function groupByThana(offices) {
  const groups = [];
  for (const office of offices) {
    const last = groups[groups.length - 1];
    if (last && last.thana === office.thana) {
      last.offices.push(office);
    } else {
      groups.push({ thana: office.thana, offices: [office] });
    }
  }
  return groups;
}

function Section({ title, children }) {
  return (
    <section className="rounded-3xl border border-gold-soft/50 bg-white/80 p-4 shadow-sm shadow-ink/5 sm:p-6">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <div className="h-8 w-48 rounded bg-sand" />
      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:mt-10 lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="space-y-6">
          <div className="h-72 animate-pulse rounded-2xl bg-sand/70" />
          <div className="h-48 animate-pulse rounded-2xl bg-sand/70" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-sand/70" />
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-cream">
      {status}
    </span>
  );
}

/**
 * Order confirmation — rendered entirely from the checkout response so no
 * account (and no authenticated order read) is required. Guests and signed-in
 * customers both land here when the order needs a manual payment proof; the
 * order number plus the delivery phone are enough to look the order up via the
 * backend's public `GET /orders/status` endpoint later.
 */
function OrderConfirmation({
  order,
  manualMethod,
  initialPaymentForm,
  initialProof,
  isSignedIn = false,
}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const totals = order.totals || {};
  const needsManualPayment =
    order.paymentMethod && MANUAL_ORDER_ENUMS.includes(order.paymentMethod);
  const effectiveMethod = needsManualPayment && manualMethod ? manualMethod : null;

  return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.45, ease: EASE }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft/50 text-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path d="m4.5 12.5 5 5 10-11" />
              </svg>
            </motion.span>
            <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
              Order placed
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Thank you
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Your order has been received and our team will confirm the
              delivery details shortly.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {order.orderNumber ? (
                <span className="rounded-full border border-gold-soft/70 bg-white px-5 py-2 text-sm text-ink">
                  Order no.{" "}
                  <span className="font-semibold">{order.orderNumber}</span>
                </span>
              ) : null}
              <StatusPill status={order.status} />
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-gold-soft/50 bg-white/80 p-5 shadow-sm shadow-ink/5 sm:p-8">
            <h2 className="font-display text-xl text-ink">Order summary</h2>
            <ul className="mt-4 divide-y divide-sand">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted">
                      Qty {item.quantity}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatMinorUnits(item.lineTotalMinorUnits ?? 0)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-sand pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Items subtotal</dt>
                <dd className="font-medium text-ink">
                  {formatMinorUnits(totals.itemsSubtotalMinorUnits ?? 0)}
                </dd>
              </div>
              {Number(totals.totalDiscountMinorUnits) > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="font-medium text-muted">
                    −{formatMinorUnits(totals.totalDiscountMinorUnits)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-medium text-ink">
                  {Number(totals.deliveryFeeMinorUnits) > 0
                    ? formatMinorUnits(totals.deliveryFeeMinorUnits)
                    : "Free"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-sand pt-3">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-semibold text-ink">
                  {formatMinorUnits(totals.grandTotalMinorUnits ?? 0)}
                </dd>
              </div>
            </dl>
          </div>

          {effectiveMethod ? (
            <div className="mt-6">
              <PaymentSubmissionPanel
                order={order}
                method={effectiveMethod}
                initialReference={initialPaymentForm?.reference ?? ""}
                initialNotes={initialPaymentForm?.notes ?? ""}
                initialProof={initialProof}
                isSignedIn={isSignedIn}
              />
            </div>
          ) : null}

          <div className="mt-6 rounded-3xl border border-sand bg-white/60 p-4 text-sm leading-relaxed text-muted sm:p-6">
            Keep your <span className="font-medium text-mocha-deep">order number</span> and{" "}
            <span className="font-medium text-mocha-deep">delivery phone</span> handy — you can
            look up your order status anytime.
            {order.createdAt ? (
              <p className="mt-2 text-xs text-muted">
                Placed on {formatDate(order.createdAt)}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/collection"
              className="rounded-full bg-ink px-8 py-3.5 text-center text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              Continue shopping
            </Link>
            <Link
              href="/"
              className="rounded-full border border-mocha/30 px-8 py-3.5 text-center text-sm font-medium text-mocha transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
  );
}

/**
 * Checkout — works for guests and signed-in customers alike.
 *
 * Guests check out as their guest identity: their local bag is synced into the
 * backend guest cart (X-Guest-Id) first, then `POST /orders/checkout` places
 * the order exactly as the backend contract expects. The confirmation is
 * rendered inline from the checkout response, so no account is required.
 *
 * Signed-in customers keep their existing flow for instant orders (their
 * backend cart is already live, and after the order they land on their account
 * order page). Orders that still need a manual payment proof land on the same
 * inline confirmation — for guests and signed-in customers alike — so the
 * receipt can be submitted right away.
 *
 * The `Idempotency-Key` header is sent per attempt so retries can never create
 * duplicate orders.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);
  const { items, ready, subtotalMinorUnits, forgetLocalCart, refresh, syncGuestCartForCheckout, restoreStashedCart } =
    useCart();

  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [methodsState, setMethodsState] = useState("loading");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [selectedManualId, setSelectedManualId] = useState(null);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [paymentForm, setPaymentForm] = useState({ reference: "", notes: "" });
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    area: "",
    district: "",
    postOffice: "",
    postalCode: "",
    email: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPaymentMethods().then((res) => {
      if (cancelled) {
        return;
      }
      if (res.ok && Array.isArray(res.payload?.data?.paymentMethods)) {
        setPaymentMethods(res.payload.data.paymentMethods);
        setMethodsState("ready");
      } else {
        setMethodsState("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The backend checkout accepts the order-level payment-method enum, one of
  // `COD` or a manual enum (`BKASH`, `BANK_TRANSFER`, `MANUAL`). Only manual
  // payment methods whose `code` is a real manual enum are offered — a method
  // with any other code could never be sent to `/orders/checkout`. If none are
  // available (empty list, or the request failed) the order falls back to COD.
  const manualMethods = paymentMethods.filter(
    (method) => method.type === "MANUAL" && MANUAL_ORDER_ENUMS.includes(method.code)
  );
  const hasManualMethods = manualMethods.length > 0;
  const selectedManual = manualMethods.find((method) => method.id === selectedManualId) ?? null;
  const effectivePaymentMethod =
    paymentMethod !== "COD" && selectedManual ? selectedManual.code : "COD";

  // The delivery charge is the customer-selected zone's fee (0 until a zone is
  // chosen); the backend re-derives it from the zone at checkout.
  const selectedZone = DELIVERY_ZONE_OPTIONS.find(
    (option) => option.value === deliveryZone
  ) ?? null;
  const deliveryFeeMinorUnits = selectedZone ? selectedZone.feeMinorUnits : 0;
  const estimatedTotalMinorUnits = subtotalMinorUnits + deliveryFeeMinorUnits;

  const districtPostOffices = form.district ? getPostOffices(form.district) : [];
  const districtThanaGroups = groupByThana(districtPostOffices);
  const showPostOfficePicker = districtPostOffices.length > 1;
  const hasValidPostalCode = isValidPostalCode(form.postalCode);
  const postalCodeHint = !form.postalCode.trim()
    ? "Four digits — picking a district fills this in."
    : hasValidPostalCode
      ? "Filled from your district and post office. You can edit it if needed."
      : "Bangladesh postal codes are 4 digits. Please double-check this one.";

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Choosing a district resets the postal code to that district's main post
  // office; the customer can still pick another post office or edit the code.
  function selectDistrict(district) {
    setForm((prev) => {
      const office = district ? getDefaultPostOffice(district) : null;
      return {
        ...prev,
        district,
        postOffice: postOfficeKey(office),
        postalCode: office?.code ?? "",
      };
    });
  }

  function selectPostOffice(key) {
    setForm((prev) => {
      const office = getPostOffices(prev.district).find(
        (item) => postOfficeKey(item) === key
      );
      if (!office) {
        return { ...prev, postOffice: key };
      }
      return {
        ...prev,
        postOffice: key,
        postalCode: office.code,
      };
    });
  }

  function selectManualMethod(method) {
    setPaymentMethod(method.code);
    setSelectedManualId(method.id);
  }

  function selectCod() {
    setPaymentMethod("COD");
    setSelectedManualId(null);
  }

  function updatePaymentForm(field, value) {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  }

  function pickProof(file) {
    const problem = validateProofFile(file);
    setProofError(problem || "");
    setProof((prev) => {
      if (prev?.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      if (problem) {
        return null;
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty — add something before checking out.");
      return;
    }
    if (!deliveryZone) {
      setError("Please choose a delivery zone — inside or outside Chittagong.");
      return;
    }
    const idempotencyKey = createIdempotencyKey();
    const address = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
      city: form.city.trim(),
      area: form.area.trim(),
      district: form.district.trim(),
      postalCode: form.postalCode.trim(),
      country: "BD",
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
    };
    const body = {
      delivery: { address, zone: deliveryZone },
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      paymentMethod: effectivePaymentMethod,
    };
    setIsSubmitting(true);
    try {
      // Guests place their order against their backend cart, so the local bag
      // must be in the guest cart first. The stable X-Guest-Id is sent
      // automatically by the API layer; this sync is exact-match and throws on
      // failure so we never proceed into an empty backend cart.
      if (!isSignedIn) {
        await syncGuestCartForCheckout();
      }
      const res = await checkoutOrder(body, idempotencyKey);
      if (!res.ok) {
        setError(safeMessage(res.status, res.payload));
        return;
      }
      const order = res.payload?.data?.order;
      forgetLocalCart();
      if (isSignedIn) {
        await refresh();
        router.refresh();
      }
      // Bring back the bag that a buy-now swapped out for this order.
      await restoreStashedCart();
      if (isSignedIn && !(order?.paymentMethod && MANUAL_ORDER_ENUMS.includes(order.paymentMethod))) {
        router.push(order?.id ? `/account/orders/${order.id}` : "/account/orders");
      } else {
        setPlacedOrder(order);
      }
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong while placing your order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        manualMethod={selectedManual}
        initialPaymentForm={paymentForm}
        initialProof={proof}
        isSignedIn={isSignedIn}
      />
    );
  }

  if (!ready) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <EmptyState
          title="Your cart is empty"
          description="Add items to your cart before checking out."
          actionHref="/collection"
          actionLabel="Browse the catalog"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <header>
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-electric">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Complete your order
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Tell us where to deliver your items. Your order is confirmed once our
          team has reviewed it.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-6 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 sm:gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Section title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="fullName"
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                maxLength={FIELD_LIMITS.fullName}
                required
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
              />
              <Field
                id="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                maxLength={FIELD_LIMITS.phone}
                required
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
              <Field
                id="line1"
                label="Address line 1"
                type="text"
                placeholder="House, road, village"
                className="sm:col-span-2"
                maxLength={FIELD_LIMITS.line}
                required
                value={form.line1}
                onChange={(event) => updateField("line1", event.target.value)}
              />
              <Field
                id="line2"
                label="Address line 2 (optional)"
                type="text"
                placeholder="Apartment, building, landmark"
                className="sm:col-span-2"
                maxLength={FIELD_LIMITS.line}
                value={form.line2}
                onChange={(event) => updateField("line2", event.target.value)}
              />
              <Field
                id="city"
                label="City"
                type="text"
                placeholder="City"
                maxLength={FIELD_LIMITS.city}
                required
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
              <Field
                id="area"
                label="Area / thana"
                type="text"
                placeholder="Area / thana"
                maxLength={FIELD_LIMITS.area}
                required
                value={form.area}
                onChange={(event) => updateField("area", event.target.value)}
              />
              <SelectField
                id="district"
                label="District"
                required
                value={form.district}
                onChange={(event) => selectDistrict(event.target.value)}
              >
                <option value="">Select district</option>
                {DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </SelectField>
              {showPostOfficePicker ? (
                <SelectField
                  id="postOffice"
                  label="Post office / area"
                  value={form.postOffice}
                  onChange={(event) => selectPostOffice(event.target.value)}
                >
                  <option value="">Select post office</option>
                  {districtThanaGroups.map((group) => (
                    <optgroup key={group.thana} label={group.thana}>
                      {group.offices.map((office) => (
                        <option
                          key={postOfficeKey(office)}
                          value={postOfficeKey(office)}
                        >
                          {office.name} ({office.code})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </SelectField>
              ) : null}
              <Field
                id="postalCode"
                label="Postal code"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="Postal code"
                maxLength={FIELD_LIMITS.postalCode}
                required
                hint={postalCodeHint}
                hintClassName={
                  hasValidPostalCode || !form.postalCode.trim()
                    ? "text-muted"
                    : "text-[#b3412f]"
                }
                value={form.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
              />
              {!isSignedIn ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="sm:col-span-2"
                >
                  <Field
                    id="email"
                    label="Email address (optional)"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={FIELD_LIMITS.email}
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    We&apos;ll send your order confirmation to this address.
                  </p>
                </motion.div>
              ) : null}
            </div>
          </Section>

          <Section title="Delivery">
            <div className="space-y-3">
              {DELIVERY_ZONE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand p-4 transition-colors has-[:checked]:border-mocha has-[:checked]:bg-sand/40"
                >
                  <input
                    type="radio"
                    name="deliveryZone"
                    value={option.value}
                    checked={deliveryZone === option.value}
                    onChange={() => setDeliveryZone(option.value)}
                    className="mt-1 accent-mocha"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatMinorUnits(option.feeMinorUnits)} delivery charge
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Choose the zone your delivery address is in — the charge is added
              to your order total.
            </p>
          </Section>

          <Section title="Payment">
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand p-4 transition-colors has-[:checked]:border-mocha has-[:checked]:bg-sand/40">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={effectivePaymentMethod === "COD"}
                  onChange={selectCod}
                  className="mt-1 accent-mocha"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    Cash on delivery
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Pay in cash when your order arrives.
                  </span>
                </span>
              </label>

              {manualMethods.map((method, index) => (
                <motion.label
                  key={method.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: 0.04 * index }}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand p-4 transition-colors has-[:checked]:border-mocha has-[:checked]:bg-sand/40"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.code}
                    checked={effectivePaymentMethod === method.code}
                    onChange={() => selectManualMethod(method)}
                    className="mt-1 accent-mocha"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {method.displayName}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {method.code === "BKASH"
                        ? "Transfer via bKash and submit your receipt after placing your order."
                        : method.code === "BANK_TRANSFER"
                          ? "Transfer to the account below and submit your receipt after placing your order."
                          : "Complete a manual transfer and submit your receipt after placing your order."}{" "}
                      Our team verifies it before dispatch.
                    </span>
                  </span>
                </motion.label>
              ))}
            </div>

            {methodsState === "loading" ? (
              <p className="mt-4 text-xs text-muted">
                Checking available payment options…
              </p>
            ) : null}

            {methodsState === "error" ? (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                We couldn&apos;t load the manual payment options right now —
                cash on delivery is still available.
              </p>
            ) : null}

            {methodsState === "ready" && !hasManualMethods ? (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Bank transfer is not available right now — cash on delivery is
                currently the only option.
              </p>
            ) : null}

            {selectedManual && effectivePaymentMethod !== "COD" ? (
              <ManualPaymentSection
                method={selectedManual}
                amountMinorUnits={estimatedTotalMinorUnits}
                reference={paymentForm.reference}
                notes={paymentForm.notes}
                onReference={(value) => updatePaymentForm("reference", value)}
                onNotes={(value) => updatePaymentForm("notes", value)}
                proof={proof}
                onProofSelect={pickProof}
                onProofRemove={removeProof}
                proofError={proofError}
                disabled={isSubmitting}
              />
            ) : null}
          </Section>

          <Section title="Order notes (optional)">
            <textarea
              id="notes"
              rows={3}
              maxLength={FIELD_LIMITS.notes}
              placeholder="Anything we should know about your order?"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className={INPUT_CLASSES}
            />
          </Section>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-medium text-[#b3412f]"
            >
              {error}
            </p>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-3xl border border-gold-soft/50 bg-white/80 p-4 shadow-sm shadow-ink/5 sm:p-6">
            <h2 className="font-display text-lg text-ink">Your order</h2>
            <ul className="mt-4 divide-y divide-sand">
              {items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </p>
                    {item.attributesLabel ? (
                      <p className="truncate text-xs text-muted">{item.attributesLabel}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatMinorUnits((item.unitPriceMinorUnits ?? 0) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 border-t border-sand pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-ink">
                  {formatMinorUnits(subtotalMinorUnits)}
                </dd>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <dt className="text-muted">Delivery charge</dt>
                <dd className="font-semibold text-ink">
                  {selectedZone ? formatMinorUnits(deliveryFeeMinorUnits) : "—"}
                </dd>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-sand pt-3">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-semibold text-ink">
                  {formatMinorUnits(estimatedTotalMinorUnits)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              The delivery charge matches the zone you select. Your order&apos;s
              final total is confirmed when your order is placed.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Placing order…" : "Place order"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              By placing this order you agree to be contacted about delivery.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
