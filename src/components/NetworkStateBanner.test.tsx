import React from 'react';
import { render } from '@testing-library/react-native';
import { NetworkStateBanner } from './NetworkStateBanner';
import type { NetworkState } from '../types/network';

jest.mock('lucide-react-native', () => ({
  WifiOff: () => null,
  AlertTriangle: () => null,
  CloudOff: () => null,
  RefreshCw: () => null,
}));

describe('NetworkStateBanner', () => {
  it('renders nothing for online state', () => {
    const { queryByTestId } = render(
      <NetworkStateBanner state="online" />,
    );
    expect(queryByTestId('network-state-banner')).toBeNull();
  });

  it('renders nothing for unknown state', () => {
    const { queryByTestId } = render(
      <NetworkStateBanner state="unknown" />,
    );
    expect(queryByTestId('network-state-banner')).toBeNull();
  });

  it('renders banner for offline state', () => {
    const { getByTestId, getByText } = render(
      <NetworkStateBanner state="offline" onRetry={jest.fn()} />,
    );
    expect(getByTestId('network-state-banner')).toBeTruthy();
    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('renders banner for degraded state', () => {
    const { getByTestId, getByText } = render(
      <NetworkStateBanner state="degraded" onRetry={jest.fn()} />,
    );
    expect(getByTestId('network-state-banner')).toBeTruthy();
    expect(getByText(/unstable/i)).toBeTruthy();
  });

  it('renders banner for service-unavailable state', () => {
    const { getByTestId, getByText } = render(
      <NetworkStateBanner state="service-unavailable" onRetry={jest.fn()} />,
    );
    expect(getByTestId('network-state-banner')).toBeTruthy();
    expect(getByText(/unavailable/i)).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    const { getByTestId } = render(
      <NetworkStateBanner state="offline" onRetry={jest.fn()} />,
    );
    expect(getByTestId('network-state-retry')).toBeTruthy();
  });

  it('does not render retry button when onRetry is not provided', () => {
    const { queryByTestId } = render(
      <NetworkStateBanner state="offline" />,
    );
    expect(queryByTestId('network-state-retry')).toBeNull();
  });
});
