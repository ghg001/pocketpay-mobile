/**
 * Payment error categorization and recovery guidance.
 *
 * Maps Stellar Horizon error codes (and common network errors) to
 * user-friendly messages with actionable next steps.
 */

/**
 * Shown when submission throws but we can't tell whether the transaction
 * actually reached the ledger (e.g. a client-side timeout) — claiming
 * "Failed" here could be wrong, since Horizon may have accepted it anyway.
 */
export const UNCONFIRMED_SUBMISSION_MESSAGE =
  'Could not confirm submission. Check your transaction history before retrying.';

export interface RecoveryGuidance {
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

/** Default guidance shown for unrecognised errors. */
const DEFAULT_GUIDANCE: RecoveryGuidance = {
  title: 'Transaction Failed',
  message: 'Something went wrong while sending your payment.',
  action: 'Please try again. If the problem persists, check your connection or contact support.',
  canRetry: true,
  shouldNavigateBack: false,
};

/**
 * Stellar Horizon transaction result codes that map to
 * specific recovery guidance.
 */
const RESULT_CODE_MAP: Record<string, RecoveryGuidance> = {
  // ── Balance / Reserve ──────────────────────────────────────────
  op_underfunded: {
    title: 'Insufficient Balance',
    message:
      'Your account does not have enough XLM to cover this payment plus the network reserve.',
    action: 'Fund your wallet using Friendbot (Testnet) or deposit more XLM, then try again.',
    canRetry: false,
    shouldNavigateBack: true,
  },
  op_low_reserve: {
    title: 'Reserve Not Met',
    message:
      'Sending this amount would drop your balance below the minimum network reserve.',
    action: 'Reduce the payment amount or add funds to your wallet.',
    canRetry: false,
    shouldNavigateBack: false,
  },

  // ── Destination issues ─────────────────────────────────────────
  op_no_destination: {
    title: 'Recipient Not Found',
    message:
      'The destination account does not exist on the Stellar network yet.',
    action: 'Double-check the address. The recipient may need to fund their account first.',
    canRetry: false,
    shouldNavigateBack: false,
  },
  op_no_trust: {
    title: 'Trustline Missing',
    message:
      'The recipient has not set up a trustline for this asset.',
    action: 'Ask the recipient to add a trustline for this asset, then try again.',
    canRetry: false,
    shouldNavigateBack: true,
  },

  // ── Authentication ─────────────────────────────────────────────
  tx_bad_auth: {
    title: 'Authentication Error',
    message:
      'The transaction could not be signed with your secret key.',
    action: 'Your wallet key may be corrupted. Try re-importing your wallet.',
    canRetry: false,
    shouldNavigateBack: true,
  },

  // ── Fee / Sequence ─────────────────────────────────────────────
  tx_insufficient_fee: {
    title: 'Fee Too Low',
    message:
      'The network fee included in your transaction was too low.',
    action: 'Please try again — the fee will be recalculated automatically.',
    canRetry: true,
    shouldNavigateBack: false,
  },
  tx_bad_seq: {
    title: 'Sequence Error',
    message:
      'Your account sequence number is out of sync with the network.',
    action: 'Please wait a moment and try again.',
    canRetry: true,
    shouldNavigateBack: false,
  },

  // ── Timeout ────────────────────────────────────────────────────
  tx_too_late: {
    title: 'Transaction Expired',
    message:
      'The transaction window closed before it could be submitted.',
    action: 'Please try sending again.',
    canRetry: true,
    shouldNavigateBack: false,
  },
};

/**
 * Classify a raw error (Error, string, or Horizon response) into
 * user-friendly recovery guidance.
 */
export const classifyPaymentError = (error: unknown): RecoveryGuidance => {
  // Extract the raw message string
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
    lower.includes('fetch failed')
  ) {
    return {
      title: 'Network Error',
      message: 'Could not reach the Stellar network.',
      action: 'Check your internet connection and try again.',
      canRetry: true,
      shouldNavigateBack: false,
    };
  }

  // ── Match known Stellar result codes ───────────────────────────
  for (const [code, guidance] of Object.entries(RESULT_CODE_MAP)) {
    if (lower.includes(code)) {
      return guidance;
    }
  }

  // ── Generic "account not found" (the source account) ───────────
  if (lower.includes('not found') || lower.includes('account not found')) {
    return {
      title: 'Account Not Found',
      message:
        'Your account could not be found on the network.',
      action: 'If this is a new wallet, fund it with Friendbot first.',
      canRetry: false,
      shouldNavigateBack: true,
    };
  }

  // ── Fallback ───────────────────────────────────────────────────
  return {
    ...DEFAULT_GUIDANCE,
    message: rawMessage || DEFAULT_GUIDANCE.message,
  };
};
