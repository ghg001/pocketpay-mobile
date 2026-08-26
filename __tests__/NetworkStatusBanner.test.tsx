/**
 * NetworkStatusBanner – component tests
 *
 * Acceptance criteria covered:
 *  AC-NB1 – Banner is not rendered when state is 'online'.
 *  AC-NB2 – Banner is rendered for 'offline'.
 *  AC-NB3 – Banner is rendered for 'service-unavailable'.
 *  AC-NB4 – Banner is rendered for 'wrong-network'.
 *  AC-NB5 – Retry button calls onRetry when tapped.
 *  AC-NB6 – Retry button is disabled while isRetrying is true.
 *  AC-NB7 – App does not crash when rendered with any valid state.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('lucide-react-native', () => ({
  WifiOff: () => null,
  AlertTriangle: () => null,
  CloudOff: () => null,
  RefreshCw: () => null,
}));

import { NetworkStatusBanner } from '../src/components/NetworkStatusBanner';

// ─── AC-NB1: Hidden when online ────────────────────────────────────────────

describe('AC-NB1 – not rendered when state is online', () => {
  it('returns null when state is "online"', () => {
    const { queryByTestId } = render(
      <NetworkStatusBanner
        state="online"
        onRetry={jest.fn()}
      />
    );
    expect(queryByTestId('network-status-banner')).toBeNull();
  });
});

// ─── AC-NB2: Offline banner ───────────────────────────────────────────────────

describe('AC-NB2 – offline banner', () => {
  it('renders the banner and message when state is "offline"', () => {
    const { getByTestId, getByText } = render(
      <NetworkStatusBanner
        state="offline"
        onRetry={jest.fn()}
      />
    );
    expect(getByTestId('network-status-banner')).toBeTruthy();
    expect(getByText(/You are offline/i)).toBeTruthy();
  });
});

// ─── AC-NB3: Service-unavailable banner ──────────────────────────────────────

describe('AC-NB3 – service-unavailable banner', () => {
  it('renders the banner and message when state is "service-unavailable"', () => {
    const { getByTestId, getByText } = render(
      <NetworkStatusBanner
        state="service-unavailable"
        onRetry={jest.fn()}
      />
    );
    expect(getByTestId('network-status-banner')).toBeTruthy();
    expect(getByText(/Stellar network services are unavailable/i)).toBeTruthy();
  });
});

// ─── AC-NB4: Wrong-network banner ────────────────────────────────────────────

describe('AC-NB4 – wrong-network banner', () => {
  it('renders the banner and message when state is "wrong-network"', () => {
    const { getByTestId, getByText } = render(
      <NetworkStatusBanner
        state="wrong-network"
        onRetry={jest.fn()}
      />
    );
    expect(getByTestId('network-status-banner')).toBeTruthy();
    expect(getByText(/Connected to the wrong blockchain network/i)).toBeTruthy();
  });
});

// ─── AC-NB5: Retry callback ───────────────────────────────────────────────────

describe('AC-NB5 – retry button calls onRetry', () => {
  it('calls onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <NetworkStatusBanner
        state="offline"
        onRetry={onRetry}
      />
    );
    fireEvent.press(getByTestId('network-status-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

// ─── AC-NB6: Retry disabled while retrying ───────────────────────────────────

describe('AC-NB6 – retry button is disabled while isRetrying', () => {
  it('renders retry button as disabled when isRetrying is true', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <NetworkStatusBanner
        state="offline"
        onRetry={onRetry}
        isRetrying={true}
      />
    );
    const retryBtn = getByTestId('network-status-retry');
    fireEvent.press(retryBtn);
    expect(onRetry).not.toHaveBeenCalled();
  });
});

// ─── AC-NB7: Does not crash ───────────────────────────────────────────────────

describe('AC-NB7 – does not crash with any valid state', () => {
  it('renders without crashing for "offline"', () => {
    expect(() =>
      render(
        <NetworkStatusBanner
          state="offline"
          onRetry={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it('renders without crashing for "service-unavailable"', () => {
    expect(() =>
      render(
        <NetworkStatusBanner
          state="service-unavailable"
          onRetry={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it('renders without crashing for "wrong-network"', () => {
    expect(() =>
      render(
        <NetworkStatusBanner
          state="wrong-network"
          onRetry={jest.fn()}
        />
      )
    ).not.toThrow();
  });

  it('renders without crashing for "online"', () => {
    expect(() =>
      render(
        <NetworkStatusBanner
          state="online"
          onRetry={jest.fn()}
        />
      )
    ).not.toThrow();
  });
});
