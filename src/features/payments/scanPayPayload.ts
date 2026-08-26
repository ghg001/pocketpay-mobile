/**
 * QR scan payment review — parse + validate a scanned payload.
 *
 * Issue #407: scanned QR data must NOT be trusted or mapped directly into
 * payment fields. This module parses the scanned string, validates every
 * field, and returns a typed review model. The UI shows that model on a
 * review screen and lets the user cancel BEFORE any payment intent is
 * created or signed.
 *
 * Reverse of `src/features/receive/qrPayload.ts`. Accepts two formats
 * (matching what the app emits):
 *   - bare Stellar address  -> address-only payment
 *   - `web+stellar:pay?destination=...&amount=...` SEP-0007 URI
 *
 * Security notes:
 *   - Never signs or submits from here. Validation is read-only.
 *   - `validatePublicKey` (pocketpay-sdk) is the authority on address
 *     shape; we surface its failure as a safe, readable error.
 *   - Memo byte-length is enforced via `validateMemo` (28-byte cap).
 */

import {
  validateAddress,
  validateAmount,
  validateMemo,
} from "@/utils/validation";

const STELLAR_PAY_URI_PREFIX = "web+stellar:pay";
const SCAN_PAY_MEMO_TYPES = ["MEMO_TEXT", "MEMO_ID", "MEMO_HASH", "MEMO_RETURN"] as const;
export type ScanPayMemoType = (typeof SCAN_PAY_MEMO_TYPES)[number];

/** A single field-level problem found during parsing/validation. */
export interface ScanPayFieldError {
  field: "destination" | "amount" | "asset" | "memo" | "payload";
  message: string;
}

/** The validated, review-ready model shown on the review screen. */
export interface ScanPayReview {
  /** Raw scanned string (kept for display + audit; never re-signed as-is). */
  raw: string;
  /** True when the payload was a SEP-0007 payment-request URI. */
  isPaymentRequest: boolean;
  destination: string | null;
  amount: string | null;
  /** Issued asset, present only when both code + issuer were valid. */
  assetCode: string | null;
  assetIssuer: string | null;
  memo: string | null;
  memoType: ScanPayMemoType | null;
  /** Field-level errors; empty array means the payload is fully valid. */
  errors: ScanPayFieldError[];
  /** Convenience: true when there are no blocking errors. */
  isValid: boolean;
}

const isValidMemoType = (v: string): v is ScanPayMemoType =>
  (SCAN_PAY_MEMO_TYPES as readonly string[]).includes(v);

/**
 * Parse a scanned QR string into a raw review model WITHOUT validating
 * field semantics. Splits a SEP-0007 URI into its query parts and a
 * bare address into `{ destination }`. Every value stays a string here;
 * validation happens in `validateScanPay`.
 */
function parseRawScan(raw: string): {
  isPaymentRequest: boolean;
  destination: string | null;
  amount: string | null;
  assetCode: string | null;
  assetIssuer: string | null;
  memo: string | null;
  memoType: string | null;
} {
  const trimmed = raw.trim();

  if (trimmed.startsWith(STELLAR_PAY_URI_PREFIX)) {
    const queryStart = trimmed.indexOf("?");
    const queryString = queryStart >= 0 ? trimmed.slice(queryStart + 1) : "";
    const params = new URLSearchParams(queryString);
    return {
      isPaymentRequest: true,
      destination: params.get("destination"),
      amount: params.get("amount"),
      assetCode: params.get("asset_code"),
      assetIssuer: params.get("asset_issuer"),
      memo: params.get("memo"),
      memoType: params.get("memo_type"),
    };
  }

  // Bare address (or anything else we don't recognise) is treated as a
  // destination candidate; validation decides if it's actually an address.
  return {
    isPaymentRequest: false,
    destination: trimmed || null,
    amount: null,
    assetCode: null,
    assetIssuer: null,
    memo: null,
    memoType: null,
  };
}

/**
 * Validate a parsed scan. Returns a `ScanPayReview` with `errors` filled
 * for every problem. Pure and side-effect free — safe to call on every
 * keystroke or scan event.
 *
 * `ownPublicKey` lets us flag self-payment (mirrors `validateAddress`).
 * `balance` lets amount validation warn on insufficient funds (same as send).
 */
export function validateScanPay(
  raw: string,
  options: { ownPublicKey?: string | null; balance?: string } = {},
): ScanPayReview {
  const parsed = parseRawScan(raw);
  const errors: ScanPayFieldError[] = [];

  if (!raw || !raw.trim()) {
    errors.push({ field: "payload", message: "The scanned code was empty." });
    return {
      raw,
      isPaymentRequest: false,
      destination: null,
      amount: null,
      assetCode: null,
      assetIssuer: null,
      memo: null,
      memoType: null,
      errors,
      isValid: false,
    };
  }

  // Destination is always required.
  const destinationError = validateAddress(
    parsed.destination ?? "",
    options.ownPublicKey,
  );
  if (destinationError) {
    errors.push({ field: "destination", message: destinationError });
  }

  // Amount is optional for an address-only scan, required-semantics for a
  // payment request (if an amount key is present it must be valid).
  let amount: string | null = null;
  if (parsed.amount != null) {
    const amountError = validateAmount(parsed.amount, options.balance);
    if (amountError) {
      errors.push({ field: "amount", message: amountError });
    } else {
      amount = parsed.amount.trim();
    }
  }

  // Asset requires BOTH code and issuer per SEP-0007; a lone code is
  // ambiguous and dropped (matches buildReceivePayload's behaviour).
  let assetCode: string | null = null;
  let assetIssuer: string | null = null;
  if (parsed.assetCode && parsed.assetIssuer) {
    const issuerError = validateAddress(parsed.assetIssuer, null);
    if (issuerError) {
      errors.push({
        field: "asset",
        message: "The asset issuer in this code is not a valid Stellar address.",
      });
    } else {
      assetCode = parsed.assetCode.trim();
      assetIssuer = parsed.assetIssuer.trim();
    }
  } else if (parsed.assetCode || parsed.assetIssuer) {
    errors.push({
      field: "asset",
      message: "This code has an asset code without a valid issuer (or vice versa).",
    });
  }

  // Memo: byte-length via validateMemo; type must be a known SEP-0007 value.
  let memo: string | null = null;
  let memoType: ScanPayMemoType | null = null;
  if (parsed.memo != null) {
    const memoError = validateMemo(parsed.memo);
    if (memoError) {
      errors.push({ field: "memo", message: memoError });
    } else {
      memo = parsed.memo.trim();
    }
  }
  if (parsed.memoType != null) {
    if (isValidMemoType(parsed.memoType)) {
      memoType = parsed.memoType;
    } else {
      errors.push({
        field: "memo",
        message: "This code has an unrecognised memo type.",
      });
    }
  }

  return {
    raw,
    isPaymentRequest: parsed.isPaymentRequest,
    destination: parsed.destination?.trim() ?? null,
    amount,
    assetCode,
    assetIssuer,
    memo,
    memoType,
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Human-readable summary of the parsed fields, for the review screen.
 * Returns null per field when absent so the UI can render "—".
 */
export function describeScanPay(review: ScanPayReview): {
  destination: string | null;
  amount: string | null;
  asset: string | null;
  memo: string | null;
} {
  const asset =
    review.assetCode && review.assetIssuer
      ? `${review.assetCode}:${review.assetIssuer}`
      : null;
  const memo =
    review.memo && review.memoType
      ? `${review.memo} (${review.memoType})`
      : review.memo;
  return {
    destination: review.destination,
    amount: review.amount,
    asset,
    memo: memo ?? null,
  };
}
