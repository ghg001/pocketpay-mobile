/**
 * useVaultCapabilities
 *
 * Reactive hook that evaluates which vault actions are currently supported.
 * Combines wallet state, vault configuration, and feature flags into a
 * per-action capability map that the UI uses to disable/hide actions.
 *
 * Usage:
 * ```tsx
 * const capabilities = useVaultCapabilities();
 * const canDeposit = capabilities.deposit.status === 'supported';
 * ```
 */

import { useMemo } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useVaultStore } from '../store/vaultStore';
import {
  evaluateVaultCapabilities,
  VaultCapabilityInput,
} from '../utils/vaultCapabilities';
import type { VaultCapabilities } from '../types/vault';

export function useVaultCapabilities(): VaultCapabilities & {
  /** True while any capability check is still loading. */
  isLoading: boolean;
} {
  const publicKey = useWalletStore((s) => s.publicKey);
  const isConfigured = useVaultStore((s) => s.isConfigured);
  const isLoadingBalance = useVaultStore((s) => s.isLoadingBalance);
  const isLoadingLocks = useVaultStore((s) => s.isLoadingLocks);

  return useMemo(() => {
    const input: VaultCapabilityInput = {
      hasWallet: publicKey !== null,
      isContractConfigured: isConfigured,
      isFeatureEnabled: true, // Feature flag check; defaults to true
      isSdkReady: true, // SDK readiness; assumed true until SDK integration
      isLoading: isLoadingBalance || isLoadingLocks,
    };

    const capabilities = evaluateVaultCapabilities(input);
    return {
      ...capabilities,
      isLoading: input.isLoading,
    };
  }, [publicKey, isConfigured, isLoadingBalance, isLoadingLocks]);
}
