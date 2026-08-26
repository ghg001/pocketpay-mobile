/**
 * Matured lock withdrawal — eligibility rules and failure vocabulary.
 *
 * Pure helpers shared by the vault store, the withdrawal hook, and the
 * withdrawal modal so all three agree on when a lock may be withdrawn and how a
 * failure is described to the user.
 *
 * SDK assumptions for this flow are documented in
 * docs/vault-integration-assumptions.md ("Matured lock withdrawal").
 */

import type { Lock } from '../../store/vaultStore';
import { formatTimeRemaining } from '../../utils/lockTime';

export type WithdrawalIneligibilityReason =
  | 'not-matured'
  | 'no-wallet'
  | 'invalid-amount';

export interface WithdrawalEligibility {
  isEligible: boolean;
  /** Set only when `isEligible` is false. */
  reason: WithdrawalIneligibilityReason | null;
  /** Plain-language explanation, safe to render directly. */
  message: string;
  /** Localized unlock date, or null when the lock has no usable unlock date. */
  availableFrom: string | null;
}

const formatUnlockDate = (unlockDate: Date): string =>
  unlockDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

/**
 * Decide whether a lock can be withdrawn right now.
 *
 * Maturity is derived from `unlockDate` rather than the stored `status` field:
 * `status` is only recomputed when locks are loaded, so a lock that matured
 * while the screen was open would otherwise still read as locked.
 */
export function evaluateWithdrawalEligibility(
  lock: Pick<Lock, 'amount' | 'unlockDate'>,
  options: { publicKey?: string | null; now?: number } = {}
): WithdrawalEligibility {
  const { publicKey, now = Date.now() } = options;

  const unlockDate = new Date(lock.unlockDate);
  const hasUnlockDate = !isNaN(unlockDate.getTime());
  const availableFrom = hasUnlockDate ? formatUnlockDate(unlockDate) : null;

  if (!publicKey) {
    return {
      isEligible: false,
      reason: 'no-wallet',
      message: 'Connect a wallet before withdrawing from the vault.',
      availableFrom,
    };
  }

  const amount = Number(lock.amount);
  if (!isFinite(amount) || amount <= 0) {
    return {
      isEligible: false,
      reason: 'invalid-amount',
      message: 'This lock has no withdrawable amount.',
      availableFrom,
    };
  }

  if (!hasUnlockDate || unlockDate.getTime() > now) {
    const remaining = hasUnlockDate ? formatTimeRemaining(lock.unlockDate) : '';
    const message = availableFrom
      ? `These funds unlock on ${availableFrom}. ${remaining}`.trim()
      : 'Withdrawal is not yet available for this lock.';

    return { isEligible: false, reason: 'not-matured', message, availableFrom };
  }

  return {
    isEligible: true,
    reason: null,
    message: 'This lock has matured. The full amount can be returned to your wallet.',
    availableFrom,
  };
}

export type VaultWithdrawalErrorCode =
  | 'lock-not-found'
  | 'not-matured'
  | 'no-wallet'
  | 'invalid-amount'
  | 'secret-unavailable'
  | 'network'
  | 'unknown';

export interface VaultWithdrawalError extends Error {
  code: VaultWithdrawalErrorCode;
}

/**
 * Build a tagged withdrawal error.
 *
 * A plain `Error` with a `code` property is used instead of an `Error`
 * subclass: subclassed built-ins do not survive transpilation reliably across
 * the Hermes/Babel targets this app builds for, which would break `instanceof`.
 */
export function createWithdrawalError(
  code: VaultWithdrawalErrorCode,
  message?: string
): VaultWithdrawalError {
  const error = new Error(message ?? describeWithdrawalError(code).message) as VaultWithdrawalError;
  error.code = code;
  return error;
}

export function isVaultWithdrawalError(value: unknown): value is VaultWithdrawalError {
  return value instanceof Error && typeof (value as VaultWithdrawalError).code === 'string';
}

export interface WithdrawalErrorCopy {
  title: string;
  message: string;
  /** Whether offering the user a retry makes sense for this failure. */
  canRetry: boolean;
}

/** Map a failure code to user-facing copy. Never surfaces raw RPC errors. */
export function describeWithdrawalError(code: VaultWithdrawalErrorCode): WithdrawalErrorCopy {
  switch (code) {
    case 'lock-not-found':
      return {
        title: 'Lock unavailable',
        message: 'This lock is no longer in your vault. Refresh the vault and try again.',
        canRetry: false,
      };
    case 'not-matured':
      return {
        title: 'Not ready yet',
        message:
          'This lock has not matured. You can withdraw it once its unlock date has passed.',
        canRetry: false,
      };
    case 'no-wallet':
      return {
        title: 'No wallet available',
        message: 'Connect a wallet before withdrawing from the vault.',
        canRetry: false,
      };
    case 'invalid-amount':
      return {
        title: 'Nothing to withdraw',
        message: 'This lock has no withdrawable amount.',
        canRetry: false,
      };
    case 'secret-unavailable':
      return {
        title: 'Could not sign',
        message:
          'Your wallet key could not be read from secure storage, so nothing was withdrawn. Reopen the app and try again.',
        canRetry: true,
      };
    case 'network':
      return {
        title: 'Network problem',
        message:
          'The withdrawal could not be completed because the network was unreachable. Your funds are still locked in the vault.',
        canRetry: true,
      };
    default:
      return {
        title: 'Withdrawal failed',
        message:
          'The withdrawal did not go through and your funds are still in the vault. Please try again.',
        canRetry: true,
      };
  }
}

/** Classify an unknown thrown value into a withdrawal error code. */
export function toWithdrawalErrorCode(error: unknown): VaultWithdrawalErrorCode {
  if (isVaultWithdrawalError(error)) return error.code;

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/network|fetch|timeout|unreachable|connection/i.test(message)) return 'network';
  return 'unknown';
}
