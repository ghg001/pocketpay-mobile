/**
 * Vault error categorization and recovery guidance.
 *
 * Maps vault action failures (validation, unsupported features, network,
 * signing, contract errors) to user-friendly messages with actionable
 * next steps. Mirrors the pattern established by paymentErrors.ts but
 * scoped to vault operations.
 */

import { redactSensitiveString } from './redactSensitive';

/**
 * Categorised vault failure codes.
 *
 * Each code maps to specific user-facing recovery copy so callers never
 * have to construct messages themselves.
 */
export type VaultErrorCode =
  | 'validation'
  | 'unsupported-feature'
  | 'network'
  | 'signing-rejected'
  | 'contract-error'
  | 'secret-unavailable'
  | 'insufficient-balance'
  | 'reserve-not-met'
  | 'lock-not-found'
  | 'not-matured'
  | 'unknown';

export interface VaultRecoveryGuidance {
  /** Short, human-readable error title. */
  title: string;
  /** One-sentence explanation of what went wrong. */
  message: string;
  /** Suggested next action for the user. */
  action: string;
  /** Whether the user should try again with the same inputs. */
  canRetry: boolean;
  /** Whether the user should navigate back / fix inputs. */
  shouldNavigateBack: boolean;
}

/** Default guidance shown for unrecognised vault errors. */
const DEFAULT_VAULT_GUIDANCE: VaultRecoveryGuidance = {
  title: 'Vault Action Failed',
  message: 'Something went wrong with this vault action.',
  action: 'Please try again. If the problem persists, check your connection or contact support.',
  canRetry: true,
  shouldNavigateBack: false,
};

/**
 * Maps vault error codes to recovery guidance.
 * Never surfaces raw RPC or contract errors to the user.
 */
const VAULT_ERROR_MAP: Record<VaultErrorCode, VaultRecoveryGuidance> = {
  validation: {
    title: 'Invalid Input',
    message: 'The amount you entered is not valid for this vault action.',
    action: 'Check the amount and make sure it meets the minimum requirements.',
    canRetry: false,
    shouldNavigateBack: true,
  },
  'unsupported-feature': {
    title: 'Feature Unavailable',
    message: 'This vault action is not supported in the current configuration.',
    action: 'The vault contract or SDK may not be set up yet. Try again later or check your settings.',
    canRetry: false,
    shouldNavigateBack: false,
  },
  network: {
    title: 'Network Problem',
    message: 'Could not reach the Stellar network to complete this vault action.',
    action: 'Check your internet connection and try again.',
    canRetry: true,
    shouldNavigateBack: false,
  },
  'signing-rejected': {
    title: 'Signing Cancelled',
    message: 'The transaction was not signed. Your funds are unchanged.',
    action: 'You can try again when you are ready to approve the transaction.',
    canRetry: true,
    shouldNavigateBack: false,
  },
  'contract-error': {
    title: 'Contract Error',
    message: 'The Soroban vault contract rejected the transaction.',
    action: 'This may be a temporary issue. Please try again in a moment.',
    canRetry: true,
    shouldNavigateBack: false,
  },
  'secret-unavailable': {
    title: 'Could Not Access Wallet Key',
    message: 'Your wallet key could not be read from secure storage.',
    action: 'Reopen the app and try again. If this persists, re-import your wallet.',
    canRetry: true,
    shouldNavigateBack: true,
  },
  'insufficient-balance': {
    title: 'Insufficient Balance',
    message: 'Your account does not have enough XLM to complete this vault action plus the network reserve.',
    action: 'Fund your wallet using Friendbot (Testnet) or deposit more XLM, then try again.',
    canRetry: false,
    shouldNavigateBack: true,
  },
  'reserve-not-met': {
    title: 'Reserve Not Met',
    message: 'This action would drop your balance below the minimum network reserve.',
    action: 'Reduce the amount or add more XLM to your wallet.',
    canRetry: false,
    shouldNavigateBack: false,
  },
  'lock-not-found': {
    title: 'Lock Unavailable',
    message: 'This vault lock is no longer available. It may have already been withdrawn.',
    action: 'Refresh the vault to see your current locks.',
    canRetry: false,
    shouldNavigateBack: false,
  },
  'not-matured': {
    title: 'Lock Not Ready',
    message: 'This lock has not matured yet. You can withdraw it once its unlock date has passed.',
    action: 'Wait for the unlock date or check the lock details for the exact date.',
    canRetry: false,
    shouldNavigateBack: false,
  },
  unknown: {
    ...DEFAULT_VAULT_GUIDANCE,
  },
};

/**
 * Get recovery guidance for a specific vault error code.
 */
export function describeVaultError(code: VaultErrorCode): VaultRecoveryGuidance {
  return VAULT_ERROR_MAP[code] ?? DEFAULT_VAULT_GUIDANCE;
}

/**
 * Classify an unknown thrown value into a vault error code.
 *
 * Pattern-matches on common error messages from Stellar SDK, Horizon,
 * and React Native to determine the most appropriate category. Sensitive
 * details are stripped from the returned message.
 */
export function classifyVaultError(error: unknown): VaultRecoveryGuidance {
  let rawMessage = '';

  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === 'string') {
    rawMessage = error;
  } else if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    rawMessage = (error as any).message;
  }

  const lower = rawMessage.toLowerCase().trim();

  // ── Network / connectivity ─────────────────────────────────────
  if (
    lower.includes('network') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('fetch failed') ||
    lower.includes('unreachable')
  ) {
    return { ...VAULT_ERROR_MAP.network, message: redactSensitiveString(rawMessage) || VAULT_ERROR_MAP.network.message };
  }

  // ── Signing rejection ─────────────────────────────────────────
  if (
    lower.includes('user denied') ||
    lower.includes('user rejected') ||
    lower.includes('canceled') ||
    lower.includes('cancelled') ||
    lower.includes('signing rejected')
  ) {
    return VAULT_ERROR_MAP['signing-rejected'];
  }

  // ── Stellar result codes ──────────────────────────────────────
  if (lower.includes('op_underfunded') || lower.includes('insufficient funds')) {
    return VAULT_ERROR_MAP['insufficient-balance'];
  }
  if (lower.includes('op_low_reserve') || lower.includes('low reserve')) {
    return VAULT_ERROR_MAP['reserve-not-met'];
  }
  if (lower.includes('tx_bad_auth') || lower.includes('authentication')) {
    return VAULT_ERROR_MAP['secret-unavailable'];
  }

  // ── Contract errors ───────────────────────────────────────────
  if (
    lower.includes('contract') ||
    lower.includes('soroban') ||
    lower.includes('simulation failed')
  ) {
    return { ...VAULT_ERROR_MAP['contract-error'], message: redactSensitiveString(rawMessage) || VAULT_ERROR_MAP['contract-error'].message };
  }

  // ── Validation ────────────────────────────────────────────────
  if (
    lower.includes('invalid') ||
    lower.includes('validation') ||
    lower.includes('not a valid') ||
    lower.includes('must be')
  ) {
    return { ...VAULT_ERROR_MAP.validation, message: redactSensitiveString(rawMessage) || VAULT_ERROR_MAP.validation.message };
  }

  // ── Secret key / wallet access ────────────────────────────────
  if (
    lower.includes('secret') ||
    lower.includes('key') ||
    lower.includes('secure store') ||
    lower.includes('wallet secret')
  ) {
    return VAULT_ERROR_MAP['secret-unavailable'];
  }

  // ── Unsupported feature ───────────────────────────────────────
  if (
    lower.includes('unsupported') ||
    lower.includes('not supported') ||
    lower.includes('not implemented') ||
    lower.includes('not available')
  ) {
    return VAULT_ERROR_MAP['unsupported-feature'];
  }

  // ── Fallback ──────────────────────────────────────────────────
  return {
    ...DEFAULT_VAULT_GUIDANCE,
    message: redactSensitiveString(rawMessage) || DEFAULT_VAULT_GUIDANCE.message,
  };
}
