# Scan-to-Pay Review Flow

This document describes the QR scan → review → cancel payment flow for the
PocketPay mobile app (issue #407).

> **Security principle:** a scanned QR payload is **never** trusted, mapped
> directly into payment fields, or signed on scan. It is parsed, validated,
> shown on a review screen, and may be cancelled before any payment intent
> is created.

## Data flow

```
scanned string
   │
   ▼
parseRawScan()          split SEP-0007 `web+stellar:pay?...` URI
   │                     or treat as bare Stellar address
   ▼
validateScanPay()       validateAddress / validateAmount (vs balance)
   │                     validateMemo (28-byte cap) / validatePublicKey
   │                     asset code+issuer pair check, memo-type allowlist
   ▼
ScanPayReview {        typed, display-ready model
  destination, amount,    null for absent fields
  assetCode, assetIssuer,
  memo, memoType,
  errors[], isValid
}
   │
   ▼
Review screen (app/scan-pay.tsx)
   ├── show parsed values (truncated, selectable)
   ├── list field errors (safe, readable messages)
   ├── Cancel  → no payment intent, no signature
   └── Confirm → handoff to existing send flow (caller's responsibility)
```

## Validation rules

| Field | Rule | Failure message (example) |
| --- | --- | --- |
| payload | non-empty | "The scanned code was empty." |
| destination | `validateAddress` (shape + not self) | "This doesn't look like a valid Stellar address…" / "You can't send a payment to your own wallet." |
| amount | `validateAmount` (positive, ≤7 dp, ≤ balance − reserve) | "Amount must be more than 0." / "You don't have enough XLM…" |
| asset | code **and** issuer required together; issuer must be a valid address | "…asset code without a valid issuer…" |
| memo | ≤ 28 bytes (`validateMemo`); type ∈ {`MEMO_TEXT`,`MEMO_ID`,`MEMO_HASH`,`MEMO_RETURN`} | "Memo is too long…" / "…unrecognised memo type." |

Validation is **pure and side-effect free** — safe to call on every
scan event. Invalid scans are still shown on the review screen (so the user
sees *why* it was rejected) rather than silently reopening the scanner.

## Acceptance criteria coverage

- [x] Scanned QR payloads are validated (address/amount/asset/memo).
- [x] Review screen shown before payment creation.
- [x] Invalid payloads show safe, human-readable errors.
- [x] User can cancel before the payment flow (no intent/signature).
- [x] Parsed values are clearly displayed.
- [x] Documentation explains scan-to-pay behaviour.

## Implementation notes

- `src/features/payments/scanPayPayload.ts` — pure parse + validate + describe.
- `src/features/payments/useScanPayReview.ts` — flow state (`idle`/`review`/`cancelled`). Holds validated state only; **never signs**.
- `app/scan-pay.tsx` — review UI (parse input, review card, cancel/confirm).
- `src/features/payments/scanPayPayload.test.ts` — Jest coverage of every rule above.

## Compatibility

- Mirrors the **reverse** of `src/features/receive/qrPayload.ts` (which
  *builds* the same SEP-0007 format), so what the app emits is exactly
  what it can parse.
- Reuses `validateAddress` / `validateAmount` / `validateMemo` from
  `src/utils/validation.ts` and `validatePublicKey` from `pocketpay-sdk`,
  so address rules stay consistent with the send screen.
- The confirm action is a handoff point; wiring it to `app/send.tsx` is a
  follow-up (out of scope for #407, which is review-only).
