import { useVaultStore, Lock } from '../store/vaultStore';

export type { Lock };

export function useVault() {
  const {
    balance,
    locks,
    isConfigured,
    contractId,
    isLoadingBalance,
    isLoadingLocks,
    isSubmitting,
    balanceError,
    vaultError,
    loadBalance,
    loadLocks,
    addLock,
    unlockLock,
    deposit,
    withdraw,
    withdrawMaturedLock,
    clearVaultError,
  } = useVaultStore();

  const findLock = (id: string) => locks.find(lock => lock.id === id);

  return {
    balance,
    locks,
    isConfigured,
    contractId,
    isLoadingBalance,
    isLoadingLocks,
    isSubmitting,
    balanceError,
    vaultError,
    loadBalance,
    loadLocks,
    addLock,
    unlockLock,
    deposit,
    withdraw,
    withdrawMaturedLock,
    clearVaultError,
    findLock,
  };
}
