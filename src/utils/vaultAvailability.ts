/**
 * Vault availability — centralised readiness checks.
 *
 * Determines whether the vault tab should render its interactive UI or
 * show the "unavailable" state. Each check is a named reason so the UI
 * can display targeted guidance.
 *
 * SDK capability assumptions are documented in
 * docs/vault-sdk-capability-assumptions.md.
 */

export type VaultUnavailableReason =
  | 'no-wallet'           // No wallet loaded (publicKey is null)
  | 'feature-disabled'    // EXPO_PUBLIC_VAULT_ENABLED is explicitly 'false'
  | 'sdk-not-ready';      // Future: SDK reports vault capability as missing

export interface VaultAvailability {
  /** True when the vault UI should be fully interactive. */
  isAvailable: boolean;
  /** Set only when isAvailable is false. */
  reasons: VaultUnavailableReason[];
  /** Whether a live Soroban contract is configured (independent of availability). */
  isContractConfigured: boolean;
}

export interface VaultAvailabilityInput {
  publicKey: string | null;
  isVaultConfigured: boolean;
  /** Env-var feature toggle; defaults to true when unset. */
  vaultEnabledFlag?: string;
}

/**
 * Evaluate whether the vault is available for interaction.
 *
 * Pure function — all dependencies are injected so unit tests
 * don't need to mock process.env or store hooks.
 */
export function evaluateVaultAvailability(
  input: VaultAvailabilityInput
): VaultAvailability {
  const reasons: VaultUnavailableReason[] = [];

  // 1. Feature flag gate
  const flagValue = (input.vaultEnabledFlag ?? 'true').trim().toLowerCase();
  if (flagValue === 'false' || flagValue === '0') {
    reasons.push('feature-disabled');
  }

  // 2. Wallet gate
  if (!input.publicKey) {
    reasons.push('no-wallet');
  }

  // 3. Future: SDK capability gate
  // When the PocketPay SDK exposes a readiness signal, add an
  // 'sdk-not-ready' check here. See docs/vault-sdk-capability-assumptions.md.

  return {
    isAvailable: reasons.length === 0,
    reasons,
    isContractConfigured: input.isVaultConfigured,
  };
}

export interface UnavailableReasonCopy {
  title: string;
  message: string;
  hint?: string;
}

/** Map a reason code to user-facing copy. */
export function describeUnavailableReason(
  reason: VaultUnavailableReason
): UnavailableReasonCopy {
  switch (reason) {
    case 'no-wallet':
      return {
        title: 'No wallet connected',
        message: 'Create or import a wallet to use the Soroban Savings Vault.',
        hint: 'Go to Settings → Create Wallet or Import Wallet.',
      };
    case 'feature-disabled':
      return {
        title: 'Vault feature disabled',
        message:
          'The vault is currently disabled by configuration. This may be temporary while the backend is being updated.',
        hint: 'EXPO_PUBLIC_VAULT_ENABLED is set to false.',
      };
    case 'sdk-not-ready':
      return {
        title: 'Vault backend not ready',
        message:
          'The Soroban Savings Vault contract or SDK is not yet available. Vault actions will be enabled once the backend integration is complete.',
        hint: 'See docs/vault-sdk-capability-assumptions.md for details.',
      };
  }
}
