import { classifyNetworkError } from './useNetworkStatus';
import type { NetworkState } from '../types/network';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AppState = { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) };
  return RN;
});

jest.mock('./useOnlineStatus', () => ({
  useOnlineStatus: jest.fn(),
}));

jest.mock('../services/stellar', () => ({
  checkNetworkPassphrase: jest.fn(),
}));

import { useOnlineStatus } from './useOnlineStatus';
import { checkNetworkPassphrase } from '../services/stellar';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useNetworkState } from './useNetworkState';

const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<typeof useOnlineStatus>;
const mockCheckNetworkPassphrase = checkNetworkPassphrase as jest.MockedFunction<typeof checkNetworkPassphrase>;

function setupOnlineStatus(overrides: Partial<{ isOnline: boolean; isChecking: boolean }> = {}) {
  mockUseOnlineStatus.mockReturnValue({
    isOnline: true,
    isChecking: false,
    checkNow: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckNetworkPassphrase.mockResolvedValue(true);
});

describe('useNetworkState', () => {
  it('returns online when isOnline and no error', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('online');
    });
    expect(result.current.disableWriteActions).toBe(false);
  });

  it('returns offline when isOnline is false', async () => {
    setupOnlineStatus({ isOnline: false, isChecking: false });

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });
    expect(result.current.disableWriteActions).toBe(true);
  });

  it('returns service-unavailable when online with service error', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });

    const { result } = renderHook(() =>
      useNetworkState({ error: 'Horizon returned 503 Service Unavailable' }),
    );
    
    await waitFor(() => {
      expect(result.current.state).toBe('service-unavailable');
    });
    expect(result.current.disableWriteActions).toBe(true);
  });

  it('returns degraded when online with offline-pattern error', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });

    const { result } = renderHook(() =>
      useNetworkState({ error: 'Network request failed' }),
    );
    
    await waitFor(() => {
      expect(result.current.state).toBe('degraded');
    });
    expect(result.current.disableWriteActions).toBe(false);
  });

  it('returns unknown when checking and no error', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: true });

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('unknown');
    });
  });

  it('returns online when checking finishes with no error', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('online');
    });
  });

  it('offline takes priority over service error', async () => {
    setupOnlineStatus({ isOnline: false, isChecking: false });

    const { result } = renderHook(() =>
      useNetworkState({ error: 'Horizon returned 503' }),
    );
    
    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });
  });

  it('returns wrong-network when online but checkNetworkPassphrase returns false', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });
    mockCheckNetworkPassphrase.mockResolvedValue(false);

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('wrong-network');
    });
    expect(result.current.disableWriteActions).toBe(true);
  });

  it('returns online when online and checkNetworkPassphrase throws/fails', async () => {
    setupOnlineStatus({ isOnline: true, isChecking: false });
    mockCheckNetworkPassphrase.mockRejectedValue(new Error('Horizon root call failed'));

    const { result } = renderHook(() => useNetworkState());
    
    await waitFor(() => {
      expect(result.current.state).toBe('online');
    });
    expect(result.current.disableWriteActions).toBe(false);
  });
});
