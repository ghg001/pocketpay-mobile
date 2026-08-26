/**
 * Standardised QR receive payload builder (issue #406).
 *
 * Two formats, chosen automatically based on what the requester asks for:
 *
 * - Address-only: the bare Stellar public key, unchanged from the app's
 *   existing behaviour. Any Stellar wallet can scan this, not just
 *   PocketPay - so it stays the plain address rather than a URI, to not
 *   regress compatibility for the common case (someone just wants to be
 *   paid, with no specific amount).
 * - Payment request: once an amount, asset, or memo is specified, there's
 *   no way to encode that into a bare address, so the payload switches to
 *   a `web+stellar:pay` URI modelled on SEP-0007 (the Stellar ecosystem's
 *   URI scheme for delegated signing / payment requests -
 *   https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md).
 *   `memo_type` values (`MEMO_TEXT` / `MEMO_ID` / `MEMO_HASH` / `MEMO_RETURN`)
 *   follow SEP-0007's documented parameter values, which is a different
 *   casing than the SDK's own internal memo type strings
 *   (`stellar-sdk`'s `Memo` class uses lowercase `"text"` / `"id"` / etc -
 *   verified against `node_modules/@stellar/stellar-sdk`'s type
 *   declarations - because that's the wire format for building an XDR
 *   transaction, not a URI query parameter).
 */

export type ReceiveMemoType = 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';

export interface ReceivePayloadParams {
  /** The Stellar public key funds should be sent to. Required. */
  destination: string;
  /** Requested amount, as a plain decimal string (e.g. "10.5"). Validate
   * with `validateAmount` from `src/utils/validation.ts` before calling -
   * this function does not re-validate it. */
  amount?: string;
  /** Issued asset code. Only included in the payload if `assetIssuer` is
   * also provided - SEP-0007 requires both together; a code alone is
   * ambiguous. Omit both for a native XLM request. */
  assetCode?: string;
  assetIssuer?: string;
  /** Optional memo. Validate with `validateMemo` before calling. */
  memo?: string;
  /** Defaults to `MEMO_TEXT` when `memo` is set and this is omitted. */
  memoType?: ReceiveMemoType;
}

const STELLAR_PAY_URI_PREFIX = 'web+stellar:pay';

/**
 * Builds the string to encode in the receive QR code (and to use as the
 * Share/Copy fallback text). Pure formatting - assumes `amount`/`memo` have
 * already passed `validateAmount`/`validateMemo`.
 */
export function buildReceivePayload(params: ReceivePayloadParams): string {
  const { destination, amount, assetCode, assetIssuer, memo, memoType } = params;

  const trimmedAmount = amount?.trim();
  const trimmedMemo = memo?.trim();
  const hasPaymentRequestFields = Boolean(trimmedAmount || trimmedMemo || (assetCode && assetIssuer));

  if (!hasPaymentRequestFields) {
    return destination;
  }

  const query = new URLSearchParams();
  query.set('destination', destination);

  if (trimmedAmount) {
    query.set('amount', trimmedAmount);
  }

  // SEP-0007 requires asset_code and asset_issuer together; a code with no
  // issuer can't be resolved to a specific asset, so it's dropped silently
  // rather than emitting an invalid/ambiguous payload.
  if (assetCode && assetIssuer) {
    query.set('asset_code', assetCode);
    query.set('asset_issuer', assetIssuer);
  }

  if (trimmedMemo) {
    query.set('memo', trimmedMemo);
    query.set('memo_type', memoType ?? 'MEMO_TEXT');
  }

  return `${STELLAR_PAY_URI_PREFIX}?${query.toString()}`;
}

/** True when `payload` is a payment-request URI rather than a bare address. */
export function isPaymentRequestPayload(payload: string): boolean {
  return payload.startsWith(STELLAR_PAY_URI_PREFIX);
}
