import { MongoClient } from "mongodb";

/**
 * Server-only MongoDB connection for Better Auth persistence.
 *
 * Better Auth owns its own native MongoDB connection (never the backend's
 * Mongoose connection). The connection string is read from MONGODB_URI in the
 * server environment; the database name is taken from the URI itself (no
 * database name is hard-coded here).
 *
 * The MongoClient is cached on globalThis so the Next.js dev server (which
 * compiles route handlers and server components into separate module graphs)
 * reuses a single client and a single connection pool across hot reloads.
 * The MongoDB driver connects lazily on the first operation and pools
 * connections internally, so no `connect()` promise is kept.
 *
 * This module is imported only by server-side code (`src/lib/auth.js`). The
 * MONGODB_URI value is never logged and never included in client bundles.
 */

const globalForTaqwa = globalThis;

function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) so Better Auth can persist users and sessions."
    );
  }

  if (!globalForTaqwa.__taqwaMongoClient) {
    globalForTaqwa.__taqwaMongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10_000,
    });
  }

  return globalForTaqwa.__taqwaMongoClient;
}

/**
 * Returns the shared MongoClient used by Better Auth.
 * @returns {MongoClient}
 */
export function getBetterAuthMongoClient() {
  return getMongoClient();
}

/**
 * Returns the Better Auth database handle derived from MONGODB_URI.
 * @returns {import("mongodb").Db}
 */
export function getBetterAuthDb() {
  return getMongoClient().db();
}
