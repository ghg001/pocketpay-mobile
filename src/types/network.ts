/**
 * Network state model for PocketPay mobile.
 *
 * Distinguishes between five connectivity states so the UI can render
 * distinct banners, disable write-actions appropriately, and preserve
 * cached data when the network is unavailable.
 *
 * State hierarchy (best → worst):
 *   online → degraded → service-unavailable → offline → unknown
 */

/**
 * The high-level network connectivity state.
 *
 * - `online`:              Device has internet and Stellar Horizon is reachable.
 * - `degraded`:            Device has internet but Horizon responses are slow or
 *                          intermittent. Read-only cached data is safe to show;
 *                          write-actions should warn the user.
 * - `service-unavailable`: Stellar Horizon or Friendbot is returning server errors
 *                          (5xx, rate-limit). The device itself has connectivity.
 * - `offline`:             Device has no internet connectivity at all.
 * - `unknown`:             Connectivity has not been checked yet (e.g. app boot).
 */
export type NetworkState =
  | 'online'
  | 'degraded'
  | 'service-unavailable'
  | 'offline'
  | 'wrong-network'
  | 'unknown';

/** User-facing copy for each network state. */
export interface NetworkStateCopy {
  bannerMessage: string;
  bannerIcon: 'wifi-off' | 'alert-triangle' | 'cloud-off' | 'help-circle';
  /** Whether the banner should be rendered at all. */
  showBanner: boolean;
  /** Whether write-actions (send, vault deposit) should be disabled. */
  disableWriteActions: boolean;
  /** Short label for the retry button, or undefined if retry is irrelevant. */
  retryLabel?: string;
}

/**
 * Returns user-facing copy for each network state.
 * Safe to render directly — no raw error messages are surfaced.
 */
export function describeNetworkState(state: NetworkState): NetworkStateCopy {
  switch (state) {
    case 'online':
      return {
        bannerMessage: '',
        bannerIcon: 'help-circle',
        showBanner: false,
        disableWriteActions: false,
      };
    case 'degraded':
      return {
        bannerMessage:
          'Network connection is unstable. Some actions may fail — try again shortly.',
        bannerIcon: 'alert-triangle',
        showBanner: true,
        disableWriteActions: false,
        retryLabel: 'Retry',
      };
    case 'service-unavailable':
      return {
        bannerMessage:
          'Stellar network services are unavailable. Your funds are safe — try again shortly.',
        bannerIcon: 'cloud-off',
        showBanner: true,
        disableWriteActions: true,
        retryLabel: 'Retry',
      };
    case 'offline':
      return {
        bannerMessage:
          'You are offline. Check your connection and try again.',
        bannerIcon: 'wifi-off',
        showBanner: true,
        disableWriteActions: true,
        retryLabel: 'Retry',
      };
    case 'wrong-network':
      return {
        bannerMessage:
          'Connected to the wrong blockchain network. Please check your settings.',
        bannerIcon: 'alert-triangle',
        showBanner: true,
        disableWriteActions: true,
        retryLabel: 'Retry',
      };
    case 'unknown':
      return {
        bannerMessage: 'Checking network connection…',
        bannerIcon: 'help-circle',
        showBanner: false,
        disableWriteActions: false,
      };
  }
}
