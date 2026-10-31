"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, Search, SearchX, Tags, X } from "lucide-react";
import { getCategories, updateCategory } from "@/lib/api/categories";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { CategoryTable } from "./category-table";
import { CategoryCard } from "./category-card";
import { CategoryFormDialog } from "./category-form-dialog";

const EASE = [0.22, 1, 0.36, 1];

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin category list. The backend serves ACTIVE categories only — there is no
 * admin list endpoint, so inactive categories disappear here (they are also
 * hidden from the storefront). Deactivation is the only removal mechanism
 * (PATCH { isActive: false }); there is no DELETE and no way to re-read a
 * deactivated category through the API.
 *
 * Name search is client-side: the storefront endpoint returns the whole active
 * category set (no pagination or search), so filtering by name in the browser
 * is accurate without any backend change.
 */
export function AdminCategories() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const deactivatingRef = useRef(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    categories: [],
  });

  const searching = debouncedQuery !== "";

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const visibleCategories = useMemo(() => {
    if (!searching) {
      return fetchState.categories;
    }
    const term = debouncedQuery.toLowerCase();
    return fetchState.categories.filter((category) =>
      category.name.toLowerCase().includes(term)
    );
  }, [searching, debouncedQuery, fetchState.categories]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      categories: prev.categories,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  function handleSaved() {
    setSuccess("Category saved.");
    startLoading();
    setReloadKey((key) => key + 1);
  }

  function handleClearSearch() {
    setQuery("");
    setDebouncedQuery("");
  }

  // A fresh object reference per row ensures re-selecting the same category
  // after closing the dialog reopens it populated.
  function handleEdit(category) {
    setEditing({ ...category });
  }

  function handleDeactivate(category) {
    deactivatingRef.current = category;
    setDeactivating(category);
    setDeactivateError(null);
  }

  async function confirmDeactivate() {
    const category = deactivatingRef.current;
    if (!category) {
      return;
    }
    setDeactivateLoading(true);
    setDeactivateError(null);
    const result = await updateCategory(category.id, { isActive: false });
    setDeactivateLoading(false);
    if (result.ok) {
      setDeactivating(null);
      setSuccess("Category deactivated. It is hidden from the storefront.");
      startLoading();
      setReloadKey((key) => key + 1);
    } else {
      setDeactivateError(safeMessage(result.status, result.payload));
    }
  }

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const id = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(id);
  }, [success]);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          categories: [],
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        categories: Array.isArray(result.payload?.data?.categories)
          ? result.payload.data.categories
          : [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const { status, message, categories } = fetchState;

  return (
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="rounded-2xl border border-gold-soft/70 bg-cream/95 p-4 shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] sm:p-5">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories by name…"
              aria-label="Search categories by name"
              className="h-11 w-full rounded-xl border border-gold-soft/80 bg-white pl-11 pr-11 text-sm text-ink shadow-sm placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-gold-soft/40 hover:text-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={handleRefresh} className={softButtonClass}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
            <CategoryFormDialog onSaved={handleSaved} />
          </div>

          <p className="mt-4 border-t border-gold-soft/40 pt-3 text-sm text-muted">
            The category list is served by the backend&apos;s storefront endpoint, so only
            active categories appear here. Deactivating a category archives it — the
            backend keeps no visible record.
          </p>
        </div>

        {/* Success toast */}
        {success ? (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
          >
            {success}
          </motion.p>
        ) : null}

        {status === "loading" ? <CategoriesSkeleton rows={6} /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Categories unavailable</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
              {message}
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && categories.length === 0 ? (
          <EmptyCategories onSaved={handleSaved} />
        ) : null}

        {status === "ready" && categories.length > 0 && searching && visibleCategories.length === 0 ? (
          <NoSearchResults query={debouncedQuery} onClear={handleClearSearch} />
        ) : null}

        {status === "ready" && categories.length > 0 && visibleCategories.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {searching
                  ? `${visibleCategories.length} match${visibleCategories.length === 1 ? "" : "es"} for “${debouncedQuery}”`
                  : `${categories.length} active categor${categories.length === 1 ? "y" : "ies"}`}
              </p>
              {searching ? (
                <button type="button" onClick={handleClearSearch} className={softButtonClass}>
                  <X aria-hidden="true" className="h-4 w-4" />
                  Clear search
                </button>
              ) : null}
            </div>

            <CategoryTable
              categories={visibleCategories}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              className="hidden md:block"
            />

            <div className="space-y-4 md:hidden">
              <AnimatePresence initial={false}>
                {visibleCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: EASE,
                      delay: Math.min(index * 0.04, 0.3),
                    }}
                  >
                    <CategoryCard
                      category={category}
                      onEdit={handleEdit}
                      onDeactivate={handleDeactivate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}

        {editing ? (
          <CategoryFormDialog
            category={editing}
            onSaved={() => {
              setEditing(null);
              handleSaved();
            }}
          />
        ) : null}

        {deactivating ? (
          <ConfirmDialog
            title="Deactivate category"
            description={`“${deactivating.name}” will be hidden from the storefront and removed from this list. The backend has no DELETE and no way to list or re-read an inactive category, so this cannot be undone through the admin UI — deactivate only if you are sure.`}
            confirmLabel="Deactivate"
            confirmClassName="bg-[#c9604d] text-white hover:bg-[#b3412f] focus-visible:ring-red-300"
            loading={deactivateLoading}
            error={deactivateError}
            onConfirm={confirmDeactivate}
            onClose={() => {
              if (!deactivateLoading) {
                setDeactivating(null);
                setDeactivateError(null);
              }
            }}
          >
            <p className="text-sm leading-relaxed text-mocha-deep">
              This sends {`{ isActive: false }`} to the backend&apos;s PATCH endpoint —
              the record is kept but hidden everywhere.
            </p>
          </ConfirmDialog>
        ) : null}
      </div>
  );
}

/** Skeleton with thumbnail rows that uses the gold shimmer sweep. */
function CategoriesSkeleton({ rows = 6 }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:p-6"
    >
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 skeleton-shimmer rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 skeleton-shimmer rounded-full" />
              <div className="h-3 w-1/4 skeleton-shimmer rounded-full" />
            </div>
            <div className="hidden h-5 w-16 skeleton-shimmer rounded-full sm:block" />
            <div className="hidden h-9 w-24 skeleton-shimmer rounded-lg sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Empty state: the catalog has no categories yet. */
function EmptyCategories({ onSaved }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <Tags aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No categories yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Categories appear in the storefront navigation, so keep names short and
        clear. Use “Add Category” to create the first one.
      </p>
      <div className="mt-5 flex justify-center">
        <CategoryFormDialog onSaved={onSaved} />
      </div>
    </div>
  );
}

/** Search produced categories on the backend but none matched the typed name. */
function NoSearchResults({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No matching categories</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No active categories match “{query}”. Try a different name or clear the
        search.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        Clear search
      </button>
    </div>
  );
}
