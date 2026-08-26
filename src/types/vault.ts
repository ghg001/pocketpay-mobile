export type VaultActionState =
  | 'idle'
  | 'review'
  | 'signing'
  | 'submission'
  | 'pending'
  | 'confirmed'
  | 'failed';

export interface VaultActionStatus {
  state: VaultActionState;
  error?: string;
  txHash?: string;
}

export const VAULT_ACTION_LABELS: Record<VaultActionState, string> = {
  idle: '',
  review: 'Review',
  signing: 'Signing…',
  submission: 'Submitting…',
  pending: 'Pending confirmation…',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

/**
 * Represents whether a specific vault action is currently supported.
 *
 * Each vault action (deposit, withdraw, lock, unlock) can be:
 *  - `'supported'`: The action is fully available.
 *  - `'unsupported'`: The action is not available (no contract, disabled
 *     feature, etc.). A `reason` explains why.
 *  - `'loading'`: The capability check is still in progress.
 */
export type VaultActionCapability =
  | { status: 'supported' }
  | { status: 'unsupported'; reason: string; detail?: string }
  | { status: 'loading' };

/**
 * Map of all vault actions to their capability state.
 */
export interface VaultCapabilities {
  deposit: VaultActionCapability;
  withdraw: VaultActionCapability;
  lock: VaultActionCapability;
  unlock: VaultActionCapability;
}

export type VaultAction = 'deposit' | 'withdraw' | 'lock' | 'unlock';


