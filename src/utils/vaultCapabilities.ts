/**
 * Vault capability checks — determines which vault actions are currently
 * supported based on configuration, contract state, and wallet state.
 *
 * Each vault action (deposit, withdraw, lock, unlock) is individually gated so
 * partially-configured setups still work for the subset they support.
 *
 * SDK capability assumptions are documented in
 * docs/vault-sdk-capability-assumptions.md.
 */

import type {
  VaultActionCapability,
  VaultCapabilities,
  VaultAction,
} from '../types/vault';

export interface VaultCapabilityInput {
  /** Whether a wallet is loaded (publicKey is non-null). */
  hasWallet: boolean;
  /** Whether a Soroban vault contract is configured (env var is set). */
  isContractConfigured: boolean;
  /** Whether the vault feature flag is enabled (EXPO_PUBLIC_VAULT_ENABLED). */
  isFeatureEnabled: boolean;
  /** Whether the SDK reports vault readiness. True until the SDK is integrated. */
  isSdkReady: boolean;
  /** Whether a capability check is still in progress. */
  isLoading: boolean;
}

/**
 * Default capability input used when the SDK is not yet integrated.
 * Assumes the SDK is ready until a real SDK signal arrives.
 */
export const DEFAULT_CAPABILITY_INPUT: VaultCapabilityInput = {
  hasWallet: false,
  isContractConfigured: false,
  isFeatureEnabled: true,
  isSdkReady: true,
  isLoading: true,
};

/**
 * Evaluate deposit capability.
 *
 * Deposit requires:
 *   - A wallet (publicKey) to fund from
 *   - The vault feature to be enabled
 *   - The SDK/backend to be ready
 *
 * Deposit works in both mock and configured modes.
 */
function evaluateDepositCapability(
  input: VaultCapabilityInput
): VaultActionCapability {
  if (input.isLoading) return { status: 'loading' };
  if (!input.isFeatureEnabled) {
    return {
      status: 'unsupported',
      reason: 'Vault feature is disabled',
      detail: 'The vault feature has been turned off. Enable it in settings or via EXPO_PUBLIC_VAULT_ENABLED.',
    };
  }
  if (!input.hasWallet) {
    return {
      status: 'unsupported',
      reason: 'No wallet available',
      detail: 'Create or import a wallet before depositing into the vault.',
    };
  }
  if (!input.isSdkReady) {
    return {
      status: 'unsupported',
      reason: 'Vault backend not ready',
      detail: 'The Soroban Savings Vault contract or SDK is not yet available. Try again later.',
    };
  }
  return { status: 'supported' };
}

/**
 * Evaluate withdraw capability.
 *
 * Withdraw has the same requirements as deposit, plus:
 *   - The contract should be configured (otherwise it's preview mode)
 *     We allow withdrawal even in mock mode with a warning.
 */
function evaluateWithdrawCapability(
  input: VaultCapabilityInput
): VaultActionCapability {
  if (input.isLoading) return { status: 'loading' };
  if (!input.isFeatureEnabled) {
    return {
      status: 'unsupported',
      reason: 'Vault feature is disabled',
      detail: 'The vault feature has been turned off.',
    };
  }
  if (!input.hasWallet) {
    return {
      status: 'unsupported',
      reason: 'No wallet available',
      detail: 'Create or import a wallet before withdrawing from the vault.',
    };
  }
  if (!input.isSdkReady) {
    return {
      status: 'unsupported',
      reason: 'Vault backend not ready',
      detail: 'The vault SDK or contract is not yet available.',
    };
  }
  return { status: 'supported' };
}

/**
 * Evaluate lock creation capability.
 *
 * Creating a time-lock requires the same as deposit. The lock is stored
 * locally in AsyncStorage regardless of contract configuration.
 */
function evaluateLockCapability(
  input: VaultCapabilityInput
): VaultActionCapability {
  if (input.isLoading) return { status: 'loading' };
  if (!input.isFeatureEnabled) {
    return {
      status: 'unsupported',
      reason: 'Vault feature is disabled',
      detail: 'The vault feature has been turned off.',
    };
  }
  if (!input.hasWallet) {
    return {
      status: 'unsupported',
      reason: 'No wallet available',
      detail: 'Create or import a wallet before creating a time-lock.',
    };
  }
  if (!input.isSdkReady) {
    return {
      status: 'unsupported',
      reason: 'Vault backend not ready',
      detail: 'The vault SDK or contract is not yet available.',
    };
  }
  return { status: 'supported' };
}

/**
 * Evaluate matured-lock withdrawal (unlock) capability.
 *
 * Unlock requires the same as withdrawal.
 */
function evaluateUnlockCapability(
  input: VaultCapabilityInput
): VaultActionCapability {
  if (input.isLoading) return { status: 'loading' };
  if (!input.isFeatureEnabled) {
    return {
      status: 'unsupported',
      reason: 'Vault feature is disabled',
      detail: 'The vault feature has been turned off.',
    };
  }
  if (!input.hasWallet) {
    return {
      status: 'unsupported',
      reason: 'No wallet available',
      detail: 'Create or import a wallet before withdrawing matured locks.',
    };
  }
  if (!input.isSdkReady) {
    return {
      status: 'unsupported',
      reason: 'Vault backend not ready',
      detail: 'The vault SDK or contract is not yet available.',
    };
  }
  return { status: 'supported' };
}

/**
 * Evaluate all vault capabilities at once.
 */
export function evaluateVaultCapabilities(
  input: VaultCapabilityInput
): VaultCapabilities {
  return {
    deposit: evaluateDepositCapability(input),
    withdraw: evaluateWithdrawCapability(input),
    lock: evaluateLockCapability(input),
    unlock: evaluateUnlockCapability(input),
  };
}

/**
 * Check if a specific action is supported.
 */
export function isActionSupported(
  capabilities: VaultCapabilities,
  action: VaultAction
): boolean {
  return capabilities[action].status === 'supported';
}

/**
 * Get the reason an action is unsupported, or null if supported/loading.
 */
export function getActionUnsupportedReason(
  capabilities: VaultCapabilities,
  action: VaultAction
): string | null {
  const cap = capabilities[action];
  return cap.status === 'unsupported' ? cap.reason : null;
}

/**
 * Get the detail for an unsupported action, or null if supported/loading.
 */
export function getActionUnsupportedDetail(
  capabilities: VaultCapabilities,
  action: VaultAction
): string | null {
  const cap = capabilities[action];
  return cap.status === 'unsupported' ? (cap.detail ?? null) : null;
}
