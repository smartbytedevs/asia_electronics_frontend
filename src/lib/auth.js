import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env } from "@/config/env";
import { getBetterAuthDb, getBetterAuthMongoClient } from "@/lib/mongodb";

// Better Auth can only be imported from the server, so BETTER_AUTH_* (non
// NEXT_PUBLIC) variables are safe to read here.
const jwtAlgorithm = process.env.BETTER_AUTH_JWT_ALGORITHM ?? "RS256";
const jwtExpirationTime = process.env.BETTER_AUTH_JWT_EXPIRATION_TIME ?? "15m";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: env.auth.baseUrl,
  basePath: env.auth.basePath,
  // The canonical origin (derived from baseURL) is always trusted. Extra
  // origins come from BETTER_AUTH_TRUSTED_ORIGINS (e.g. the apex
  // https://taqwactg.com that 308-redirects to the www canonical origin).
  trustedOrigins: [...new Set([env.auth.baseUrl, ...env.auth.trustedOrigins])],
  // Persistent storage via MongoDB (native driver). Collections are singular
  // (`user`, `session`, `account`, `verification`, `jwks`) so they never
  // collide with the Taqwa backend `users` collection. Users and sessions
  // survive frontend restarts.
  database: mongodbAdapter(getBetterAuthDb(), {
    client: getBetterAuthMongoClient(),
    usePlural: false,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: { alg: jwtAlgorithm, modulusLength: 2048 },
      },
      jwt: {
        issuer: env.auth.baseUrl,
        audience: env.auth.baseUrl,
        expirationTime: jwtExpirationTime,
      },
    }),
  ],
});
