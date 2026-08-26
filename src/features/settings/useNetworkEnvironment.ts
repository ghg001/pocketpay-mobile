import { useMemo } from 'react';
import { isVaultConfigured, getVaultContractId } from '../../services/vault';

export type NetworkTier = 'mainnet' | 'testnet' | 'custom';

export type VaultMode = 'configured' | 'mock';

export interface EnvironmentWarning {
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface NetworkEnvironment {
  networkName: string;
  networkTier: NetworkTier;
  networkLabel: string;
  horizonHost: string;
  sorobanHost: string;
  vaultMode: VaultMode;
  vaultContractLabel: string;
  warnings: EnvironmentWarning[];
}

const KNOWN_MAINNET_NAMES = new Set(['MAINNET', 'PUBLIC', 'LIVENET', 'PROD', 'PRODUCTION']);
const KNOWN_TESTNET_NAMES = new Set(['TESTNET', 'TEST', 'FUTURENET', 'SANDBOX', 'STANDALONE']);

function classifyNetworkTier(rawName: string): NetworkTier {
  const upper = rawName.trim().toUpperCase();
  if (KNOWN_MAINNET_NAMES.has(upper)) return 'mainnet';
  if (KNOWN_TESTNET_NAMES.has(upper)) return 'testnet';
  return 'custom';
}

function prettyNetworkLabel(tier: NetworkTier, rawName: string): string {
  switch (tier) {
    case 'mainnet':
      return 'Public Network (Mainnet)';
    case 'testnet':
      return 'Testnet';
    default:
      return rawName || 'Custom Network';
  }
}

function extractHost(url: string | undefined): string {
  if (!url) return '—';
  try {
    const parsed = new URL(url);
    return parsed.hostname || url;
  } catch {
    // Fallback: strip protocol and path with simple string ops
    const withoutProto = url.replace(/^[a-zA-Z]+:\/\//, '');
    const withoutPath = withoutProto.split('/')[0];
    return withoutPath || url;
  }
}

function maskContractId(contractId: string): string {
  const trimmed = contractId.trim();
  if (!trimmed) return '—';
  if (trimmed.length <= 12) return trimmed;
  const first = trimmed.slice(0, 6);
  const last = trimmed.slice(-6);
  return `${first}…${last}`;
}

function buildWarnings(
  networkTier: NetworkTier,
  vaultConfigured: boolean,
  vaultContractId: string
): EnvironmentWarning[] {
  const warnings: EnvironmentWarning[] = [];

  if (networkTier === 'mainnet') {
    warnings.push({
      severity: 'error',
      title: 'Mainnet in use',
      message:
        'This app is connected to the public Stellar network. Real XLM with monetary value will be moved by any transactions you send. Double-check every payment before confirming.',
    });
  }

  if (networkTier === 'testnet') {
    warnings.push({
      severity: 'info',
      title: 'Testnet only',
      message:
        'This app runs on the Stellar Testnet. Testnet XLM has no real monetary value and balances may be reset by the network at any time.',
    });
  }

  if (networkTier === 'custom') {
    warnings.push({
      severity: 'warning',
      title: 'Custom network configured',
      message:
        'A non-standard network name is set in EXPO_PUBLIC_STELLAR_NETWORK. Horizon, Soroban RPC, and the passphrase must all match this network or operations will fail.',
    });
  }

  if (!vaultConfigured) {
    warnings.push({
      severity: 'info',
      title: 'Vault running in mock mode',
      message:
        'No Soroban vault contract is configured (EXPO_PUBLIC_VAULT_CONTRACT_ID is not set). Vault deposits and withdrawals simulate locally — no on-chain funds move.',
    });
  } else if (!vaultContractId) {
    warnings.push({
      severity: 'warning',
      title: 'Vault contract ID missing',
      message:
        'The vault reported itself as configured but no contract ID could be read. Vault operations may not reach the intended contract.',
    });
  }

  return warnings;
}

/**
 * Derives a user-safe summary of the currently configured network and vault
 * environment. No raw secrets or full URLs are exposed — hostnames and
 * truncated identifiers only.
 *
 * Plain function (not a hook) so it can be called from non-component code,
 * e.g. the diagnostics export builder. `useNetworkEnvironment` below wraps
 * it in `useMemo` for component use; the underlying computation is
 * identical either way.
 */
export function computeNetworkEnvironment(): NetworkEnvironment {
  const rawNetwork = process.env.EXPO_PUBLIC_STELLAR_NETWORK ?? 'TESTNET';
  const networkName = rawNetwork.trim() || 'TESTNET';
  const networkTier = classifyNetworkTier(networkName);

  const horizonUrl = process.env.EXPO_PUBLIC_STELLAR_HORIZON_URL;
  const sorobanUrl = process.env.EXPO_PUBLIC_SOROBAN_RPC_URL;

  const vaultConfigured = isVaultConfigured();
  const vaultContractId = getVaultContractId();

  const vaultMode: VaultMode = vaultConfigured ? 'configured' : 'mock';
  const vaultContractLabel = vaultConfigured
    ? maskContractId(vaultContractId)
    : 'Mock (no contract)';

  const warnings = buildWarnings(networkTier, vaultConfigured, vaultContractId);

  return {
    networkName,
    networkTier,
    networkLabel: prettyNetworkLabel(networkTier, networkName),
    horizonHost: extractHost(horizonUrl),
    sorobanHost: extractHost(sorobanUrl),
    vaultMode,
    vaultContractLabel,
    warnings,
  };
}

/**
 * Hook that derives a user-safe summary of the currently configured network
 * and vault environment. No raw secrets or full URLs are exposed — hostnames
 * and truncated identifiers only.
 */
export function useNetworkEnvironment(): NetworkEnvironment {
  return useMemo(() => computeNetworkEnvironment(), []);
}
