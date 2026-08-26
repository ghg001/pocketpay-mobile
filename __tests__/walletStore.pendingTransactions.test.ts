/**
 * walletStore – Optimistic Pending Transactions (issue #253)
 *
 *  AC-P1 – addPendingTransaction inserts an entry keyed by hash, visible in transactions.
 *  AC-P2 – concurrent pending entries with different hashes don't clobber each other.
 *  AC-P3 – refreshWalletData reconciles: a pending hash that comes back from Horizon
 *          is dropped from the optimistic map so it isn't shown twice.
 *  AC-P4 – an unreconciled pending entry stays visible as pending (soft, no expiry).
 */

import { act } from 'react-test-renderer';

jest.mock('../src/services/stellar');

jest.mock('@stellar/stellar-sdk', () => ({
  Keypair: { fromSecret: jest.fn(() => ({ publicKey: () => 'GPUBLIC123' })) },
  Horizon: { Server: jest.fn() },
  TransactionBuilder: jest.fn(),
  Operation: { payment: jest.fn() },
  Asset: { native: jest.fn() },
  Memo: { text: jest.fn() },
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

import { fetchTransactionsPage, fetchXlmBalance } from '../src/services/stellar';
import { useWalletStore } from '../src/store/walletStore';

const mockFetchTransactionsPage = fetchTransactionsPage as jest.MockedFunction<
  typeof fetchTransactionsPage
>;
const mockFetchXlmBalance = fetchXlmBalance as jest.MockedFunction<typeof fetchXlmBalance>;

beforeEach(() => {
  jest.clearAllMocks();
  useWalletStore.setState({
    publicKey: 'GPUBLIC123',
    balance: '0.0000000',
    transactions: [],
    pendingTransactions: {},
    isLoading: false,
    nextCursor: null,
    hasMoreTransactions: false,
    error: null,
  });
  mockFetchXlmBalance.mockResolvedValue('100.0000000');
});

describe('AC-P1 – addPendingTransaction', () => {
  it('inserts a pending entry keyed by hash and shows it in the transaction list', () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10.0000000' });

    const state = useWalletStore.getState();
    expect(state.pendingTransactions['hash1'].status).toBe('pending');
    expect(state.transactions[0].id).toBe('hash1');
    expect(state.transactions[0].status).toBe('pending');
  });
});

describe('AC-P2 – concurrent pending entries', () => {
  it('does not clobber a concurrent pending entry with a different hash', () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10' });
    useWalletStore.getState().addPendingTransaction('hash2', { id: 'hash2', amount: '20' });

    const state = useWalletStore.getState();
    expect(Object.keys(state.pendingTransactions).sort()).toEqual(['hash1', 'hash2']);
    expect(state.transactions.map((t) => t.id).sort()).toEqual(['hash1', 'hash2']);
  });
});

describe('AC-P3 – reconcile on refresh', () => {
  it('drops the optimistic entry once refresh brings back the same hash (no duplicate)', async () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10' });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: [{ id: 'op1', transaction_hash: 'hash1', amount: '10.0000000' }] as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    expect(state.pendingTransactions['hash1']).toBeUndefined();
    expect(
      state.transactions.filter((t) => t.id === 'hash1' || t.transaction_hash === 'hash1')
    ).toHaveLength(1);
  });

  it('reconciles using the hash field on the submit response, not the Horizon operation id', async () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10' });

    // Horizon's operation id differs from the transaction hash it belongs to.
    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: [{ id: 'some-other-operation-id', transaction_hash: 'hash1' }] as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    expect(useWalletStore.getState().pendingTransactions['hash1']).toBeUndefined();
  });
});

describe('AC-P2b – concurrent add during an in-flight refresh', () => {
  it('does not drop a pending transaction added while a refresh is in flight', async () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10' });

    let resolveFetch: (value: any) => void = () => {};
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockFetchTransactionsPage.mockReturnValueOnce(fetchPromise as any);

    const refreshPromise = useWalletStore.getState().refreshWalletData();

    // Simulate a second send completing while the first refresh is still in flight.
    useWalletStore.getState().addPendingTransaction('hash2', { id: 'hash2', amount: '20' });

    await act(async () => {
      resolveFetch({ records: [], nextCursor: null, hasMore: false });
      await refreshPromise;
    });

    const state = useWalletStore.getState();
    expect(state.pendingTransactions['hash2']).toBeDefined();
    expect(state.transactions.some((t) => t.id === 'hash2')).toBe(true);
  });
});

describe('AC-P4 – unreconciled pending entries stay visible', () => {
  it('keeps a pending entry when refresh does not bring back its hash yet', async () => {
    useWalletStore.getState().addPendingTransaction('hash1', { id: 'hash1', amount: '10' });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: [] as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    expect(state.pendingTransactions['hash1']).toBeDefined();
    expect(state.transactions.some((t) => t.id === 'hash1' && t.status === 'pending')).toBe(true);
  });
});
