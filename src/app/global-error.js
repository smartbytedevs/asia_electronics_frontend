"use client";

export default function GlobalError({ error, retry }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-900">
        <main className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="max-w-md text-sm text-zinc-600">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
