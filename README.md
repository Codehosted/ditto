# Ditto

Ditto helps families and funeral homes coordinate after-life care logistics, including onboarding guidance, family tasks, document storage, vendor coordination, invitations, and checkout requests.

## Runtime architecture

- **Firebase Auth** handles Google and guest identity.
- **Firebase Storage** holds uploaded document files.
- **Vercel API routes** verify Firebase ID tokens and persist application records in PostgreSQL.
- Production PostgreSQL runs in Ditto's isolated container on the Codehosted DigitalOcean database host, reached through TLS-only PgBouncer at `postgres.codehosted.com:6432/ditto`.
- On the first sign-in after cutover, owned legacy Firestore profile and family records are copied into PostgreSQL; subsequent application reads and writes use the Vercel API.

## Run locally

1. `bun install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
3. Set `DATABASE_URL` to a PostgreSQL database with `database/schema.sql` applied.
4. Run `bun run dev`.

The custom Bun development server serves the Vite app only. Use `vercel dev` when you need to exercise `/api/data` locally.

## Repair verification

Use Bun 1.4.0 for reproducible local verification without dependency lifecycle scripts:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run test:privacy
bun test --preload ./tests/dom.ts tests/privacy.test.tsx --coverage
bun run test:mcp
bun run lint
```

`bun.lock` is the authoritative lockfile. It was reconciled with `package.json`
using `bun install --lockfile-only --ignore-scripts`, then verified with a frozen
install before removing obsolete `bun.lockb`. The old text lock omitted the
already-declared `jose`, `postgres`, and `@types/bun` root requirements. Bun also
pruned unused Rollup entries; existing application dependency versions were not
intentionally upgraded. The only added direct dependency is exact-pinned
`happy-dom@20.14.5` for DOM interaction tests, using existing React/React DOM APIs.

The focused tests render the actual CookieConsent and PrivacyPolicy components:
Accept/Decline persistence and remounts, denied storage reads/writes, privacy
opening without consent, content/backdrop clicks, both close controls, Escape,
focus entry/containment/restoration, and unmount cleanup. Motion is not mocked;
the DOM preload disables Happy DOM's incomplete Web Animations implementation
so Motion uses its real JavaScript fallback. Run via `test:privacy` (the preload
is intentionally scoped, not applied to backend MCP tests).

Before the focus patch these tests yielded 11 passes and one failure: focus
remained on the triggering control. Only modal keyboard focus behavior was
changed to address that reproduced PR review finding. This is not complete
browser or compliance approval: viewport stacking/AI launcher overlap, real
browser animation/accessibility behavior, contact routing, and privacy/consent
copy/data-handling claims from PR #7 still require separate review. No analytics
or data-collection gating is introduced or claimed by these tests. Linux frozen
installation and verification must also be run before publication.

## Production database rollout

1. Provision the isolated `postgres-ditto` container via `infra-automation/shared-postgres`.
2. Migrate the old `app_snapshots` data with `DITTO_SOURCE_DATABASE_URL=... ./shared-postgres/scripts/migrate-database.sh ditto`.
3. Apply `database/schema.sql` to the Ditto target database.
4. Set Vercel Production `DATABASE_URL` to the generated `DITTO_DATABASE_URL` and set `FIREBASE_PROJECT_ID=gen-lang-client-0065789810`.
5. Deploy, then verify `/api/health` and a signed-in read/write path.

Keep the old Neon database unchanged until the production observation window confirms the cutover.

## Production agent MCP

Ditto exposes a stateless MCP JSON-RPC endpoint at `POST /api/mcp`. It requires a dedicated bearer token and does not accept Firebase user sessions.

Create a token without printing it to the terminal:

```sh
bun run mcp:token --output "$TMPDIR/ditto-agent-token"
```

The command writes the raw token to a new mode-`0600` file and prints only its SHA-256 digest. Set that digest as the Vercel secret `DITTO_MCP_TOKEN_SHA256`. Inject the token file directly into the assigned agent's secret store, then delete the temporary file. Do not put the raw token in Ditto's environment, source control, shell history, or logs.

The endpoint provides metadata-only document listing, byte-bounded single-document reads, and bounded merge-only document upserts that return metadata rather than the merged payload. Oversized document data is omitted from reads and marked with `dataOmitted` and `dataBytes`. User profiles and audit logs are read-only. Access is limited to Ditto's known production document roots and the `tasks`, `documents`, and `vendors` family subcollections.
