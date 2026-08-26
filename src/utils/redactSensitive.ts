/**
 * Redacts wallet secrets and other sensitive material from strings and
 * structured values before they reach logs, diagnostics, or support exports.
 *
 * Patterns follow Stellar key formats and common wallet secret shapes used
 * in PocketPay. Prefer calling this at every error-reporting boundary rather
 * than trusting individual call sites to sanitize manually.
 */

const STELLAR_SECRET_KEY = /\bS[A-Z0-9]{55}\b/g;
const STELLAR_PUBLIC_KEY = /\bG[A-Z0-9]{55}\b/g;
const STELLAR_MUXED_ACCOUNT = /\bM[A-Z0-9]{68}\b/g;
/** 12–24 lowercase BIP39-like word sequences. */
const MNEMONIC_PHRASE = /\b(?:[a-z]+(?:\s+|$)){12,24}\b/gi;
const HEX_SEED = /\b(?:0x)?[a-f0-9]{64}\b/gi;

const SENSITIVE_KEY_NAME =
  /^(secret|secretkey|privatekey|mnemonic|seed|seedphrase|password|pin|passphrase|recoveryphrase)$/i;

export const REDACTED_SECRET = '[REDACTED_SECRET]';
export const REDACTED_PUBLIC_KEY = '[REDACTED_PUBLIC_KEY]';
export const REDACTED_MUXED = '[REDACTED_MUXED]';
export const REDACTED_MNEMONIC = '[REDACTED_MNEMONIC]';
export const REDACTED_HEX = '[REDACTED_HEX]';
export const REDACTED_VALUE = '[REDACTED]';

export function redactSensitiveString(input: string): string {
  if (!input) return input;

  let out = input;
  out = out.replace(STELLAR_SECRET_KEY, REDACTED_SECRET);
  out = out.replace(STELLAR_PUBLIC_KEY, REDACTED_PUBLIC_KEY);
  out = out.replace(STELLAR_MUXED_ACCOUNT, REDACTED_MUXED);
  out = out.replace(MNEMONIC_PHRASE, REDACTED_MNEMONIC);
  out = out.replace(HEX_SEED, REDACTED_HEX);
  return out;
}

export function redactSensitiveValue(value: unknown): unknown {
  if (value == null) return value;

  if (typeof value === 'string') {
    return redactSensitiveString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return sanitizeError(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_NAME.test(key)) {
        result[key] = REDACTED_VALUE;
        continue;
      }
      result[key] = redactSensitiveValue(nested);
    }
    return result;
  }

  return String(value);
}

export interface SanitizedError {
  name: string;
  message: string;
  stack?: string;
}

export function sanitizeError(error: Error): SanitizedError {
  return {
    name: error.name || 'Error',
    message: redactSensitiveString(error.message || 'Unknown error'),
    stack: error.stack ? redactSensitiveString(error.stack) : undefined,
  };
}
