import React from 'react';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import type { NetworkState } from '../types/network';

interface NetworkStateBannerProps {
  /** The current network state. */
  state: NetworkState;
  /** Called when the user taps the Retry button. */
  onRetry?: () => void;
  /** True while a re-check or refresh is in flight. */
  isRetrying?: boolean;
}

export const NetworkStateBanner: React.FC<NetworkStateBannerProps> = ({
  state,
  onRetry,
  isRetrying = false,
}: NetworkStateBannerProps) => {
  return (
    <NetworkStatusBanner
      state={state}
      onRetry={onRetry}
      isRetrying={isRetrying}
      testID="network-state-banner"
      retryTestID="network-state-retry"
    />
  );
};
