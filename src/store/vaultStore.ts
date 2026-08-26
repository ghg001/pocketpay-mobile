import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isVaultConfigured,
  getVaultContractId,
  getVaultBalance,
  depositToVault,
  withdrawFromVault,
} from '../services/vault';
import {
  mockFetchVaultBalance,
  mockDepositToVault,
  mockWithdrawFromVault,
} from '../services/stellar';
import {
  createWithdrawalError,
  evaluateWithdrawalEligibility,
  toWithdrawalErrorCode,
} from '../features/vault/maturedLockWithdrawal';
import { classifyVaultError, type VaultRecoveryGuidance } from '../utils/vaultErrors';

const LOCKS_KEY = '@pocketpay_vault_locks';

export interface Lock {
  id: string;
  amount: string;
  unlockDate: string;
  status: 'locked' | 'matured';
  createdAt: string;
}

interface VaultState {
  balance: string;
  locks: Lock[];
  isConfigured: boolean;
  contractId: string;
  isLoadingBalance: boolean;
  isLoadingLocks: boolean;
  isSubmitting: boolean;
  balanceError: string | null;
  /** Classified recovery guidance for the most recent vault action failure. */
  vaultError: VaultRecoveryGuidance | null;

  loadBalance: (publicKey: string) => Promise<void>;
  loadLocks: () => Promise<void>;
  addLock: (amount: string, unlockDate: string) => Promise<void>;
  unlockLock: (lockId: string) => Promise<void>;
  deposit: (secretKey: string, publicKey: string, amount: string) => Promise<string | null>;
  withdraw: (secretKey: string, publicKey: string, amount: string) => Promise<string | null>;
  /** Clear the current vault error state. */
  clearVaultError: () => void;
  /**
   * Withdraw a single matured lock back to the wallet.
   *
   * Re-checks eligibility at submission time, moves the funds, then drops the
   * lock — the lock is only removed once the transfer resolves, so a failure
   * leaves the vault untouched. Rejects with a `VaultWithdrawalError`.
   */
  withdrawMaturedLock: (
    lockId: string,
    params: { publicKey: string | null; getSecretKey: () => Promise<string | null> }
  ) => Promise<MaturedLockWithdrawalResult>;
}

export interface MaturedLockWithdrawalResult {
  /** Withdrawn amount in XLM, echoed back for the success screen. */
  amount: string;
  /** On-chain transaction hash, or null when no contract is configured. */
  hash: string | null;
  /**
   * True when no vault contract is configured and the withdrawal ran against
   * the local placeholder rather than the network.
   */
  isPreview: boolean;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  balance: '0.0000000',
  locks: [],
  isConfigured: isVaultConfigured(),
  contractId: getVaultContractId(),
  isLoadingBalance: false,
  isLoadingLocks: false,
  isSubmitting: false,
  balanceError: null,
  vaultError: null,

  clearVaultError: () => set({ vaultError: null }),

  loadBalance: async (publicKey: string) => {
    set({ isLoadingBalance: true, balanceError: null });
    try {
      const balance = get().isConfigured
        ? await getVaultBalance(publicKey)
        : await mockFetchVaultBalance(publicKey);
      set({ balance, isLoadingBalance: false });
    } catch (err: any) {
      set({
        isLoadingBalance: false,
        balanceError: err.message || 'Failed to load vault balance',
      });
    }
  },

  loadLocks: async () => {
    set({ isLoadingLocks: true });
    try {
      const locksJson = await AsyncStorage.getItem(LOCKS_KEY);
      let locks: Lock[] = locksJson ? JSON.parse(locksJson) : [];
      
      // Update lock statuses based on current time
      const now = new Date();
      locks = locks.map(lock => {
        const unlockDate = new Date(lock.unlockDate);
        const status = now >= unlockDate ? 'matured' : 'locked';
        return { ...lock, status };
      });
      
      set({ locks, isLoadingLocks: false });
    } catch (err: any) {
      console.error('Failed to load locks:', err);
      set({ locks: [], isLoadingLocks: false });
    }
  },

  addLock: async (amount: string, unlockDate: string) => {
    set({ isSubmitting: true, vaultError: null });
    try {
      const newLock: Lock = {
        id: Date.now().toString(),
        amount,
        unlockDate,
        status: 'locked',
        createdAt: new Date().toISOString(),
      };
      
      const updatedLocks = [...get().locks, newLock];
      await AsyncStorage.setItem(LOCKS_KEY, JSON.stringify(updatedLocks));
      set({ locks: updatedLocks });
    } catch (err: unknown) {
      set({ vaultError: classifyVaultError(err) });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  unlockLock: async (lockId: string) => {
    set({ isSubmitting: true, vaultError: null });
    try {
      const updatedLocks = get().locks.filter(lock => lock.id !== lockId);
      await AsyncStorage.setItem(LOCKS_KEY, JSON.stringify(updatedLocks));
      set({ locks: updatedLocks });
    } catch (err: unknown) {
      set({ vaultError: classifyVaultError(err) });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },



  // Returns the transaction hash on-chain, or null in mock mode.
  deposit: async (secretKey: string, publicKey: string, amount: string) => {
    set({ isSubmitting: true, vaultError: null });
    try {
      let hash: string | null = null;
      if (get().isConfigured) {
        hash = await depositToVault(secretKey, amount);
      } else {
        await mockDepositToVault(secretKey, amount);
      }
      await get().loadBalance(publicKey);
      return hash;
    } catch (err: unknown) {
      set({ vaultError: classifyVaultError(err) });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  withdraw: async (secretKey: string, publicKey: string, amount: string) => {
    set({ isSubmitting: true, vaultError: null });
    try {
      let hash: string | null = null;
      if (get().isConfigured) {
        hash = await withdrawFromVault(secretKey, amount);
      } else {
        await mockWithdrawFromVault(secretKey, amount);
      }
      await get().loadBalance(publicKey);
      return hash;
    } catch (err: unknown) {
      set({ vaultError: classifyVaultError(err) });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  withdrawMaturedLock: async (lockId, { publicKey, getSecretKey }) => {
    const lock = get().locks.find((candidate) => candidate.id === lockId);
    if (!lock) throw createWithdrawalError('lock-not-found');

    // Eligibility is re-derived here rather than trusted from the UI: the lock
    // may have been opened before it matured, or the screen may be stale.
    const eligibility = evaluateWithdrawalEligibility(lock, { publicKey });
    if (!eligibility.isEligible) {
      throw createWithdrawalError(eligibility.reason ?? 'unknown', eligibility.message);
    }

    const isConfigured = get().isConfigured;
    set({ isSubmitting: true, vaultError: null });
    try {
      let hash: string | null = null;

      if (isConfigured) {
        const secretKey = await getSecretKey();
        if (!secretKey) throw createWithdrawalError('secret-unavailable');
        hash = await withdrawFromVault(secretKey, lock.amount);
      } else {
        // No contract configured: run the local placeholder so the flow is
        // exercisable end to end without moving anything on the network.
        await mockWithdrawFromVault('', lock.amount);
      }

      // Only drop the lock once the funds have actually moved.
      const remainingLocks = get().locks.filter((candidate) => candidate.id !== lockId);
      await AsyncStorage.setItem(LOCKS_KEY, JSON.stringify(remainingLocks));
      set({ locks: remainingLocks });

      if (publicKey) {
        await get().loadBalance(publicKey);
      }

      return { amount: lock.amount, hash, isPreview: !isConfigured };
    } catch (error) {
      throw createWithdrawalError(
        toWithdrawalErrorCode(error),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
