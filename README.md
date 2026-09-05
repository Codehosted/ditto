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

The endpoint provides health, bounded document listing, single-document reads, and merge-only document upserts. User profiles and audit logs are read-only. Access is limited to Ditto's known production document roots and the `tasks`, `documents`, and `vendors` family subcollections.
