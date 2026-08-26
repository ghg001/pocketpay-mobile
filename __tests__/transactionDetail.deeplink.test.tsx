import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useWalletStore } from '../src/store/walletStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchOperationById } from '../src/services/stellar';
import TransactionDetailScreen from '../app/transaction/[id]';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseRouterFn = jest.fn(() => ({
  back: mockBack,
  push: mockPush,
  replace: jest.fn(),
}));
const mockUseLocalSearchParamsFn = jest.fn(() => ({ id: 'tx1' }));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));
jest.mock('../src/store/walletStore');
jest.mock('../src/store/appStore', () => {
  const mockUseAppStore = jest.fn((selector) => {
    const mockState = {
      contacts: [],
    };
    return selector ? selector(mockState) : mockState;
  });
  return {
    normalizePublicKey: (key: string) => key.trim().toUpperCase(),
    useAppStore: mockUseAppStore,
  };
});
jest.mock('expo-router', () => ({
  useRouter: () => mockUseRouterFn(),
  useLocalSearchParams: () => mockUseLocalSearchParamsFn(),
  Stack: {
    Screen: () => null,
  },
}));
jest.mock('lucide-react-native', () => ({
  Copy: () => null,
  Check: () => null,
  ArrowLeft: () => null,
  ArrowUpRight: () => null,
  ArrowDownLeft: () => null,
  ExternalLink: () => null,
  AlertCircle: () => null,
  Clock: () => null,
  CheckCircle: () => null,
  XCircle: () => null,
  RefreshCw: () => null,
}));

jest.mock('../src/services/stellar', () => ({
  getExplorerTxUrl: jest.fn((hash: string | null) => {
    if (!hash) return null;
    return `https://stellar.expert/explorer/testnet/tx/${hash}`;
  }),
  fetchOperationById: jest.fn(),
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockUseRouter = mockUseRouterFn;
const mockUseLocalSearchParams = mockUseLocalSearchParamsFn;
const mockFetchOperationById = fetchOperationById as jest.MockedFunction<typeof fetchOperationById>;

const mockTx = {
  id: 'tx1',
  type: 'payment',
  from: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  to: 'GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD',
  amount: '50.0000000',
  asset: 'XLM',
  created_at: '2024-01-15T10:30:00Z',
  hash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd',
  transaction_successful: true,
  is_pending: false,
};

const mockFetchedTx = {
  id: 'deep-link-tx',
  type: 'payment',
  from: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  to: 'GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD',
  amount: '25.0000000',
  asset: 'XLM',
  created_at: '2024-02-20T14:00:00Z',
  hash: 'f789abc012f789abc012f789abc012f789abc012f789abc012f789abc012f789a',
  transaction_successful: true,
  is_pending: false,
};

function setupStore(overrides: Record<string, unknown> = {}) {
  mockUseWalletStore.mockReturnValue({
    publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
    transactions: [mockTx],
    ...overrides,
  } as any);
}

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy.mockImplementation(() => undefined);
  mockUseRouter.mockReturnValue({ back: mockBack, push: mockPush, replace: jest.fn() } as any);
  mockUseLocalSearchParams.mockReturnValue({ id: 'tx1' });
  mockFetchOperationById.mockReset();
  setupStore();
});

describe('Transaction Detail — Deep Link Support', () => {
  describe('Transaction ID validation', () => {
    it('shows invalid state when id is empty', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: '' });
      const { getByText } = render(<TransactionDetailScreen />);
      expect(getByText('No transaction ID provided.')).toBeTruthy();
    });

    it('shows invalid state when id is undefined', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: undefined as any });
      const { getByText } = render(<TransactionDetailScreen />);
      expect(getByText('No transaction ID provided.')).toBeTruthy();
    });

    it('shows invalid state when id contains control characters', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: 'tx\n123' });
      const { getByText } = render(<TransactionDetailScreen />);
      expect(getByText('Transaction link contains invalid characters.')).toBeTruthy();
    });

    it('shows invalid state when id is too long', () => {
      mockUseLocalSearchParams.mockReturnValue({ id: 'x'.repeat(200) });
      const { getByText } = render(<TransactionDetailScreen />);
      expect(getByText('Transaction link is invalid (too long).')).toBeTruthy();
    });
  });

  describe('In-memory store lookup (existing behavior)', () => {
    it('renders transaction found in store without network fetch', () => {
      setupStore({ transactions: [mockTx] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'tx1' });

      const { getByTestId } = render(<TransactionDetailScreen />);
      expect(getByTestId('detail-amount').props.children).toContain('50 XLM');
      expect(mockFetchOperationById).not.toHaveBeenCalled();
    });
  });

  describe('Deep link network fetch', () => {
    it('fetches from network when id not in store', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'deep-link-tx' });
      mockFetchOperationById.mockResolvedValue(mockFetchedTx as any);

      const { getByTestId, getByText } = render(<TransactionDetailScreen />);

      // Should show loading state initially
      expect(getByText('Loading transaction…')).toBeTruthy();

      // After fetch, should render the transaction
      await waitFor(() => {
        expect(getByTestId('detail-amount').props.children).toContain('25 XLM');
      });
      expect(mockFetchOperationById).toHaveBeenCalledWith('deep-link-tx');
    });

    it('shows not found state when transaction not on network', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'nonexistent-tx' });
      mockFetchOperationById.mockResolvedValue(null);

      const { getByText } = render(<TransactionDetailScreen />);

      await waitFor(() => {
        expect(getByText('Transaction Not Found')).toBeTruthy();
      });
      expect(getByText(/doesn't exist on the network/)).toBeTruthy();
    });

    it('shows error state on network failure', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'network-error-tx' });
      mockFetchOperationById.mockRejectedValue(new Error('Network timeout'));

      const { getByText } = render(<TransactionDetailScreen />);

      await waitFor(() => {
        expect(getByText('Connection Error')).toBeTruthy();
      });
      expect(getByText(/Unable to load transaction/)).toBeTruthy();
    });

    it('retry button re-triggers network fetch', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'retry-tx' });
      mockFetchOperationById.mockResolvedValueOnce(null);

      const { getByTestId, getByText } = render(<TransactionDetailScreen />);

      await waitFor(() => {
        expect(getByText('Transaction Not Found')).toBeTruthy();
      });

      // Set up successful response for retry
      mockFetchOperationById.mockResolvedValueOnce(mockFetchedTx as any);

      const retryBtn = getByText('Try Again');
      fireEvent.press(retryBtn);

      await waitFor(() => {
        expect(getByText('Loading transaction…')).toBeTruthy();
      });

      await waitFor(() => {
        expect(getByTestId('detail-amount').props.children).toContain('25 XLM');
      });
      expect(mockFetchOperationById).toHaveBeenCalledTimes(2);
    });

    it('go back button navigates back from not found state', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'notfound-tx' });
      mockFetchOperationById.mockResolvedValue(null);

      const { getByText } = render(<TransactionDetailScreen />);

      await waitFor(() => {
        expect(getByText('Transaction Not Found')).toBeTruthy();
      });

      fireEvent.press(getByText('Go Back'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('go back button navigates back from error state', async () => {
      setupStore({ transactions: [] });
      mockUseLocalSearchParams.mockReturnValue({ id: 'err-tx' });
      mockFetchOperationById.mockRejectedValue(new Error('fail'));

      const { getByText } = render(<TransactionDetailScreen />);

      await waitFor(() => {
        expect(getByText('Connection Error')).toBeTruthy();
      });

      fireEvent.press(getByText('Go Back'));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Existing functionality preserved', () => {
    it('renders transaction details correctly from store', () => {
      const { getByTestId, getByText } = render(<TransactionDetailScreen />);
      expect(getByTestId('detail-amount').props.children).toContain('50 XLM');
      expect(getByText('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H')).toBeTruthy();
      expect(getByText('GDNOEY2L6EGCMAYNZWJN6K3K6TJJKAKNQJQJWY5HXLFY3LJQY7JJ6NVD')).toBeTruthy();
    });

    it('attempts network fetch when transaction not found in store', async () => {
      mockUseLocalSearchParams.mockReturnValue({ id: 'nonexistent' });
      mockFetchOperationById.mockResolvedValue(null);
      const { getByText } = render(<TransactionDetailScreen />);
      // Should attempt a network fetch since the ID is valid but not in store
      await waitFor(() => {
        expect(mockFetchOperationById).toHaveBeenCalledWith('nonexistent');
      });
    });

    it('displays successful transaction status', () => {
      setupStore({
        transactions: [{ ...mockTx, transaction_successful: true, is_pending: false }],
      });
      const { getAllByText } = render(<TransactionDetailScreen />);
      expect(getAllByText('Successful').length).toBeGreaterThan(0);
    });

    it('displays pending transaction status', () => {
      setupStore({
        transactions: [{ ...mockTx, is_pending: true }],
      });
      const { getAllByText } = render(<TransactionDetailScreen />);
      expect(getAllByText('Pending').length).toBeGreaterThan(0);
    });

    it('displays failed transaction status', () => {
      setupStore({
        transactions: [{ ...mockTx, transaction_successful: false, is_pending: false }],
      });
      const { getAllByText } = render(<TransactionDetailScreen />);
      expect(getAllByText('Failed').length).toBeGreaterThan(0);
    });
  });
});
