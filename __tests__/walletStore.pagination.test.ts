/**
 * walletStore – Pagination Logic Tests
 *
 * Acceptance criteria covered:
 *  AC-S1 – refreshWalletData resets pagination state and loads the first page.
 *  AC-S2 – loadMoreTransactions appends the next page of older transactions.
 *  AC-S3 – loadMoreTransactions deduplicates records that already exist.
 *  AC-S4 – loadMoreTransactions is a no-op when hasMoreTransactions is false.
 *  AC-S5 – loadMoreTransactions is a no-op when isLoadingMore is already true.
 *  AC-S6 – loadMoreTransactions is a no-op when nextCursor is null.
 *  AC-S7 – hasMoreTransactions is set to false when the last page is returned.
 *  AC-S8 – errors from the service are captured in the error field.
 */

import { act } from 'react-test-renderer';

// The real store is created via zustand; we test the real implementation
// but mock the stellar service so no network calls are made.
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeTx = (id: string, pagingToken: string = id) => ({
  id,
  type: 'payment',
  created_at: '2024-01-01T00:00:00Z',
  amount: '10.0000000',
  asset_type: 'native',
  paging_token: pagingToken,
});

const PAGE_1 = [makeTx('tx1', 'pt1'), makeTx('tx2', 'pt2')];
const PAGE_2 = [makeTx('tx3', 'pt3'), makeTx('tx4', 'pt4')];

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Reset the zustand store to its initial state between tests.
  useWalletStore.setState({
    publicKey: 'GPUBLIC123',
    balance: '0.0000000',
    transactions: [],
    isLoading: false,
    isLoadingMore: false,
    hasMoreTransactions: false,
    nextCursor: null,
    error: null,
  });

  mockFetchXlmBalance.mockResolvedValue('100.0000000');
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S1 – refreshWalletData resets pagination and loads first page
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S1 – refreshWalletData', () => {
  it('loads the first page and stores nextCursor when more pages exist', async () => {
    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: PAGE_1 as any,
      nextCursor: 'cursor-after-page1',
      hasMore: true,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    expect(state.transactions).toHaveLength(2);
    expect(state.transactions[0].id).toBe('tx1');
    expect(state.nextCursor).toBe('cursor-after-page1');
    expect(state.hasMoreTransactions).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.balance).toBe('100.0000000');
  });

  it('sets hasMoreTransactions to false when no more pages exist', async () => {
    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: PAGE_1 as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    expect(state.hasMoreTransactions).toBe(false);
    expect(state.nextCursor).toBeNull();
  });

  it('resets the transaction list when called a second time (pull-to-refresh)', async () => {
    // Seed some pre-existing transactions in the store.
    useWalletStore.setState({ transactions: [makeTx('old1') as any] });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: PAGE_1 as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    // Old tx should be gone; only PAGE_1 records remain.
    expect(state.transactions.map((t) => t.id)).toEqual(['tx1', 'tx2']);
  });

  it('calls fetchTransactionsPage without a cursor on first load', async () => {
    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: [],
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    expect(mockFetchTransactionsPage).toHaveBeenCalledWith('GPUBLIC123', 20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S2 – loadMoreTransactions appends the next page
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S2 – loadMoreTransactions appends next page', () => {
  it('appends PAGE_2 after PAGE_1 and updates nextCursor', async () => {
    // Pre-load the store as if PAGE_1 was already fetched.
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor-after-page1',
      hasMoreTransactions: true,
    });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: PAGE_2 as any,
      nextCursor: 'cursor-after-page2',
      hasMore: true,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    const state = useWalletStore.getState();
    expect(state.transactions).toHaveLength(4);
    expect(state.transactions.map((t) => t.id)).toEqual(['tx1', 'tx2', 'tx3', 'tx4']);
    expect(state.nextCursor).toBe('cursor-after-page2');
    expect(state.hasMoreTransactions).toBe(true);
    expect(state.isLoadingMore).toBe(false);
  });

  it('passes the correct cursor to fetchTransactionsPage', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'my-cursor',
      hasMoreTransactions: true,
    });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: [],
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    expect(mockFetchTransactionsPage).toHaveBeenCalledWith('GPUBLIC123', 20, 'my-cursor');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S3 – Deduplication
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S3 – deduplication', () => {
  it('does not add duplicate transactions when the same record appears again', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor',
      hasMoreTransactions: true,
    });

    // PAGE_2 overlaps with tx2 from PAGE_1.
    const overlappingPage = [makeTx('tx2', 'pt2'), makeTx('tx5', 'pt5')];

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: overlappingPage as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    const state = useWalletStore.getState();
    // tx2 is not duplicated; only tx5 is new.
    expect(state.transactions.map((t) => t.id)).toEqual(['tx1', 'tx2', 'tx5']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S4 – Guard: hasMoreTransactions is false
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S4 – no-op when hasMoreTransactions is false', () => {
  it('does not call fetchTransactionsPage when hasMoreTransactions is false', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor',
      hasMoreTransactions: false,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    expect(mockFetchTransactionsPage).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S5 – Guard: already loading more
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S5 – no-op when isLoadingMore is true', () => {
  it('does not call fetchTransactionsPage when already loading more', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor',
      hasMoreTransactions: true,
      isLoadingMore: true,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    expect(mockFetchTransactionsPage).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S6 – Guard: nextCursor is null
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S6 – no-op when nextCursor is null', () => {
  it('does not call fetchTransactionsPage when nextCursor is null', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: null,
      hasMoreTransactions: true,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    expect(mockFetchTransactionsPage).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S7 – End-of-list state
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S7 – end-of-list state', () => {
  it('sets hasMoreTransactions to false when the last page is returned', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor',
      hasMoreTransactions: true,
    });

    mockFetchTransactionsPage.mockResolvedValueOnce({
      records: PAGE_2 as any,
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    const state = useWalletStore.getState();
    expect(state.hasMoreTransactions).toBe(false);
    expect(state.nextCursor).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-S8 – Error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-S8 – error handling', () => {
  it('captures service errors in the error field and clears isLoadingMore', async () => {
    useWalletStore.setState({
      transactions: PAGE_1 as any,
      nextCursor: 'cursor',
      hasMoreTransactions: true,
    });

    mockFetchTransactionsPage.mockRejectedValueOnce(new Error('Network failure'));

    await act(async () => {
      await useWalletStore.getState().loadMoreTransactions();
    });

    const state = useWalletStore.getState();
    expect(state.error).toBe('Network failure');
    expect(state.isLoadingMore).toBe(false);
  });

  it('captures refreshWalletData errors in the error field and clears isLoading', async () => {
    mockFetchXlmBalance.mockRejectedValueOnce(new Error('Horizon down'));

    await act(async () => {
      await useWalletStore.getState().refreshWalletData();
    });

    const state = useWalletStore.getState();
    expect(state.error).toBe('Horizon down');
    expect(state.isLoading).toBe(false);
  });
});
