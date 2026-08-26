# Vault SDK Capability Assumptions

This document describes the assumptions the mobile client makes about the PocketPay SDK and Soroban contract readiness, and how vault capabilities are gated.

## Current Capability Checks

| Check                | Source                         | Fallback                          |
|----------------------|--------------------------------|-----------------------------------|
| Wallet loaded        | `walletStore.publicKey`        | Show "no wallet" unavailable      |
| Feature flag         | `EXPO_PUBLIC_VAULT_ENABLED`    | Default `true` (vault enabled)    |
| Contract configured  | `isVaultConfigured()`          | Mock mode (not unavailable)       |

## Capability Gate Architecture (Issue #331)

The vault capability gate (`src/utils/vaultCapabilities.ts`) evaluates per-action availability:

| Action   | Requires Wallet | Requires Feature | Requires SDK Ready | Fallback                     |
|----------|-----------------|------------------|--------------------|------------------------------|
| Deposit  | Yes             | Yes              | Yes                | "Vault feature disabled"     |
| Withdraw | Yes             | Yes              | Yes                | "Vault backend not ready"    |
| Lock     | Yes             | Yes              | Yes                | "No wallet available"        |
| Unlock   | Yes             | Yes              | Yes                | —                            |

Each capability returns one of:
- `{ status: 'supported' }` — action is fully available
- `{ status: 'unsupported', reason, detail }` — action not available, with user-facing copy
- `{ status: 'loading' }` — capability check in progress

### VaultCapabilityInput

```typescript
interface VaultCapabilityInput {
  hasWallet: boolean;
  isContractConfigured: boolean;
  isFeatureEnabled: boolean;
  isSdkReady: boolean;
  isLoading: boolean;
}
```

## Future SDK Capability Signal

When the PocketPay SDK (`pocketpay-sdk`) ships a vault readiness API, the mobile client should:

1. Call `sdk.vault.isReady()` (or equivalent) during app initialization.
2. Store the result in a dedicated capability store or context.
3. Pass it to `evaluateVaultCapabilities()` as the `isSdkReady` input.
4. Add finer-grained checks per action when `sdk.vault.getCapabilities()` is available.

### Expected SDK Interface

```typescript
interface PocketPaySDK {
  vault: {
    /** Returns true when the vault contract is deployed and reachable. */
    isReady(): Promise<boolean>;
    /** Returns the set of vault features currently available. */
    getCapabilities(): Promise<VaultCapabilities>;
  };
}

interface VaultCapabilities {
  deposit: boolean;
  withdraw: boolean;
  lock: boolean;
  unlock: boolean;
}
```

Until this interface is available, the mobile client uses `isSdkReady: true` as the default.

## Related Documentation

- [Vault Integration Assumptions](./vault-integration-assumptions.md)
- [Vault Integration Risks](./vault-integration-risks.md)
- [Vault UI Guidance](./vault-ui-guidance.md)
- [Account Funding States](./account-funding-states.md)
