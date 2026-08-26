/**
 * useNetworkStatus – unit tests
 *
 * Acceptance criteria covered:
 *  AC-NS1 – Offline device messages are classified as 'offline'.
 *  AC-NS2 – Stellar/Horizon/Friendbot service errors are classified as 'service-unavailable'.
 *  AC-NS3 – Null and unrelated errors return 'none'.
 *  AC-NS4 – Human-readable messages are correct for each type.
 *  AC-NS5 – The hook derives type and message together.
 */

import { classifyNetworkError, networkErrorMessage, useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { renderHook } from '@testing-library/react-native';

// ─── AC-NS1: Offline patterns ─────────────────────────────────────────────────

describe('AC-NS1 – offline patterns', () => {
  it.each([
    'Network request failed',
    'network request failed',
    'Network error',
    'Network Error occurred',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'No internet connection',
    'Unable to connect',
    'Failed to fetch',
    'Network is unavailable',
    'Network is down',
  ])('classifies "%s" as offline', (message) => {
    expect(classifyNetworkError(message)).toBe('offline');
  });
});

// ─── AC-NS2: Service-unavailable patterns ─────────────────────────────────────

describe('AC-NS2 – service-unavailable patterns', () => {
  it.each([
    'Horizon returned 503',
    'Friendbot error: Service Unavailable',
    'Testnet is under maintenance',
    'Stellar network response error',
    'Service Unavailable',
    'Too many requests',
    'Rate limit exceeded',
    'rate-limit hit',
    'Bad Gateway',
    'Gateway Timeout',
    'Error 502 received',
    'Error 503 received',
    'Error 504 received',
  ])('classifies "%s" as service-unavailable', (message) => {
    expect(classifyNetworkError(message)).toBe('service-unavailable');
  });
});

// ─── AC-NS3: None / unrelated ─────────────────────────────────────────────────

describe('AC-NS3 – none for null and unrelated errors', () => {
  it('returns "none" for null', () => {
    expect(classifyNetworkError(null)).toBe('none');
  });

  it.each([
    'Account not found',
    'Insufficient balance',
    'Transaction failed',
    'Invalid secret key',
    'Failed to persist wallet securely',
  ])('returns "none" for unrelated error "%s"', (message) => {
    expect(classifyNetworkError(message)).toBe('none');
  });
});

// ─── AC-NS4: Human-readable messages ─────────────────────────────────────────

describe('AC-NS4 – human-readable messages', () => {
  it('returns an offline message for "offline" type', () => {
    const msg = networkErrorMessage('offline');
    expect(msg).toContain('internet');
  });

  it('returns a service message for "service-unavailable" type', () => {
    const msg = networkErrorMessage('service-unavailable');
    expect(msg).toContain('Stellar');
  });

  it('returns an empty string for "none" type', () => {
    expect(networkErrorMessage('none')).toBe('');
  });
});

// ─── AC-NS5: Hook integration ─────────────────────────────────────────────────

describe('AC-NS5 – hook derives type and message together', () => {
  it('returns offline type and message when error matches offline pattern', () => {
    const { result } = renderHook(() =>
      useNetworkStatus('Network request failed')
    );
    expect(result.current.networkErrorType).toBe('offline');
    expect(result.current.message).toBeTruthy();
  });

  it('returns service-unavailable type and message for Horizon errors', () => {
    const { result } = renderHook(() =>
      useNetworkStatus('Horizon returned 503')
    );
    expect(result.current.networkErrorType).toBe('service-unavailable');
    expect(result.current.message).toBeTruthy();
  });

  it('returns none and empty message for null error', () => {
    const { result } = renderHook(() => useNetworkStatus(null));
    expect(result.current.networkErrorType).toBe('none');
    expect(result.current.message).toBe('');
  });

  it('returns none and empty message for unrelated error', () => {
    const { result } = renderHook(() =>
      useNetworkStatus('Insufficient balance')
    );
    expect(result.current.networkErrorType).toBe('none');
    expect(result.current.message).toBe('');
  });
});
