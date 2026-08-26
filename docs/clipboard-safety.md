# Clipboard Safety

This document describes how PocketPay handles clipboard operations, the security risks involved, and the shared abstractions used to enforce consistent behavior.

---

## Shared Clipboard API

All clipboard operations go through `src/utils/clipboard.ts`, which provides:

- **`copyToClipboard(text)`** — Async wrapper around `expo-clipboard` with structured error handling. Returns `{ ok: boolean, error?: string }` instead of throwing.
- **`useCopyToClipboard(resetDelayMs?)`** — React hook that manages a `copiedField` state and automatically resets after the given delay (default 2 s). Returns `{ copy, copiedField, reset }`.

No screen or component should call `Clipboard.setStringAsync()` directly. This ensures:
1. Every copy has a try/catch boundary.
2. User feedback is consistent across the app.
3. Secrets (e.g., secret keys) can be audited at a single choke point.

---

## What Gets Copied

| Content | Screen | Copied via |
|---|---|---|
| Public wallet address | Receive | `copyToClipboard` |
| Transaction hash | Payment success, Transaction detail | `useCopyToClipboard` |
| Transaction memo | Transaction detail | `useCopyToClipboard` |
| Sender / recipient address | Transaction detail | `useCopyToClipboard` |
| Contract address | Transaction detail | `useCopyToClipboard` |
| Secret key | SecretKeyReveal | `copyToClipboard` (with explicit confirmation dialog) |

---

## Security Considerations

### Clipboard is shared and persistent

The system clipboard is a global, cross-app resource. After a copy, the text remains accessible to any app with clipboard access until it is overwritten.

**Risks:**
- A malicious keyboard, accessibility service, or background app can read clipboard contents.
- On iOS, other apps can read the clipboard when they come to the foreground (iOS 16+ shows a paste notification).
- On Android, apps with `READ_CLIPBOARD` permission (pre-API 33) or accessibility services can read it.

### Mitigations in this codebase

1. **No silent clipboard reads.** All copy operations require an explicit user tap.
2. **Secret key copy requires confirmation.** `SecretKeyReveal` gates the copy behind a destructive confirmation dialog.
3. **Error messages never expose the copied text.** Copy failures show a generic message; the secret value is logged only to `console.error` (which is redacted in production builds).
4. **Consistent user feedback.** Every copy action shows visual confirmation so the user knows when data has entered the clipboard.

### Not yet implemented

- **Auto-clear clipboard after timeout.** Ideally, the app should clear the clipboard after a short period (e.g., 30–60 seconds) so that sensitive data does not persist. This is a common pattern in banking apps. A follow-up issue should track this.
- **Warn users when copying to clipboard.** For high-value operations (e.g., copying a wallet address for pasting into a exchange withdrawal form), a brief snackbar warning ("Paste carefully — clipboard contents can be read by other apps") would improve security posture.

---

## How to Add a New Copy Action

1. Import `copyToClipboard` (standalone) or `useCopyToClipboard` (in a React component) from `src/utils/clipboard`.
2. Call the function with the text and a field key for the hook variant.
3. Do **not** import `expo-clipboard` directly in screen or component files.
4. For secret keys or other high-sensitivity data, gate the copy behind a confirmation dialog.

---

## Testing

- `src/utils/clipboard.test.ts` — unit tests for the `copyToClipboard` function (success, failure, argument passthrough).
- `__tests__/transactionDetail.test.tsx` — integration tests verifying copy buttons on the transaction detail screen.
- `__tests__/SecretKeyReveal.test.tsx` — tests verifying the secret key copy confirmation flow and error handling.
