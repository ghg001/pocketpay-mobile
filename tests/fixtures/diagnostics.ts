/**
 * Diagnostics export fixtures — mirrors the redacted shape `getDiagnostics()`
 * (src/utils/diagnostics.ts) produces, for testing any UI that renders or
 * shares a diagnostics report without needing a real device/store.
 *
 * No secrets: no public keys, seed phrases, RPC URLs, or raw contract IDs —
 * matching the redaction `getDiagnostics()` itself performs.
 */
export interface DiagnosticsSnapshot {
  environment: {
    platform: 'ios' | 'android';
    osVersion: string | number;
    appVersion: string;
    isDevelopment: boolean;
  };
  network: {
    tier: string;
    label: string;
    horizonHost: string;
    sorobanHost: string;
    vaultMode: string;
    vaultContractLabel: string;
  };
  featureFlags: Record<string, boolean>;
  storage: { secureStoreAvailable: boolean };
  appState: {
    isInitialized: boolean;
    themeMode: string;
    contactsCount: number;
  };
  walletState: {
    hasPublicKey: boolean;
    isBalanceLoaded: boolean;
    balanceState: string;
    fundingStatus: string;
    transactionsCount: number;
    isLoading: boolean;
    lastRefreshed: number | null;
    lastError: string | null;
  };
  networkHealth: {
    classifiedError: string | null;
    hasError: boolean;
  };
  lastReportedError: {
    source: string;
    name: string;
    message: string;
    isFatal: boolean;
    timestamp: string;
  } | null;
  timestamp: string;
}

export const diagnosticsFixtures: Record<string, DiagnosticsSnapshot> = {
  /** A healthy, funded wallet with no recent errors. */
  healthy: {
    environment: {
      platform: 'ios',
      osVersion: '17.4',
      appVersion: '1.0.0',
      isDevelopment: false,
    },
    network: {
      tier: 'testnet',
      label: 'Testnet',
      horizonHost: 'horizon-testnet.stellar.org',
      sorobanHost: 'soroban-testnet.stellar.org',
      vaultMode: 'contract',
      vaultContractLabel: 'configured',
    },
    featureFlags: { vaultEnabled: true, diagnosticsExport: true },
    storage: { secureStoreAvailable: true },
    appState: { isInitialized: true, themeMode: 'system', contactsCount: 3 },
    walletState: {
      hasPublicKey: true,
      isBalanceLoaded: true,
      balanceState: 'available',
      fundingStatus: 'funded',
      transactionsCount: 12,
      isLoading: false,
      lastRefreshed: Date.now(),
      lastError: null,
    },
    networkHealth: { classifiedError: null, hasError: false },
    lastReportedError: null,
    timestamp: new Date().toISOString(),
  },
  /** A device where SecureStore is unavailable (rare, but must not crash export). */
  secureStoreUnavailable: {
    environment: {
      platform: 'android',
      osVersion: 30,
      appVersion: '1.0.0',
      isDevelopment: true,
    },
    network: {
      tier: 'testnet',
      label: 'Testnet',
      horizonHost: 'horizon-testnet.stellar.org',
      sorobanHost: 'soroban-testnet.stellar.org',
      vaultMode: 'contract',
      vaultContractLabel: 'configured',
    },
    featureFlags: { vaultEnabled: true, diagnosticsExport: true },
    storage: { secureStoreAvailable: false },
    appState: { isInitialized: true, themeMode: 'dark', contactsCount: 0 },
    walletState: {
      hasPublicKey: true,
      isBalanceLoaded: false,
      balanceState: 'idle',
      fundingStatus: 'unknown',
      transactionsCount: 0,
      isLoading: false,
      lastRefreshed: null,
      lastError: null,
    },
    networkHealth: { classifiedError: null, hasError: false },
    lastReportedError: null,
    timestamp: new Date().toISOString(),
  },
  /** A wallet in a persistent network-error state, with a recently reported crash. */
  networkErrorWithReportedCrash: {
    environment: {
      platform: 'ios',
      osVersion: '17.4',
      appVersion: '1.0.0',
      isDevelopment: false,
    },
    network: {
      tier: 'testnet',
      label: 'Testnet',
      horizonHost: 'horizon-testnet.stellar.org',
      sorobanHost: 'soroban-testnet.stellar.org',
      vaultMode: 'contract',
      vaultContractLabel: 'configured',
    },
    featureFlags: { vaultEnabled: true, diagnosticsExport: true },
    storage: { secureStoreAvailable: true },
    appState: { isInitialized: true, themeMode: 'system', contactsCount: 3 },
    walletState: {
      hasPublicKey: true,
      isBalanceLoaded: false,
      balanceState: 'unavailable',
      fundingStatus: 'funded',
      transactionsCount: 12,
      isLoading: false,
      lastRefreshed: Date.now() - 60_000,
      lastError: 'Network request failed',
    },
    networkHealth: { classifiedError: 'connection', hasError: true },
    lastReportedError: {
      source: 'ErrorBoundary',
      name: 'TypeError',
      message: 'Cannot read property of undefined',
      isFatal: true,
      timestamp: new Date(Date.now() - 30_000).toISOString(),
    },
    timestamp: new Date().toISOString(),
  },
};
