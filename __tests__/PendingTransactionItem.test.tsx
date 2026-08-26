/**
 * PendingTransactionItem – component tests
 *
 * Acceptance criteria covered:
 *  AC-PTI1 – Shows the correct direction label ("Sent XLM" vs "Received XLM").
 *  AC-PTI2 – Displays the formatted amount with +/– prefix.
 *  AC-PTI3 – Shows a "Pending" StatusBadge.
 *  AC-PTI4 – Shows relative time since submission (e.g. "2 min ago").
 *  AC-PTI5 – Displays the transaction type tag (Payment / Vault).
 *  AC-PTI6 – Does not crash with missing fields.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('lucide-react-native', () => ({
  ArrowUpRight: () => null,
  ArrowDownLeft: () => null,
  Clock: () => null,
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

import { PendingTransactionItem } from '../src/components/PendingTransactionItem';

const SENT_TX = {
  id: 'hash123',
  from: 'GPUBLIC_KEY',
  to: 'GDESTINATION_KEY',
  amount: '10.0000000',
  asset: 'XLM',
  type: 'payment',
  created_at: new Date(Date.now() - 120_000).toISOString(), // 2 min ago
  status: 'pending',
};

const RECEIVED_TX = {
  id: 'hash456',
  from: 'GSENDER_KEY',
  to: 'GPUBLIC_KEY',
  amount: '25.5000000',
  asset: 'XLM',
  type: 'payment',
  created_at: new Date(Date.now() - 3_600_000).toISOString(), // 1 hr ago
  status: 'pending',
};

const VAULT_TX = {
  id: 'hash789',
  from: 'GPUBLIC_KEY',
  to: 'GVAULT_CONTRACT',
  amount: '100.0000000',
  type: 'invoke_host_function',
  is_vault: true,
  created_at: new Date(Date.now() - 86_400_000).toISOString(), // 1 day ago
  status: 'pending',
};

const MINIMAL_TX = {
  id: 'hash_minimal',
  status: 'pending',
};

// ── AC-PTI1: Direction label ──────────────────────────────────────────────────

describe('AC-PTI1 – direction label', () => {
  it('shows "Sent XLM" for outgoing transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('Sent XLM')).toBeTruthy();
  });

  it('shows "Received XLM" for incoming transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={RECEIVED_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('Received XLM')).toBeTruthy();
  });
});

// ── AC-PTI2: Formatted amount ─────────────────────────────────────────────────

describe('AC-PTI2 – formatted amount', () => {
  it('shows -10.0000000 for sent transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('-10 XLM')).toBeTruthy();
  });

  it('shows +25.5 XLM for received transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={RECEIVED_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('+25.5 XLM')).toBeTruthy();
  });

  it('shows a dash when amount is missing', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={MINIMAL_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('—')).toBeTruthy();
  });
});

// ── AC-PTI3: Status badge ─────────────────────────────────────────────────────

describe('AC-PTI3 – status badge', () => {
  it('renders a "Pending" badge', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('Pending')).toBeTruthy();
  });
});

// ── AC-PTI4: Relative time ────────────────────────────────────────────────────

describe('AC-PTI4 – relative time', () => {
  it('shows "2 min ago" for a 2-minute-old transaction', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('2 min ago')).toBeTruthy();
  });

  it('shows "1 hr ago" for a 1-hour-old transaction', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={RECEIVED_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('1 hr ago')).toBeTruthy();
  });

  it('shows "1d ago" for a 1-day-old transaction', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={VAULT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('1d ago')).toBeTruthy();
  });

  it('shows "just now" when created_at is missing', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={MINIMAL_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('just now')).toBeTruthy();
  });
});

// ── AC-PTI5: Type tag ─────────────────────────────────────────────────────────

describe('AC-PTI5 – type tag', () => {
  it('shows "Payment" for standard payment transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('Payment')).toBeTruthy();
  });

  it('shows "Vault" for invoke_host_function transactions', () => {
    const { getByText } = render(
      <PendingTransactionItem
        transaction={VAULT_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByText('Vault')).toBeTruthy();
  });
});

// ── AC-PTI6: Does not crash with missing fields ───────────────────────────────

describe('AC-PTI6 – does not crash with missing fields', () => {
  it('renders without crashing when only id and status are present', () => {
    const { getByTestId } = render(
      <PendingTransactionItem
        transaction={MINIMAL_TX}
        currentPublicKey="GPUBLIC_KEY"
      />
    );
    expect(getByTestId('pending-transaction-item')).toBeTruthy();
  });

  it('renders without crashing when currentPublicKey is null', () => {
    const { getByTestId } = render(
      <PendingTransactionItem
        transaction={SENT_TX}
        currentPublicKey={null}
      />
    );
    expect(getByTestId('pending-transaction-item')).toBeTruthy();
  });
});
