import { validatePublicKey } from "pocketpay-sdk";
import { Buffer } from "buffer";

// Stellar text memos are limited to 28 bytes.
export const MEMO_MAX_BYTES = 28;

// Accounts must keep a minimum XLM balance to stay active on the network.
export const MIN_XLM_RESERVE = 1;

/**
 * Normalize a Stellar public key for consistent comparison.
 * Trims whitespace and uppercases the key.
 */
function normalizeKey(publicKey: string): string {
  return publicKey.trim().toUpperCase();
}

/**
 * Validate a Stellar destination address.
 * Returns a readable error message, or null if valid.
 */
export const validateAddress = (
  address: string,
  ownPublicKey?: string | null,
): string | null => {
  const trimmed = address.trim();

  if (!trimmed) {
    return "Please enter a destination address.";
  }

  try {
    validatePublicKey(trimmed);
  } catch {
    return "This doesn't look like a valid Stellar address. It should start with G and be 56 characters long.";
  }

  if (ownPublicKey && trimmed === ownPublicKey) {
    return "You can't send a payment to your own wallet.";
  }

  return null;
};

// ── Contact-specific validation ─────────────────────────────────────────────

export interface ContactRecord {
  id: string;
  name: string;
  publicKey: string;
}

export interface ContactValidationResult {
  /** null if no conflict, otherwise an error/warning message. */
  message: string | null;
  /** The severity of the conflict. 'error' blocks saving; 'warning' is advisory. */
  severity: "error" | "warning";
}

/**
 * Check whether a public key already exists in the given contact list.
 * Returns an error result (blocking) if a duplicate is found.
 *
 * @param publicKey - The address to check.
 * @param contacts  - The current list of saved contacts.
 * @param excludeId - Optional contact ID to exclude from the check (used when editing an existing contact).
 */
export function validateContactAddress(
  publicKey: string,
  contacts: ContactRecord[],
  excludeId?: string,
): ContactValidationResult {
  const trimmed = publicKey.trim();
  if (!trimmed) {
    return { message: null, severity: "error" };
  }

  const normalized = normalizeKey(trimmed);
  const existing = contacts.find(
    (c) => c.id !== excludeId && normalizeKey(c.publicKey) === normalized,
  );

  if (existing) {
    return {
      message: `This address is already saved as "${existing.name}".`,
      severity: "error",
    };
  }

  return { message: null, severity: "error" };
}

/**
 * Check whether a display name already exists in the given contact list.
 * Returns a warning result (non-blocking) if a duplicate name is found.
 *
 * @param name      - The display name to check.
 * @param contacts  - The current list of saved contacts.
 * @param excludeId - Optional contact ID to exclude from the check (used when editing).
 */
export function validateContactName(
  name: string,
  contacts: ContactRecord[],
  excludeId?: string,
): ContactValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { message: null, severity: "warning" };
  }

  const normalized = trimmed.toLowerCase();
  const existing = contacts.find(
    (c) => c.id !== excludeId && c.name.trim().toLowerCase() === normalized,
  );

  if (existing) {
    return {
      message: `You already have a contact named "${existing.name}". You can still save another with a different address.`,
      severity: "warning",
    };
  }

  return { message: null, severity: "warning" };
}

/**
 * Validate a payment amount. If a balance is provided, also checks
 * that the amount can actually be sent.
 * Returns a readable error message, or null if valid.
 */
export const validateAmount = (
  amount: string,
  balance?: string,
): string | null => {
  const trimmed = amount.trim();

  if (!trimmed) {
    return "Please enter an amount.";
  }

  const value = Number(trimmed);
  if (!/^\d+(\.\d+)?$/.test(trimmed) || Number.isNaN(value)) {
    return "Please enter a valid number.";
  }

  if (value <= 0) {
    return "Amount must be more than 0.";
  }

  const decimals = trimmed.split(".")[1];
  if (decimals && decimals.length > 7) {
    return "Amount can have at most 7 decimal places.";
  }

  if (balance !== undefined) {
    const balanceValue = Number(balance);
    if (value > balanceValue) {
      return "You don't have enough XLM for this payment.";
    }
    if (value > balanceValue - MIN_XLM_RESERVE) {
      return `You need to keep at least ${MIN_XLM_RESERVE} XLM in your wallet, so this amount is too high.`;
    }
  }

  return null;
};

/**
 * Validate an optional text memo (max 28 bytes on Stellar).
 * Returns a readable error message, or null if valid.
 */
export const validateMemo = (memo: string): string | null => {
  const trimmedMemo = memo.trim();
  if (!trimmedMemo) {
    return null;
  }

  if (Buffer.byteLength(trimmedMemo, "utf8") > MEMO_MAX_BYTES) {
    return `Memo is too long. Please keep it under ${MEMO_MAX_BYTES} bytes.`;
  }

  return null;
};

// ── Transaction deep-link validation ────────────────────────────────────────

/**
 * Maximum length for a Horizon operation ID / paging token.  Horizon paging
 * tokens are typically short numeric strings but we cap at a generous limit
 * to reject obviously malformed deep-link payloads.
 */
const TX_ID_MAX_LENGTH = 128;

/**
 * Validate a transaction / operation ID received via deep link.
 * Returns a readable error message, or null if valid.
 *
 * Horizon operation IDs are numeric strings (e.g. "123456789012345")
 * and paging tokens are typically numeric or dot-separated numeric strings.
 * We reject empty values, control characters, and overly long strings.
 */
export const validateTransactionId = (id: string | undefined): string | null => {
  if (!id || !id.trim()) {
    return 'No transaction ID provided.';
  }

  const trimmed = id.trim();

  if (trimmed.length > TX_ID_MAX_LENGTH) {
    return 'Transaction link is invalid (too long).';
  }

  // Reject control characters (newlines, tabs, etc.) which could be used
  // for injection in logs or display contexts.
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    return 'Transaction link contains invalid characters.';
  }

  return null;
};
