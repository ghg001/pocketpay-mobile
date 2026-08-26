/**
 * useNetworkStatus
 *
 * Classifies a wallet store error string into one of three states:
 *
 *  - 'offline'             – device has no internet connection
 *  - 'service-unavailable' – Stellar Horizon or Friendbot is reachable but
 *                            returning errors (5xx, rate-limit, timeout, etc.)
 *  - 'none'                – no network-related error (null, or an unrelated
 *                            application error)
 *
 * This hook deliberately avoids installing extra native dependencies.  It
 * instead inspects the error messages already produced by the wallet store
 * and the Stellar service layer, which follow the patterns established
 * throughout the codebase (e.g. "Network request failed", "ECONNRESET").
 *
 * @param error  The `error` string from `useWalletStore`, or `null`.
 */

export type NetworkErrorType = 'offline' | 'service-unavailable' | 'none';

// Patterns that indicate the device itself is offline.
const OFFLINE_PATTERNS: RegExp[] = [
  /network request failed/i,
  /network error/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /no internet/i,
  /unable to connect/i,
  /failed to fetch/i,
  /network is (unavailable|down)/i,
];

// Patterns that indicate the Stellar Testnet services are unreachable or
// degraded rather than the device being fully offline.
const SERVICE_PATTERNS: RegExp[] = [
  /horizon/i,
  /friendbot/i,
  /testnet/i,
  /stellar/i,
  /service unavailable/i,
  /too many requests/i,
  /rate.?limit/i,
  /bad gateway/i,
  /gateway timeout/i,
  /503/,
  /502/,
  /504/,
];

/**
 * Classify a raw error message into a NetworkErrorType.
 *
 * Exported for unit testing.
 */
export function classifyNetworkError(error: string | null): NetworkErrorType {
  if (!error) return 'none';

  if (OFFLINE_PATTERNS.some((re) => re.test(error))) return 'offline';
  if (SERVICE_PATTERNS.some((re) => re.test(error))) return 'service-unavailable';

  return 'none';
}

/**
 * Returns a human-readable message for each network error type.
 *
 * Exported for unit testing.
 */
export function networkErrorMessage(type: NetworkErrorType): string {
  switch (type) {
    case 'offline':
      return 'No internet connection. Check your network and try again.';
    case 'service-unavailable':
      return 'Stellar Testnet services appear unavailable. Please try again shortly.';
    default:
      return '';
  }
}

/**
 * Hook that derives network status from the wallet store error string.
 *
 * Usage:
 * ```tsx
 * const { networkErrorType, message } = useNetworkStatus(error);
 * ```
 */
export function useNetworkStatus(error: string | null): {
  networkErrorType: NetworkErrorType;
  message: string;
} {
  const networkErrorType = classifyNetworkError(error);
  const message = networkErrorMessage(networkErrorType);
  return { networkErrorType, message };
}
