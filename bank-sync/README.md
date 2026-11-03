# PocketFlow — authorised read-only bank sync

**Status: BLOCKED ON EXTERNAL AUTHORISATION.** This folder is NOT a live bank connector. No bank is connected and no financial information is being fetched. The existing Render static site does not run a secure server.

## Why the integration is blocked
Under India's Account Aggregator framework, the Financial Information User (FIU) must be an entity regulated by a financial-sector regulator. A TSP's API key does not make an independent personal-use app an eligible FIU. See:
- Ministry of Finance: https://www.financialservices.gov.in/account-aggregator-framework
- Setu onboarding: https://docs.setu.co/data/account-aggregator/licenses-and-go-live/go-live
- Setu AA flow: https://docs.setu-aa.com/fiu-integration/data-flows

## Required next external action
Obtain a contractual arrangement with an eligible FIU/authorised data provider that explicitly permits PocketFlow's consumer PFM use case and data access. Confirm coverage, lawful purposes, retention, costs, sandbox/prod keys, callback verification, revocation and refresh intervals. Setu can be contacted through its official AA channels, but eligibility must be confirmed before any API activation.

## Target implementation
1. On a dedicated authenticated backend, request a provider-hosted **consent link** using provider-issued server-side credentials (not browser JavaScript).
2. Customer reviews exact account/data scope, purpose, date range, frequency and expiry on the authorised provider page.
3. Verify the provider's signed webhook and consent status **server-side**, tied to a user session and one-time state token.
4. Only after valid approval, initiate a provider data session and fetch the permitted account data. Do not collect OTP/UPI PIN/bank password.
5. Verify account identifiers, transaction IDs, currency, dates, balances, consent scope and replay protection. Track sync checkpoint and original source. Avoid double counting transfers.
6. Encrypt at rest, least-privilege auth, audit logs without financial values, rate limits, consent revoke/delete, retention policy, secure backups, monitoring and independent security review.
7. On app, show **linked / last synced / error / revoked / unsupported** only from validated server state, never local toggle or mock data.

## What NOT to do
- Never put API credentials or private signing keys in `index.html`, localStorage, a public GitHub commit or client environment.
- Do not use private Google Pay or PhonePe APIs, SMS scraping or web banking password collection.
- Do not claim every bank is supported, instant updates or bank-grade security until verified.
- Do not deploy a callback endpoint that accepts unsigned events or stores raw bank statements on a free ephemeral filesystem.

## Backend contract once approved
Authenticated endpoints:
- `GET /api/banks`: allowed/unsupported FIP list from approved provider, with last-updated timestamp.
- `POST /api/consents`: begin consent, returning an allowlisted provider-hosted URL.
- `GET /api/connections`: provider-verified status and last sync.
- `POST /api/connections/:id/refresh`: request permitted refresh.
- `DELETE /api/connections/:id`: revoke consent and delete local data as required.
- `GET /api/accounts` and `GET /api/transactions?cursor=...`: authenticated, redacted for minimum display.
- `POST /api/webhooks/provider`: signed callback handler with replay protection (never trust caller-provided 'approved' state).

## Readiness and acceptance tests
- No balance appears without a real approved consent and source timestamp.
- Expired/revoked consent cannot fetch; reconnect flow cannot reuse a previous state token.
- Forged, unsigned and replayed webhooks fail.
- Idempotent ingestion: repeated FI fetch does not duplicate expenses.
- One own-account transfer offsets without counting twice as income/spending.
- Every bank connection has valid status, error details, disconnect and deletion path.
- iPhone UI clears stale bank status safely; no secrets in browser or GitHub.

Important: sandbox credentials can validate API shape, but mock FIP responses are not genuine user balances.

## Non-negotiable budget: ₹0
Never enable any provider with per-call, minimum monthly, onboarding, pilot, or recurring charges. A free demo/sandbox does **not** establish free production access. Before integration, obtain written provider confirmation that PocketFlow's own consumer PFM use is lawful and the entire pilot/production usage relevant to the user is free, including fees for the authorised FIU/partner. Never start a trial that converts to paid or requires a card without approval. Until these prerequisites are met, report `not connected`, never sample data as real.

As of 2026-11-03, the Setu eligibility/pricing inquiry was sent, and no provider reply or entitlement is confirmed. The static site cannot call this adapter; it must remain fail-closed.
