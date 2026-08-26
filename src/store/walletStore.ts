import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StellarSdk from '@stellar/stellar-sdk';
import { fetchXlmBalance, fetchTransactionsPage, fetchAccountDetails, fundWithFriendbot, PaymentRecord } from '../services/stellar';
import type { BalanceState, FundingStatus } from '../types/balance';
import {
  CLEAR_WALLET_ERROR,
  PERSIST_WALLET_ERROR,
  READ_WALLET_ERROR,
  RESTORE_WALLET_ERROR,
} from '../utils/walletStorageErrors';

const WALLET_KEY = 'pocketpay_wallet_secret';
// Tracks whether the post-creation backup reminder has been acknowledged.
// Persisted (not just in-memory) so the reminder survives an app kill that
// happens after wallet creation but before the user dismisses the modal —
// otherwise the in-memory `showBackupReminder` flag resets to false on the
// next launch and the user never sees the warning again.
const BACKUP_ACK_KEY = '@pocketpay_backup_acknowledged';
const DEFAULT_BALANCE = '0.0000000';
const TX_PAGE_SIZE = 20;

// Transaction records from the Stellar Horizon API – use a flexible type
// until a proper typed SDK wrapper is available.
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionRecord = Record<string, any> & { id: string; status?: TransactionStatus };

interface WalletState {
  publicKey: string | null;
  balance: string;
  transactions: TransactionRecord[];
  // Optimistic entries for sends that resolved locally but haven't shown up in a
  // Horizon refresh yet, keyed by transaction hash so concurrent sends don't
  // overwrite each other. Reconciled (dropped) in refreshWalletData once the real
  // record appears; unreconciled entries just stay pending indefinitely.
  pendingTransactions: Record<string, TransactionRecord>;
  lastRefreshed: number | null;
  isLoading: boolean;
  isFunding: boolean;
  fundError: string | null;
  error: string | null;
  showBackupReminder: boolean;
  /** True once the initial `loadWalletFromStorage` call has resolved (success or failure). */
  walletChecked: boolean;

  // ---- Issue #329: Balance state ----
  /** Tracks the lifecycle of the balance fetch — not just its value. */
  balanceState: BalanceState;

  // ---- Issue #330: Account funding status ----
  /** Whether the account exists on the Stellar network. */
  fundingStatus: FundingStatus;

  // Pagination
  isLoadingMore: boolean;
  hasMoreTransactions: boolean;
  nextCursor: string | null;

  // Pagination
  nextCursor: string | null;
  hasMoreTransactions: boolean;
  isLoadingMore: boolean;

  // Actions
  setWallet: (publicKey: string, secretKey: string) => Promise<boolean>;
  loadWalletFromStorage: () => Promise<boolean>;
  /** Pull-to-refresh: resets pagination and loads the first page fresh. */
  refreshWalletData: () => Promise<void>;
  /** Optimistically show a just-submitted transaction as pending, keyed by hash. */
  addPendingTransaction: (hash: string, tx: Record<string, any> & { id: string }) => void;
  loadMoreTransactions: () => Promise<void>;
  clearWallet: () => Promise<boolean>;
  getSecretKey: () => Promise<string | null>;
  fundWallet: () => Promise<void>;
  /** Marks the backup reminder as pending (shown) and persists that state. */
  markBackupPending: () => Promise<void>;
  /** Marks the backup reminder as acknowledged and persists that state. */
  acknowledgeBackupReminder: () => Promise<void>;
  /** Check whether the account exists on the Stellar network (funding check). */
  checkFundingStatus: () => Promise<void>;
}

const resetWalletState = () => ({
  publicKey: null,
  balance: DEFAULT_BALANCE,
  transactions: [],
  pendingTransactions: {},
  lastRefreshed: null,
  isLoadingMore: false,
  hasMoreTransactions: false,
  nextCursor: null,
  balanceState: 'idle' as BalanceState,
  fundingStatus: 'unknown' as FundingStatus,
});

const parseStoredSecret = (storedValue: string): string | null => {
  const trimmedValue = storedValue.trim();
  if (!trimmedValue) return null;

  if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmedValue);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        typeof parsed.secretKey === 'string' &&
        parsed.secretKey.trim()
      ) {
        return parsed.secretKey.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  return trimmedValue;
};

const clearStoredSecrets = async () => {
  try {
    await SecureStore.deleteItemAsync(WALLET_KEY);
  } catch {
    console.warn('Failed to clear invalid wallet storage');
  }
};

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: null,
  balance: DEFAULT_BALANCE,
  transactions: [],
  pendingTransactions: {},
  lastRefreshed: null,
  isLoading: false,
  isFunding: false,
  fundError: null,
  error: null,
  balanceState: 'idle' as BalanceState,
  fundingStatus: 'unknown' as FundingStatus,
  isLoadingMore: false,
  hasMoreTransactions: false,
  nextCursor: null,
  showBackupReminder: false,
  walletChecked: false,

  markBackupPending: async () => {
    set({ showBackupReminder: true });
    try {
      await AsyncStorage.setItem(BACKUP_ACK_KEY, 'false');
    } catch {
      console.warn('Failed to persist backup reminder state');
    }
  },

  acknowledgeBackupReminder: async () => {
    set({ showBackupReminder: false });
    try {
      await AsyncStorage.setItem(BACKUP_ACK_KEY, 'true');
    } catch {
      console.warn('Failed to persist backup reminder state');
    }
  },

  setWallet: async (publicKey: string, secretKey: string) => {
    try {
      await SecureStore.setItemAsync(WALLET_KEY, secretKey);
      set({ publicKey, balance: DEFAULT_BALANCE, transactions: [], pendingTransactions: {}, error: null });
      return true;
    } catch {
      console.error(PERSIST_WALLET_ERROR);
      set({ ...resetWalletState(), error: PERSIST_WALLET_ERROR });
      return false;
    }
  },

  loadWalletFromStorage: async () => {
    let storedValue: string | null = null;
    try {
      storedValue = await SecureStore.getItemAsync(WALLET_KEY);
    } catch {
      console.error(RESTORE_WALLET_ERROR);
      set({ ...resetWalletState(), error: RESTORE_WALLET_ERROR, walletChecked: true });
      return false;
    }

    if (storedValue === null) {
      set({ ...resetWalletState(), error: null, walletChecked: true });
      return false;
    }

    const secretKey = parseStoredSecret(storedValue);
    if (!secretKey) {
      await clearStoredSecrets();
      set({ ...resetWalletState(), error: RESTORE_WALLET_ERROR, walletChecked: true });
      return false;
    }

    try {
      const keypair = StellarSdk.Keypair.fromSecret(secretKey);

      // Re-show the backup reminder if it was left pending from a previous
      // session (e.g. the app was killed before the user acknowledged it).
      let showBackupReminder = false;
      try {
        showBackupReminder = (await AsyncStorage.getItem(BACKUP_ACK_KEY)) === 'false';
      } catch {
        // Non-critical: default to not re-showing the reminder on read failure.
      }

      set({ publicKey: keypair.publicKey(), error: null, showBackupReminder, walletChecked: true });
      return true;
    } catch {
      console.error(RESTORE_WALLET_ERROR);
      await clearStoredSecrets();
      set({ ...resetWalletState(), error: RESTORE_WALLET_ERROR, walletChecked: true });
      return false;
    }
  },

  refreshWalletData: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    set({ isLoading: true, error: null, balanceState: 'loading', isLoadingMore: false, nextCursor: null, hasMoreTransactions: false });
    try {
      const [balance, page] = await Promise.all([
        fetchXlmBalance(publicKey),
        fetchTransactionsPage(publicKey, TX_PAGE_SIZE),
      ]);

      // Reconcile: drop any optimistic pending entry whose hash now shows up in the
      // real Horizon response, so it isn't displayed twice. Operation records
      // expose the transaction hash as `transaction_hash`. Entries that don't
      // reconcile here are left showing as pending — no forced expiry. Read
      // pendingTransactions fresh (not before the await above) so an entry added
      // while this refresh was in flight doesn't get silently dropped.
      const confirmedHashes = new Set(
        page.records.map((tx: any) => tx.transaction_hash).filter(Boolean)
      );
      const remainingPending = Object.fromEntries(
        Object.entries(get().pendingTransactions).filter(([hash]) => !confirmedHashes.has(hash))
      );

      const isZero = balance === '0.0000000';
      set({
        balance,
        transactions: [...Object.values(remainingPending), ...page.records],
        pendingTransactions: remainingPending,
        nextCursor: page.nextCursor,
        hasMoreTransactions: page.hasMore,
        lastRefreshed: Date.now(),
        isLoading: false,
        balanceState: 'available',
        // Also update funding status: if we got balance data, the account exists
        fundingStatus: 'funded',
      });
    } catch (err: any) {
      console.error('Failed to refresh wallet data');
      set({
        isLoading: false,
        balanceState: 'unavailable',
        error: err.message || 'Failed to sync data',
      });
    }
  },

  addPendingTransaction: (hash, tx) => {
    const pendingRecord: TransactionRecord = { ...tx, status: 'pending' };
    set((state) => ({
      pendingTransactions: { ...state.pendingTransactions, [hash]: pendingRecord },
      transactions: [pendingRecord, ...state.transactions],
    }));
  },

  loadMoreTransactions: async () => {
    const { publicKey, isLoadingMore, hasMoreTransactions, nextCursor, transactions } = get();

    // Guard: nothing to do if already loading or no more pages.
    if (!publicKey || isLoadingMore || !hasMoreTransactions || !nextCursor) return;

    set({ isLoadingMore: true, error: null });
    try {
      const page = await fetchTransactionsPage(publicKey, TX_PAGE_SIZE, nextCursor);

      // Deduplicate: build a set of existing IDs then filter the new records.
      const existingIds = new Set(transactions.map((tx) => tx.id));
      const newRecords = (page.records as TransactionRecord[]).filter(
        (tx) => !existingIds.has(tx.id)
      );

      set({
        transactions: [...transactions, ...newRecords],
        nextCursor: page.nextCursor,
        hasMoreTransactions: page.hasMore,
        isLoadingMore: false,
      });
    } catch (err: any) {
      console.error('Failed to load more transactions:', err);
      set({ isLoadingMore: false, error: err.message || 'Failed to load more' });
    }
  },

  clearWallet: async () => {
    try {
      await SecureStore.deleteItemAsync(WALLET_KEY);
      set({ ...resetWalletState(), showBackupReminder: false, error: null });
      try {
        await AsyncStorage.removeItem(BACKUP_ACK_KEY);
      } catch {
        // Non-critical: a stale flag only affects the reminder's re-show behavior.
      }
      return true;
    } catch {
      console.error(CLEAR_WALLET_ERROR);
      set({ error: CLEAR_WALLET_ERROR });
      return false;
    }
  },

  getSecretKey: async () => {
    let value: string | null = null;
    try {
      value = await SecureStore.getItemAsync(WALLET_KEY);
    } catch {
      console.error(READ_WALLET_ERROR);
      set({ error: READ_WALLET_ERROR });
      return null;
    }

    if (value === null) return null;

    const secretKey = parseStoredSecret(value);
    if (!secretKey) {
      console.error(READ_WALLET_ERROR);
      await clearStoredSecrets();
      set({ error: READ_WALLET_ERROR });
      return null;
    }

    try {
      StellarSdk.Keypair.fromSecret(secretKey);
      set({ error: null });
      return secretKey;
    } catch {
      console.error(READ_WALLET_ERROR);
      await clearStoredSecrets();
      set({ error: READ_WALLET_ERROR });
      return null;
    }
  },

  fundWallet: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    set({ isFunding: true, fundError: null });
    try {
      await fundWithFriendbot(publicKey);
      // Refresh balance after successful funding
      await get().refreshWalletData();
      set({ isFunding: false, fundingStatus: 'funded' });
    } catch (err: any) {
      console.error('Friendbot funding failed:', err);
      set({ isFunding: false, fundError: err.message || 'Funding failed. Please try again.' });
    }
  },

  checkFundingStatus: async () => {
    const { publicKey } = get();
    if (!publicKey) {
      set({ fundingStatus: 'unknown' });
      return;
    }

    set({ fundingStatus: 'checking' });
    try {
      await fetchAccountDetails(publicKey);
      // Account exists on the network
      set({ fundingStatus: 'funded' });
    } catch (err: any) {
      const message = err?.message || '';
      if (/not found|404/i.test(message)) {
        // Account doesn't exist yet — not funded
        set({ fundingStatus: 'unfunded' });
      } else {
        // Network error — we can't determine the status
        console.error('Failed to check funding status:', err);
        set({ fundingStatus: 'unknown' });
      }
    }
  },
}));
