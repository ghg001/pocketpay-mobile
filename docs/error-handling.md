# Global Error Handling

This document describes how PocketPay Mobile catches unexpected failures, shows a safe fallback UI, recovers without exposing secrets, and feeds non-sensitive context into Diagnostics.

---

## Goals

1. **Never leave the user on a broken screen** after a render-time crash.
2. **Offer recovery actions** (retry, go home, restart, share diagnostics).
3. **Hide sensitive material** (secret keys, public keys, mnemonics) from production UI and from logs/exports.
4. **Keep developer logs useful** via a single redacted reporting funnel.
5. **Integrate with Diagnostics** so support can inspect the last failure without seeing wallet secrets.

---

## Architecture

```
App startup (app/_layout.tsx)
  └─ installGlobalErrorHandlers()     // JS exceptions + unhandled rejections
  └─ <ErrorBoundary>                  // Render / lifecycle failures
       └─ <RootContent /> … screens
```

| Layer | File(s) | Catches | User-visible effect |
|-------|---------|---------|---------------------|
| React Error Boundary | `src/components/ErrorBoundary.tsx`, `ErrorBoundaryFallback.tsx` | Render, lifecycle, constructors below the boundary | Full-screen fallback with recovery CTAs |
| Global JS handler | `src/utils/globalErrorHandler.ts` | Fatal / non-fatal JS exceptions via `ErrorUtils` | Reports then defers to RN default (RedBox / crash) |
| Promise rejections | same | Unhandled promise rejections | Reports only (does not swallow) |
| Reporting funnel | `src/utils/errorReporting.ts` | All of the above | Redacted `console.error` + in-memory last report |
| Redaction | `src/utils/redactSensitive.ts` | Strings / objects before log or export | Secrets → `[REDACTED_*]` tokens |
| Diagnostics | `src/utils/diagnostics.ts`, `app/diagnostics.tsx` | N/A (read-only) | Redacted JSON + last reported failure |

React error boundaries **do not** catch event-handler or async errors. That is why `installGlobalErrorHandlers()` must run as early as possible in `_layout.tsx` (before the root tree can throw).

---

## Fallback UI & Recovery Actions

`ErrorBoundaryFallback` is the default UI when the root boundary catches an error. Production users see a calm message and **no** stack traces. Development builds can expand redacted debug details.

| Action | Behavior |
|--------|----------|
| **Try Again** | Clears boundary state and re-renders children |
| **Go to Home** | Clears boundary state, then `router.replace('/(tabs)')` |
| **Restart App** | Clears boundary state, then best-effort `DevSettings.reload()` |
| **Share Diagnostics** | Opens the OS share sheet with `getDiagnostics()` JSON (already redacted) |

Custom fallbacks remain supported via the `fallback` prop on `ErrorBoundary` (node or render function).

---

## Sensitive Data Boundaries

| Surface | Production | Development |
|---------|------------|-------------|
| Fallback copy | Friendly message only | Same + optional redacted stack |
| `console.error` via `reportError` | Redacted message + context | Same (always redacted) |
| Diagnostics export | Counters / flags / redacted last error | Same + “Trigger Test Error” |
| SecureStore / secret key | Never read by error UI | Never read by error UI |

Redaction covers Stellar `S…` secrets, `G…` public keys, muxed `M…` accounts, BIP39-like phrases, and 64-char hex seeds. Object keys named like `secretKey` / `mnemonic` are replaced wholesale.

---

## Diagnostics Integration

1. Every `reportError` call stores a **redacted** `LastErrorReport` in memory (`getLastErrorReport()`).
2. `getDiagnostics()` includes that snapshot under `lastReportedError`.
3. Settings → About → **Diagnostics** shows the snapshot and can export it.
4. In `__DEV__`, Diagnostics includes **Trigger Test Error** to exercise the boundary (see `docs/release-testing-checklist.md` §5.3).

See also [Development Diagnostics Export](./diagnostics.md).

---

## What This Does *Not* Cover

- Expected domain errors (network failures, insufficient balance, SecureStore restore failures) — those use dedicated UI (banners, wallet restore screen, etc.).
- Shipping a third-party crash reporter — `reportError` has a production hook stub for Sentry/Bugsnag; wire it there when ready.
- Guaranteeing `DevSettings.reload()` in all production builds — Restart is best-effort; Try Again / Go to Home remain the primary recovery paths.

---

## Onboarding Recovery States

Wallet onboarding (create/import) has its own recovery model defined in `src/types/onboarding.ts`. This covers failures that occur *during* setup, before the user has a wallet.

### State Model

| Variant | When shown | CTA(s) |
|---------|-----------|--------|
| `empty` | New user, no wallet | Create, Import |
| `missing` | Wallet cleared mid-session | Create, Import |
| `loading` | Boot-time SecureStore read | None (spinner) |
| `failed_creation` | Keypair generation or save failed | Try Again, Start Over |
| `failed_import` | Secret key validation or save failed | Try Import Again, Create New |
| `storage_error` | SecureStore/keystore error during save | Retry, Start Over |
| `cancelled` | User navigated back during setup | Create, Import |

### Error Classification

Raw error messages are classified into typed errors via helper functions:

- `classifyOnboardingError(message)` → `OnboardingError` (keypair_generation_failed, invalid_secret_key, etc.)
- `classifyStorageError(message)` → `StorageError` (persist_failed, device_locked, etc.)
- `mapWalletErrorToStorageError(constant)` → `StorageError` (maps walletStorageErrors constants)

Each typed error maps to user-friendly `title`, `message`, and `guidance` strings via `ONBOARDING_ERROR_MESSAGES` and `STORAGE_ERROR_MESSAGES`.

### Recovery Flow

```
User taps Create/Import
  ├─ Success → WalletEmptyState "success" → Go to Wallet
  ├─ Onboarding error → WalletEmptyState "failed_creation"/"failed_import"
  │     ├─ Try Again → resets error, retries operation
  │     └─ Start Over → resets to initial empty state
  └─ Storage error → WalletEmptyState "storage_error"
        ├─ Retry → resets error, retries operation
        └─ Start Over → resets to initial empty state
```

Cancelled setup (user presses Back during create/import flow) leaves the user on the `(auth)` index screen with no wallet state changes — the safe default state.

---

## Contributor Checklist

- [ ] Unexpected render failures are left to the root boundary (do not swallow with empty `catch` that leaves a blank screen).
- [ ] New logging of errors goes through `reportError` (or at least `redactSensitiveString` / `sanitizeError`).
- [ ] Production UI never shows raw `error.stack` or secret-bearing messages.
- [ ] Tests cover fallback visibility, recovery reset, and redaction when you change this area (`__tests__/ErrorBoundary.test.tsx`, `__tests__/globalErrorHandler.test.tsx`, `src/utils/__tests__/redactSensitive.test.ts`).

---

## Transaction Deep Link Error States

When a user arrives at the transaction detail screen via deep link (`stellar-pocketpay:///transaction/{id}`), the screen handles several error states beyond the standard in-memory lookup.

### State Model

| State | When shown | User-facing UI | Actions |
|-------|-----------|----------------|---------|
| `invalid` | ID fails validation (empty, too long, control chars) | "Invalid Transaction Link" + error reason | Go Back |
| `loading` | ID valid but not in store; network fetch in progress | Spinner + "Loading transaction…" | None (auto) |
| `not_found` | ID valid but operation not found on Horizon | "Transaction Not Found" + explanation | Try Again, Go Back |
| `error` | Network failure during fetch | "Connection Error" + guidance | Retry, Go Back |
| `loaded` | Transaction found (in store or via network) | Full transaction detail UI | All existing actions |

### Validation Rules

Transaction IDs are validated by `validateTransactionId()` in `src/utils/validation.ts`:
- Must be non-empty after trimming
- Maximum 128 characters
- No control characters (`\x00-\x1f`, `\x7f`)

### Network Fetch

`fetchOperationById()` in `src/services/stellar.ts` calls `server.operations().operation(id).call()`. Returns `null` on 404 (not found) and throws on other errors. The transaction detail screen shows appropriate UI for each case.

### Auth Gate Deep Link Preservation

The root layout (`app/_layout.tsx`) preserves deep link URLs when a logged-out user arrives. The URL is stored in a `useRef` and replayed via `Linking.openURL()` after authentication completes. This ensures deep links from notifications, receipts, or external sources work end-to-end.

---

## References

- [Mobile Security Checklist](./mobile-security-checklist.md) — Error & Recovery Flows
- [Diagnostics](./diagnostics.md)
- [Navigation Map](./navigation-map.md) — safety wrappers on every route
- [Release Testing Checklist](./release-testing-checklist.md) §5.3 React Error Boundary
