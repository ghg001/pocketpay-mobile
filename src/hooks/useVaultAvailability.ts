import { useMemo } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useVaultStore } from '../store/vaultStore';
import {
  evaluateVaultAvailability,
  VaultAvailability,
} from '../utils/vaultAvailability';

/**
 * Reactive hook that returns the current vault availability state.
 * Re-evaluates whenever the wallet or vault store changes.
 */
export function useVaultAvailability(): VaultAvailability {
  const publicKey = useWalletStore((s) => s.publicKey);
  const isConfigured = useVaultStore((s) => s.isConfigured);

  return useMemo(
    () =>
      evaluateVaultAvailability({
        publicKey,
        isVaultConfigured: isConfigured,
        vaultEnabledFlag: process.env.EXPO_PUBLIC_VAULT_ENABLED,
      }),
    [publicKey, isConfigured]
  );
}
