/**
 * Balance and funding state types for the wallet.
 *
 * Distinguishes between loading, unavailable (network error), zero balance,
 * and known positive balance so the UI can render distinct states instead of
 * conflating "no data" with "zero XLM".
 *
 * FundingStatus tracks whether the account exists on the Stellar network.
 */

/** The high-level state of the balance fetch lifecycle. */
export type BalanceState =
  | 'idle'        // No fetch has been attempted yet (e.g. boot before wallet check)
  | 'loading'     // A fetch is in-flight
  | 'available'   // Balance was fetched successfully (may be zero or positive)
  | 'unavailable'; // The last fetch failed (network error, Horizon error, etc.)

/** Human-readable description for each balance state. */
export interface BalanceStateCopy {
  title: string;
  message: string;
  /** A short label for a retry button action, or undefined if retry doesn't apply. */
  retryLabel?: string;
}

/**
 * Returns user-facing copy for each balance state.
 * Safe to render directly — no raw error messages are surfaced.
 */
/**
 * Whether the account exists on the Stellar network.
 * - 'unknown':  haven't checked yet (or network error prevented check)
 * - 'checking': in the process of checking account existence
 * - 'unfunded': account does not exist on the network yet
 * - 'funded':   account exists on the network
 */
export type FundingStatus = 'unknown' | 'checking' | 'unfunded' | 'funded';

export function describeBalanceState(state: BalanceState): BalanceStateCopy {
  switch (state) {
    case 'idle':
      return {
        title: 'No balance data yet',
        message:
          'Your wallet balance has not been checked yet. Pull down to refresh.',
        retryLabel: 'Refresh',
      };
    case 'loading':
      return {
        title: 'Loading your balance',
        message: 'Fetching your latest balance from the Stellar network…',
      };
    case 'available':
      return {
        title: 'Balance available',
        message: '',
      };
    case 'unavailable':
      return {
        title: 'Balance unavailable',
        message:
          'We could not retrieve your current balance due to a network issue. Your funds are safe. Please try again.',
        retryLabel: 'Retry',
      };
  }
}
