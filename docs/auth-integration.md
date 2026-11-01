# Frontend Authentication Integration (Better Auth)

Local-development authentication for the Asia Electronics frontend using
[Better Auth](https://better-auth.com) `1.6.26`. The production integration is
also wired end to end (see "Production contract" below); this document focuses
on the explicit, documented local configuration.

## What is wired up

- Email + password sign-up and sign-in.
- Session cookie (`better-auth.session_token`, `HttpOnly`).
- Server-side session enforcement on `/dashboard` (redirects to `/login`).
- JWT plugin: the frontend acts as a local identity provider. It mints
  RS256-signed JWTs and exposes its public keys at a JWKS endpoint so the
  Asia Electronics backend can verify tokens signed by this frontend.
- Backend integration: the `/dashboard` server component acquires the JWT for
  the current session, calls `GET /api/v1/me` on the backend with
  `Authorization: Bearer <JWT>`, and renders the application user (role,
  status). The backend verifies the JWT against this app's JWKS and
  auto-provisions a CUSTOMER user the first time a verified identity is seen.
- **Persistence:** Better Auth data (users, sessions, accounts, verification,
  and the JWT key set) is stored in MongoDB using the native MongoDB driver.
  Authentication state survives frontend process restarts.

## Packages

- `better-auth@1.6.26` (bundles `@better-auth/mongo-adapter@1.6.26`)
- `mongodb@^7` (native MongoDB driver, direct dependency — used by Better Auth)
- `jose` (transitive dependency, used for signing/verifying)

## Configuration files

| File | Purpose |
| --- | --- |
| `src/lib/auth.js` | Server-side Better Auth instance (config, JWT plugin, MongoDB adapter) |
| `src/lib/mongodb.js` | Shared MongoDB client/database handle for Better Auth (globalThis-cached) |
| `src/lib/auth-client.js` | Browser-side auth client used by client components |
| `src/lib/backend-auth.js` | Acquires the Better Auth JWT for the current session (`auth.api.getToken`) |
| `src/lib/api-client.js` | Minimal HTTP client for the Asia Electronics backend (`Authorization: Bearer <JWT>`) |
| `src/app/api/auth/[...all]/route.js` | Next.js App Router handler exposing all Better Auth endpoints |
| `src/config/env.js` | `env.api.baseUrl` / `env.auth.baseUrl` / `env.auth.basePath` |

## Environment variables

See `.env.example`. Required for local development:

| Variable | Default | Notes |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | — | Required. Signs session tokens and encrypts the JWT private key at rest. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public base URL of this app. |
| `BETTER_AUTH_BASE_PATH` | `/api/auth` | Mount path of the Better Auth API. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | — | Comma-separated extra browser origins trusted for cookies / CSRF. The `baseUrl` origin is always trusted automatically. Production: `https://www.asiaelectronicsonline.com,https://asiaelectronicsonline.com`. |
| `BETTER_AUTH_JWT_ALGORITHM` | `RS256` | Asymmetric algorithm for the JWT plugin key pair. |
| `BETTER_AUTH_JWT_EXPIRATION_TIME` | `15m` | JWT lifetime. |
| `MONGODB_URI` | — | Required. Connection string for the database that persists Better Auth data. The database name comes from the URI (e.g. `asiaelectronics`). Server-side only; never committed. |

`BETTER_AUTH_SECRET` and `MONGODB_URI` are read from the environment in the
server modules; the rest flow through `src/config/env.js` (or the auth module
directly).

## Endpoints

All under the auth base path (`http://localhost:3000/api/auth`):

| Method | Path | Description |
| --- | --- | --- |
| POST | `/sign-up/email` | Create account (name, email, password) |
| POST | `/sign-in/email` | Sign in |
| POST | `/sign-out` | Sign out |
| GET | `/get-session` | Current session (or `null`) |
| GET | `/token` | Mint a JWT for the current session |
| GET | `/jwks` | Public JWK set (public keys only) |

## JWT contract (local development)

- Algorithm: `RS256` (RSA). The backend algorithm allowlist is also `RS256`
  (`BETTER_AUTH_ALGORITHMS`); tokens signed any other way are rejected.
- Exposed keys: `GET /api/auth/jwks` returns the public keys only. The private
  key never leaves the server; it is stored encrypted at rest (using
  `BETTER_AUTH_SECRET`) in the Better Auth `jwks` MongoDB collection.
- The RSA key set is persisted, so the `kid` stays stable across frontend
  restarts.
- Claims included (default Better Auth JWT payload): `sub` (user id),
  `name`, `email`, `iss`, `aud`, `iat`, `exp`. `iss` and `aud` default to the
  frontend base URL (`http://localhost:3000`).
- `sub` is the Better Auth user id. The backend links it to the application
  User record via `authProviderId`.
- The minted JWT carries **no role claim**. Even if one were present, the
  backend deliberately ignores it (see "Backend integration" below).

Backend configuration used by the local integration:

```dotenv
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER=http://localhost:3000
BETTER_AUTH_AUDIENCE=http://localhost:3000
BETTER_AUTH_ALGORITHMS=RS256
```

## Backend integration (local development)

The real, verified integration contract for this phase:

| | Value |
| --- | --- |
| Frontend (this app) | `http://localhost:3000` |
| Better Auth base path | `http://localhost:3000/api/auth` |
| JWT minting endpoint | `GET http://localhost:3000/api/auth/token` (session cookie required) |
| JWKS | `GET http://localhost:3000/api/auth/jwks` |
| Issuer / Audience | `http://localhost:3000` |
| Algorithm | `RS256` |
| Backend base URL | `http://localhost:4000/api/v1` |
| Authenticated endpoint (current) | `GET /me` |
| Auth transport | `Authorization: Bearer <JWT>` |

### Flow

```
Better Auth (frontend, owns authentication/sessions)
    ↓  session cookie
/api/auth/token  (frontend mints the JWT)
    ↓  RS256 JWT
Authorization: Bearer <JWT>
    ↓
Asia Electronics backend  (Express, owns application users + roles)
    ↓  JWKS verification (issuer/audience/algorithm/expiry)
sub  →  authProviderId
    ↓
MongoDB User record
    ↓
role / status read from the database (CUSTOMER, ACTIVE)
```

### Ownership and security model

- **Better Auth owns authentication and session management.** It also signs
  the JWT; the frontend never signs JWTs itself, never reads
  `BETTER_AUTH_SECRET` in the browser, and only forwards the server-minted
  token to the backend.
- **The frontend obtains the JWT** server-side via `auth.api.getToken` and
  sends it as `Authorization: Bearer <JWT>` (see `src/lib/backend-auth.js`
  and `src/lib/api-client.js`). Tokens are never logged or persisted
  (no `localStorage`/`sessionStorage`).
- **The backend verifies the JWT** against this app's JWKS (`src/integrations/
  auth/jwtVerifier.js`): RS256 allowlist, `kid`/key matching, issuer/audience,
  and expiry. Any invalid/tampered token is rejected with `401`.
- **The backend owns application users and roles.** The application User lives
  in MongoDB and is linked by `authProviderId` (the JWT `sub`). The `role` and
  `status` that drive authorization come **from the database, never from JWT
  claims** (`src/integrations/auth/identity.js` deliberately drops any role
  claim; `resolveCurrentUser` reads `req.user.role` from the resolved User).
- **New authenticated customers are auto-provisioned.** On a valid
  authenticated request with no matching User, the backend creates a
  `CUSTOMER` / `ACTIVE` account (`AUTO_PROVISION_CUSTOMERS`, default on).
  ADMIN/STAFF are never auto-created from JWT claims.
- The current environment is **LOCAL DEVELOPMENT** only. Production URLs and
  credentials are **not** established yet.

## Persistence (MongoDB)

Better Auth persists authentication data in MongoDB via the native driver
(`mongodb`), using the adapter bundled with `better-auth`
(`better-auth/adapters/mongodb`). Connection details:

- **URI:** `MONGODB_URI` (required; server-side only, gitignored). The database
  name comes from the URI (local development uses the `asiaelectronics` database).
- **Client:** `src/lib/mongodb.js` exports `getBetterAuthMongoClient()` and
  `getBetterAuthDb()`. The client is cached on `globalThis` because the Next.js
  dev server compiles route handlers and server components into separate module
  graphs; the cached handle keeps sessions created by the API visible to pages
  (and vice versa) and prevents opening extra connection pools.
- **Collections** (singular names, no collision with the backend's `users`):
  - `user` — Better Auth users (`_id` is the JWT `sub`).
  - `session` — sessions (session cookie id + `expiresAt`).
  - `account` — credentials (email + password hash) and social accounts.
  - `verification` — email verification data.
  - `jwks` — the JWT plugin's RSA key set (private key encrypted at rest with
    `BETTER_AUTH_SECRET`).
- **Stability:** authentication state survives frontend process restarts; the
  RSA `kid` stays stable, so previously minted tokens remain verifiable.

Ownership remains split exactly as before: Better Auth owns authentication and
sessions; the backend owns application users and roles (linked via
`authProviderId` → JWT `sub`).

## Verification

Run `npm run dev`, then in a browser:

1. Register at `http://localhost:3000/register`.
2. You are redirected to `/dashboard`, which shows your name/email and the
   backend account fetched from `GET /api/v1/me` (role `CUSTOMER`, status
   `ACTIVE` on first visit).
3. Click **Sign out** — you are returned to the home page and `/dashboard`
   redirects to `/login` again.

Direct API checks (JSON bodies must be passed via a file with
`curl --data @file.json`, because `curl.exe` on Windows strips quotes from
`-d`):

```powershell
curl.exe -s http://localhost:3000/api/auth/jwks
curl.exe -s -c c.txt http://localhost:3000/api/auth/get-session   # null
curl.exe -s -c c.txt -b c.txt http://localhost:3000/api/auth/token
```

## Security notes

- The JWT private key is encrypted at rest with `BETTER_AUTH_SECRET`; it is
  never exposed by `/api/auth/jwks`.
- Sign-in errors do not reveal whether an email exists
  (`INVALID_EMAIL_OR_PASSWORD`).
- Sign-out (a state-changing POST) is protected by a CSRF origin check; a
  request without an `Origin` header is rejected (`403`).
- `BETTER_AUTH_SECRET` is never committed. `.env.example` ships a placeholder;
  real values live in gitignored `.env.local`.
- Tokens, cookies, and secrets are never logged by the frontend or the
  backend integration code; error responses are pre-mapped to safe,
  user-facing messages (no raw backend bodies, no stack traces, no JWTs).

## Production contract

The production integration is established and verified (canonical origin is the
www site):

| | Production value |
| --- | --- |
| Frontend (this app) | `https://www.asiaelectronicsonline.com` (apex `https://asiaelectronicsonline.com` 308-redirects to it) |
| Better Auth base path | `https://www.asiaelectronicsonline.com/api/auth` |
| JWT minting endpoint | `GET https://www.asiaelectronicsonline.com/api/auth/token` (session cookie required) |
| JWKS | `GET https://www.asiaelectronicsonline.com/api/auth/jwks` |
| Issuer / Audience | `https://www.asiaelectronicsonline.com` |
| Algorithm | `RS256` |
| Backend base URL | `https://asia-electronics-backend.vercel.app/api/v1` |
| Backend issuer/audience/JWKS env | `BETTER_AUTH_ISSUER`, `BETTER_AUTH_AUDIENCE`, `BETTER_AUTH_JWKS_URL` = `https://www.asiaelectronicsonline.com` (`.../api/auth/jwks`) |
| Authenticated endpoint (current) | `GET /me` |
| Auth transport | `Authorization: Bearer <JWT>` |

Frontend production env vars (Vercel):

```dotenv
BETTER_AUTH_URL=https://www.asiaelectronicsonline.com
BETTER_AUTH_BASE_PATH=/api/auth
BETTER_AUTH_TRUSTED_ORIGINS=https://www.asiaelectronicsonline.com,https://asiaelectronicsonline.com
BETTER_AUTH_JWT_ALGORITHM=RS256
BETTER_AUTH_JWT_EXPIRATION_TIME=15m
NEXT_PUBLIC_API_URL=https://asia-electronics-backend.vercel.app/api/v1
```

Backend production env vars (Vercel):

```dotenv
BETTER_AUTH_JWKS_URL=https://www.asiaelectronicsonline.com/api/auth/jwks
BETTER_AUTH_ISSUER=https://www.asiaelectronicsonline.com
BETTER_AUTH_AUDIENCE=https://www.asiaelectronicsonline.com
BETTER_AUTH_ALGORITHMS=RS256
CORS_ORIGINS=https://www.asiaelectronicsonline.com,https://asiaelectronicsonline.com
STORE_URL=https://www.asiaelectronicsonline.com
ADMIN_DASHBOARD_BASE_URL=https://www.asiaelectronicsonline.com/admin/dashboard
ADMIN_EMAIL=<admin-recipient-email>
```
