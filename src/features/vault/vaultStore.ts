import { create } from 'zustand';
import {
  mockFetchVaultBalance,
  mockFetchVaultMaturedLocks,
  mockWithdrawFromVault,
} from '../../services/stellar';

export interface MaturedLock {
  id: string;
  amount: string;
  unlockedAt: string; // ISO date string
}

export type WithdrawalType = 'available' | 'matured';

interface VaultState {
  vaultBalance: string;
  maturedLocks: MaturedLock[];
  isWithdrawing: boolean;
  withdrawalError: string | null;
  selectedWithdrawalType: WithdrawalType | null;
  selectedLockId: string | null;

  // Actions
  fetchVaultDetails: (publicKey: string) => Promise<void>;
  initiateWithdrawal: (type: WithdrawalType, lockId?: string) => void;
  confirmWithdrawal: (secretKey: string) => Promise<boolean>;
  cancelWithdrawal: () => void;
  resetError: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultBalance: '0.0000000',
  maturedLocks: [],
  isWithdrawing: false,
  withdrawalError: null,
  selectedWithdrawalType: null,
  selectedLockId: null,

  fetchVaultDetails: async (publicKey: string) => {
    try {
      const [balance, locks] = await Promise.all([
        mockFetchVaultBalance(publicKey),
        mockFetchVaultMaturedLocks(publicKey),
      ]);
      set({ vaultBalance: balance, maturedLocks: locks, withdrawalError: null });
    } catch (e: any) {
      set({ withdrawalError: e.message || 'Failed to load vault details' });
    }
  },

  initiateWithdrawal: (type: WithdrawalType, lockId?: string) => {
    set({
      selectedWithdrawalType: type,
      selectedLockId: lockId ?? null,
      withdrawalError: null,
    });
  },

  confirmWithdrawal: async (secretKey: string) => {
    const { selectedWithdrawalType, selectedLockId, vaultBalance, maturedLocks } = get();

    if (!selectedWithdrawalType) {
      set({ withdrawalError: 'No withdrawal type selected' });
      return false;
    }

    let amount: string;

    if (selectedWithdrawalType === 'available') {
      amount = vaultBalance;
      if (parseFloat(amount) <= 0) {
        set({ withdrawalError: 'No available balance to withdraw' });
        return false;
      }
    } else if (selectedWithdrawalType === 'matured') {
      if (!selectedLockId) {
        set({ withdrawalError: 'No lock selected for withdrawal' });
        return false;
      }
      const lock = maturedLocks.find((l) => l.id === selectedLockId);
      if (!lock) {
        set({ withdrawalError: 'Selected lock not found' });
        return false;
      }
      amount = lock.amount;
    } else {
      set({ withdrawalError: 'Invalid withdrawal type' });
      return false;
    }

    set({ isWithdrawing: true, withdrawalError: null });

    try {
      await mockWithdrawFromVault(secretKey, amount);
      set({
        isWithdrawing: false,
        selectedWithdrawalType: null,
        selectedLockId: null,
        vaultBalance: selectedWithdrawalType === 'available'
          ? '0.0000000'
          : get().vaultBalance,
        maturedLocks: selectedWithdrawalType === 'matured'
          ? get().maturedLocks.filter((l) => l.id !== selectedLockId)
          : get().maturedLocks,
      });
      return true;
    } catch (e: any) {
      set({
        isWithdrawing: false,
        withdrawalError: e.message || 'Withdrawal failed',
      });
      return false;
    }
  },

  cancelWithdrawal: () => {
    set({
      selectedWithdrawalType: null,
      selectedLockId: null,
      withdrawalError: null,
    });
  },

  resetError: () => set({ withdrawalError: null }),
}));
