/**
 * PendingTransactionQueue – component tests
 *
 * Acceptance criteria covered:
 *  AC-PTQ1 – Shows all pending transactions from the wallet store.
 *  AC-PTQ2 – Displays a count badge with the number of pending items.
 *  AC-PTQ3 – Shows an empty state when there are no pending transactions.
 *  AC-PTQ4 – Refresh button calls onRefresh callback.
 *  AC-PTQ5 – Refresh button is disabled while isRefreshing is true.
 *  AC-PTQ6 – Shows safe guidance text explaining pending status.
 *  AC-PTQ7 – Does not offer retry actions (unsafe retry messaging is avoided).
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useWalletStore } from '../src/store/walletStore';

jest.mock('lucide-react-native', () => ({
  RefreshCw: () => null,
  Clock: () => null,
  CheckCircle: () => null,
}));

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

jest.mock('../src/components/PendingTransactionItem', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    PendingTransactionItem: ({ transaction }: any) => (
      <View testID="pending-transaction-item">
        <Text>{transaction.id}</Text>
      </View>
    ),
  };
});

import { PendingTransactionQueue } from '../src/components/PendingTransactionQueue';

const PENDING_TX_1 = {
  id: 'hash1',
  from: 'GPUBLIC_KEY',
  to: 'GDEST1',
  amount: '10.0000000',
  status: 'pending' as const,
  created_at: new Date(Date.now() - 120_000).toISOString(),
};

const PENDING_TX_2 = {
  id: 'hash2',
  from: 'GPUBLIC_KEY',
  to: 'GDEST2',
  amount: '20.0000000',
  status: 'pending' as const,
  created_at: new Date(Date.now() - 300_000).toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useWalletStore.setState({
    publicKey: 'GPUBLIC_KEY',
    pendingTransactions: {},
    transactions: [],
    isLoading: false,
    error: null,
  });
});

// ── AC-PTQ1: Shows all pending transactions ───────────────────────────────────

describe('AC-PTQ1 – shows all pending transactions', () => {
  it('renders a PendingTransactionItem for each pending transaction', () => {
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
        hash2: PENDING_TX_2,
      },
    });

    const { getAllByTestId } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(getAllByTestId('pending-transaction-item')).toHaveLength(2);
  });
});

// ── AC-PTQ2: Count badge ──────────────────────────────────────────────────────

describe('AC-PTQ2 – count badge', () => {
  it('shows the count of pending transactions', () => {
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
        hash2: PENDING_TX_2,
      },
    });

    const { getByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(getByText('2')).toBeTruthy();
  });

  it('does not show a count badge when queue is empty', () => {
    useWalletStore.setState({
      pendingTransactions: {},
    });

    const { queryByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    // The only text "0" that could match is not in a count badge
    // (empty state text doesn't contain just a number)
    expect(queryByText('0')).toBeNull();
  });
});

// ── AC-PTQ3: Empty state ──────────────────────────────────────────────────────

describe('AC-PTQ3 – empty state', () => {
  it('renders the empty state when there are no pending transactions', () => {
    useWalletStore.setState({
      pendingTransactions: {},
    });

    const { getByTestId, getByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(getByTestId('pending-queue-empty')).toBeTruthy();
    expect(getByText('All caught up')).toBeTruthy();
  });

  it('does not render the empty state when there are pending items', () => {
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
      },
    });

    const { queryByTestId } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(queryByTestId('pending-queue-empty')).toBeNull();
  });
});

// ── AC-PTQ4: Refresh button ───────────────────────────────────────────────────

describe('AC-PTQ4 – refresh button', () => {
  it('calls onRefresh when the refresh button is pressed', () => {
    const onRefresh = jest.fn();
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
      },
    });

    const { getByTestId } = render(
      <PendingTransactionQueue onRefresh={onRefresh} />
    );

    fireEvent.press(getByTestId('pending-queue-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not show refresh button when queue is empty', () => {
    const onRefresh = jest.fn();
    useWalletStore.setState({
      pendingTransactions: {},
    });

    const { queryByTestId } = render(
      <PendingTransactionQueue onRefresh={onRefresh} />
    );

    expect(queryByTestId('pending-queue-refresh')).toBeNull();
  });
});

// ── AC-PTQ5: Refresh disabled while refreshing ────────────────────────────────

describe('AC-PTQ5 – refresh disabled while refreshing', () => {
  it('disables the refresh button when isRefreshing is true', () => {
    const onRefresh = jest.fn();
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
      },
    });

    const { getByTestId } = render(
      <PendingTransactionQueue onRefresh={onRefresh} isRefreshing={true} />
    );

    fireEvent.press(getByTestId('pending-queue-refresh'));
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

// ── AC-PTQ6: Guidance text ────────────────────────────────────────────────────

describe('AC-PTQ6 – guidance text', () => {
  it('shows guidance text when there are pending items', () => {
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
      },
    });

    const { getByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(
      getByText(/These transactions have been submitted/)
    ).toBeTruthy();
  });

  it('does not show guidance text when queue is empty', () => {
    useWalletStore.setState({
      pendingTransactions: {},
    });

    const { queryByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    expect(queryByText(/These transactions have been submitted/)).toBeNull();
  });
});

// ── AC-PTQ7: No retry actions ─────────────────────────────────────────────────

describe('AC-PTQ7 – no retry actions', () => {
  it('does not contain any retry button or action', () => {
    useWalletStore.setState({
      pendingTransactions: {
        hash1: PENDING_TX_1,
      },
    });

    const { queryByText } = render(
      <PendingTransactionQueue onRefresh={jest.fn()} />
    );

    // No retry/resend/try again button should exist
    expect(queryByText(/retry/i)).toBeNull();
    expect(queryByText(/resend/i)).toBeNull();
    expect(queryByText(/try again/i)).toBeNull();
  });
});
