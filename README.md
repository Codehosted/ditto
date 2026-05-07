# Ditto

Firebase-backed Vite/React prototype for family onboarding, generated next steps, document storage, vendor coordination, invitations, and checkout requests.

## Run Locally

1. Install dependencies:
   `bun install`
2. Create `.env.local` from `.env.example` and set `GEMINI_API_KEY`.
3. Run the app:
   `bun run dev`

## Firebase Setup

The app reads Firebase config from `firebase-applet-config.json`.

Enable these Firebase products for full local use:

- Authentication: Google sign-in and Anonymous sign-in.
- Firestore: deploy `firestore.rules`.
- Storage: deploy `storage.rules`.

Runtime data now lives in Firestore:

- `users/{uid}`
- `families/{familyId}`
- `families/{familyId}/tasks`
- `families/{familyId}/documents`
- `families/{familyId}/vendors`
- `invitations`
- `checkoutRequests`

Uploaded files are stored in Firebase Storage under `families/{familyId}/documents/...`.

## Notes

Gemini powers onboarding guide generation and Clara chat. If `GEMINI_API_KEY` is missing or the model call fails, onboarding falls back to a local default guide so Firebase persistence can still be exercised.
