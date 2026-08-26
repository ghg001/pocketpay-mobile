# Mobile Vault SDK Integration Risks & Assumptions

This document provides a comprehensive technical reference detailing the integration boundaries, operational assumptions, placeholder behaviors, error handling models, and known risks across the PocketPay Mobile client, the PocketPay SDK, and the deployed Soroban Savings Vault smart contracts.

---

## 1. Executive Summary & Ecosystem Boundaries

The PocketPay savings vault functionality is distributed across three distinct repositories and architectural layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        pocketpay-mobile                                │
│  - React Native (Expo) Presentation & UI State                         │
│  - SecureStore Key Management (`getSecretKey()`)                       │
│  - Local Zustand Stores (`vaultStore.ts`, `walletStore.ts`)            │
│  - Capability Gating (`vaultCapabilities.ts`, `vaultAvailability.ts`)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         pocketpay-sdk                                  │
│  - TypeScript Client Interface (`src/sdk-stub/`)                       │
│  - Soroban RPC Transaction Assembly & Footprint Preparation            │
│  - Transaction Simulation (`simulateTransaction`)                      │
│  - Standardized Error Classification & Host Code Mapping               │
│  - Cryptographic Signing & Network Submission                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       pocketpay-contracts                              │
│  - Rust-based Soroban Smart Contracts on Stellar Network               │
│  - On-Chain Lock State Registry (`get_locks`, `Vec<Lock>`)             │
│  - Time Enforcement via Consensus Ledger Close Time                    │
│  - Native XLM & SAC Token Custody & Authorization (`require_auth`)     │
└────────────────────────────────────────────────────────────────────────┘
```

### UI Readiness vs. Contract Readiness
The mobile user interface is feature-complete with support for deposits, withdrawals, multi-lock visualization, lock creation, matured-lock unlocking, and educational walkthroughs. However, the backend contract and SDK helpers are under active evolution. To prevent false expectations, the mobile client implements a **Dual-Mode Execution Model**:

* **Mock Mode (Default)**: When `EXPO_PUBLIC_VAULT_CONTRACT_ID` is empty or unset, all vault actions run against local placeholders. Lock records and balances are stored in `@react-native-async-storage/async-storage`, unlock dates are evaluated against device time, and no real transactions are submitted to Stellar. Clear visual indicators ("Mock Vault" badges, disclaimer notices) inform users that no live funds are moving.
* **Live Mode (Configured)**: When `EXPO_PUBLIC_VAULT_CONTRACT_ID` is set to a valid contract address on Stellar Testnet, the app interacts with the Soroban RPC server (`EXPO_PUBLIC_SOROBAN_RPC_URL`), simulates invocations, builds Soroban transaction footprints, and submits signed transactions to the network.

---

## 2. Assumptions: Mobile UI → SDK Helpers

The mobile client interacts with the vault backend through SDK helper abstractions (implemented in `src/services/vault.ts` and future `pocketpay-sdk` modules).

### Expected SDK Interface

```typescript
export interface PocketPayVaultSDK {
  /** Checks whether the vault contract address is configured */
  isVaultConfigured(): boolean;

  /** Returns the current Soroban vault contract identifier */
  getVaultContractId(): string;

  /** Reads the user's total vault balance via read-only simulation */
  getVaultBalance(publicKey: string): Promise<string>;

  /** Builds, simulates, signs, and submits an XLM deposit */
  depositToVault(secretKey: string, amountXlm: string): Promise<string>;

  /** Builds, simulates, signs, and submits an XLM withdrawal */
  withdrawFromVault(secretKey: string, amountXlm: string): Promise<string>;

  /** Fetches all active and matured locks for a public key */
  getUserLocks(publicKey: string): Promise<VaultLock[]>;

  /** Submits a transaction to withdraw/unlock a specific matured lock */
  unlockMaturedLock(secretKey: string, lockId: string): Promise<string>;

  /** Estimates network and Soroban resource fees for a vault invocation */
  estimateVaultFees(action: 'deposit' | 'withdraw' | 'unlock', amount: string): Promise<string>;

  /** Probes backend readiness and capability support */
  getCapabilities(): Promise<VaultCapabilities>;
}
```

### Numeric Representation & Precision
* **Stroop Arithmetic**: The Stellar network and Soroban contracts operate on `i128` integer Stroops ($1\text{ XLM} = 10,000,000\text{ stroops}$).
* **Precision Guarantees**: Mobile UI strings (e.g. `"10.5"`) are converted to `BigInt` stroops via `xlmToStroops` using integer multiplication (`BigInt(whole) * 10_000_000n + BigInt(paddedFraction)`) to avoid IEEE 754 floating-point inaccuracies.
* **Maximum Decimals**: Amounts with more than 7 decimal places are rejected during input validation before SDK dispatch.

### Key Custody & Signing Delegation
* **Secret Key Access**: The UI retrieves private keys on-demand via `useWalletStore.getState().getSecretKey()`, which queries `expo-secure-store`.
* **Zero Secret Persistence**: Secret keys are never cached in React state, Zustand storage, or AsyncStorage, and are wiped from memory immediately after transaction signing.
* **Signer Handoff Compatibility**: Future external signers (hardware wallets, WalletConnect, SEP-0007) will require asynchronous signing callbacks rather than raw secret key arguments.

### Capability Probing & Feature Gating
The mobile client gates vault functionality through `src/utils/vaultCapabilities.ts` and `src/utils/vaultAvailability.ts`:
* `EXPO_PUBLIC_VAULT_ENABLED`: Environment feature flag (defaults to `true`). When `'false'` or `'0'`, the vault screen renders a graceful disabled state.
* `hasWallet`: Requires an active public key in `walletStore`.
* `isSdkReady`: Defaulted to `true` in stub mode, but designed to hook into `sdk.vault.isReady()` once provided by `pocketpay-sdk`.

---

## 3. Assumptions: Mobile UI → Soroban Smart Contract

### Assumed Soroban Contract Entrypoints

The deployed Soroban Savings Vault contract is expected to implement the following public interface:

```rust
pub trait SorobanVaultContract {
    /// Deposits tokens from the caller's address into the vault.
    /// Emits a `deposit` contract event.
    fn deposit(env: Env, from: Address, amount: i128) -> Result<(), VaultError>;

    /// Withdraws available (unlocked) tokens to the specified address.
    /// Emits a `withdraw` contract event.
    fn withdraw(env: Env, to: Address, amount: i128) -> Result<(), VaultError>;

    /// Queries the total balance (locked + unlocked) for an account.
    fn balance(env: Env, id: Address) -> i128;

    /// Queries all time-locks registered under the given account.
    fn get_locks(env: Env, id: Address) -> Vec<Lock>;

    /// Matures and transfers funds for a specific time-lock whose unlock time has passed.
    fn unlock(env: Env, id: Address, lock_id: u64) -> Result<(), VaultError>;
}
```

### Token-Backed Mechanics & Asset Scope
* **Current Asset Support**: The mobile UI exclusively displays and transfers native Stellar Lumens (XLM).
* **Soroban Token Interface (SEP-41 / SAC)**: Contract invocations interact with the native asset through Stellar Asset Contract (SAC) wrappers. Future multi-token vaults (e.g. USDC, EURC) will require specifying token contract addresses and verifying trustlines/allowances.
* **Authorization**: The contract invokes `from.require_auth()` for deposits and `id.require_auth()` for lock withdrawals.

### Lock Durations & Ledger Consensus Time
* **UI Fixed Duration**: The current UI creates locks with a hardcoded **30-day** duration (`Date.now() + 30 * 24 * 60 * 60 * 1000`).
* **On-Chain Time Enforcement**: The contract measures time via `env.ledger().timestamp()` (consensus ledger close time). The contract is the ultimate security boundary; client clock adjustments cannot force early unlocking on-chain.
* **Whole-Lock Withdrawal**: When withdrawing a matured lock, the entire principal is unlocked and returned to the wallet in a single invocation.

---

## 4. Multi-Lock Data Handling & Schema Harmonization

### Schema Mapping

| Field Description | Mobile Client (`src/types/vault.ts`) | Soroban Contract Struct (`Lock`) | Data Translation Note |
| :--- | :--- | :--- | :--- |
| **Identifier** | `id: string` (UUID / timestamp) | `lock_id: u64` | Client converts string ID to u64 integer for contract calls. |
| **Locked Amount** | `amount: string` (e.g. `"500.0000000"`) | `amount: i128` (stroops) | Converted via `xlmToStroops(amount)` and `stroopsToXlm(raw)`. |
| **Unlock Timestamp** | `unlockDate: string` (ISO 8601) | `unlock_time: u64` (Unix seconds) | `new Date(lock_id * 1000).toISOString()` |
| **Creation Timestamp**| `createdAt: string` (ISO 8601) | `created_at: u64` (Unix seconds) | Captured at lock creation time. |
| **Status** | `'locked' \| 'matured' \| 'withdrawn'` | `withdrawn: bool` / derived | In the client, `matured` is derived dynamically from `unlockDate <= now`. |
| **Transaction Hash** | `txHash?: string` | Event hash / RPC response | Optional hash linking to Stellar Expert explorer. |

### Storage Synchronization & State Reconciliation
1. **Mock Mode Lifecycle**:
   - Locks are saved to AsyncStorage key `@pocketpay_vault_locks`.
   - On app launch or tab focus, locks are loaded into `vaultStore` and status is re-evaluated.
2. **Live Mode Lifecycle**:
   - `vaultStore.loadLocks()` queries the contract's `get_locks` via RPC simulation.
   - Local storage is bypassed or used as a non-authoritative offline cache.
3. **Atomic Withdrawal Progression**:
   - The matured lock withdrawal hook (`useMaturedLockWithdrawal`) transitions through: `idle` → `confirming` → `submitting` → `success` / `failed`.
   - The lock record is **only removed** from state and local storage after the transaction returns status `SUCCESS`. If the network drops or the transaction is rejected, the lock remains untouched.

---

## 5. SDK & Contract Error Handling Architecture

The mobile app standardizes all vault failure modes into user-facing recovery guidance (`src/utils/vaultErrors.ts` and `src/features/vault/maturedLockWithdrawal.ts`). Raw Soroban host panic strings and RPC stack traces are intercepted and never exposed to the user.

```
┌────────────────────────────────────────────────────────┐
│             Raw Error Sources                          │
│  - Soroban Host Errors (e.g. Error(Contract, #1))       │
│  - RPC Network Failures (FetchFailed, Timeout)         │
│  - Stellar Horizon Codes (op_underfunded, op_low_reserve)│
│  - Key Management Exceptions (SecureStore access)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Classification Engine                      │
│             `classifyVaultError(err)`                  │
│  - Pattern matches known codes                         │
│  - Redacts private keys via `redactSensitiveString()`  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             VaultRecoveryGuidance                      │
│  - `title`: User-friendly heading                      │
│  - `message`: Plain-language explanation               │
│  - `action`: Clear next step (e.g. "Add more XLM")     │
│  - `canRetry`: Boolean retry policy                    │
│  - `shouldNavigateBack`: UX navigation suggestion      │
└────────────────────────────────────────────────────────┘
```

### Error Classification Taxonomy

| Error Code | Trigger Conditions | User-Facing Guidance (`title` / `message`) | Recovery Action | Can Retry |
| :--- | :--- | :--- | :--- | :---: |
| `validation` | Amount $\le 0$, $> 7$ decimals, non-numeric | **Invalid Input**: "The amount you entered is not valid." | "Check the amount and adjust." | ❌ |
| `insufficient-balance` | `op_underfunded`, amount exceeds wallet balance | **Insufficient Balance**: "Your account does not have enough XLM." | "Fund wallet via Friendbot or deposit XLM." | ❌ |
| `reserve-not-met` | `op_low_reserve`, would breach base reserve | **Reserve Not Met**: "Action would drop balance below network reserve." | "Reduce amount or add XLM." | ❌ |
| `not-matured` | Contract rejects unlock; ledger time $<$ unlock time | **Lock Not Ready**: "This lock has not matured yet." | "Wait until unlock date has passed." | ❌ |
| `lock-not-found` | Invalid lock ID or already withdrawn | **Lock Unavailable**: "This lock is no longer in your vault." | "Refresh vault to view current locks." | ❌ |
| `secret-unavailable` | SecureStore read failure, biometrics cancelled | **Could Not Access Key**: "Wallet key could not be read." | "Reopen app and try again." | ✅ |
| `signing-rejected` | User pressed cancel on signing confirmation modal | **Signing Cancelled**: "Transaction was not signed." | "Try again when ready to approve." | ✅ |
| `network` | RPC unreachable, timeout, DNS resolution failure | **Network Problem**: "Could not reach Stellar network." | "Check internet connection and retry." | ✅ |
| `contract-error` | Soroban simulation failure, custom contract trap | **Contract Error**: "Vault contract rejected transaction." | "Try again in a moment." | ✅ |
| `unsupported-feature` | Feature flag disabled, unconfigured backend | **Feature Unavailable**: "Action not supported in configuration." | "Check settings or try again later." | ❌ |

---

## 6. Placeholder UI Behavior vs Production Target Behavior

| UI Touchpoint | Mock / Placeholder Behavior (Current) | Production / Target Behavior (Live) |
| :--- | :--- | :--- |
| **Vault Balance Display** | Reads mock balance from AsyncStorage; starts at `0.0000000 XLM`. | Simulates `balance(publicKey)` on deployed contract via Soroban RPC. |
| **Deposit Execution** | Increments local balance; displays mock success with no tx hash. | Prepares footprint, requests user signing, submits Soroban tx, returns tx hash. |
| **Deposit Preview Modal** | Displays yellow "Mock Vault" badge and pending integration notice. | Displays green "Soroban Contract" verified badge and live contract address. |
| **Lock Creation** | Computes `Date.now() + 30 days`; saves JSON entry to AsyncStorage. | Submits `deposit_and_lock` contract invocation with ledger time constraints. |
| **Lock Maturity Evaluation** | Compares `new Date(lock.unlockDate)` against device clock `Date.now()`. | Queries contract state; checks against network consensus ledger time. |
| **Matured Lock Withdrawal** | Deletes lock from AsyncStorage; decrements mock balance. | Submits `unlock(publicKey, lock_id)`; verifies on-chain transfer receipt. |
| **Withdrawal Preview Modal** | Simulates full or matured lock withdrawal; disclaimer banner shown. | Builds on-chain transaction; requests biometric/PIN authentication before submission. |
| **Lock Detail Screen** | Renders static attributes; share/explorer actions disabled. | Renders on-chain lock index, contract address, and link to Stellar Expert. |
| **Unavailable State Card** | Displayed when `EXPO_PUBLIC_VAULT_ENABLED='false'` or no wallet loaded. | Displayed when capability checks fail or backend signals maintenance mode. |

---

## 7. Known Integration Risks & Technical Debt Matrix

| Risk ID | Risk Description | Severity | Likelihood | Technical Impact | Mitigation & Code Handling |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **RISK-01** | **Device Clock Skew vs Ledger Time** | High | High | User modifies phone clock to make lock appear "matured". UI triggers withdrawal, which crashes on-chain when the Soroban contract rejects it. | `evaluateWithdrawalEligibility` acts as a UX guard, but all withdrawals are simulated on-chain prior to signing. Failures map to `'not-matured'` error guidance. |
| **RISK-02** | **Lock Schema Drift** | High | Med | Contract updates lock data structure (e.g. changing `lock_id` from `u64` to `BytesN<32>`). Client fails to deserialize `get_locks`. | Define shared TypeScript types generated directly from the Soroban contract's Rust ABI specification. |
| **RISK-03** | **RPC Rate Limiting & Outages** | Med | Med | Public Testnet RPC (`soroban-testnet.stellar.org`) becomes congested or throttled. App hangs or throws generic network errors. | Implement retry backoff in SDK helpers; configure fallback RPC endpoints in `app.json` / `.env`. |
| **RISK-04** | **Resource Fee Volatility** | Med | High | Soroban compute/read/write resource fees spike during network activity, causing transactions with fixed base fee (100 stroops) to fail. | Use `server.prepareTransaction()` to dynamically calculate Soroban resource footprints and set appropriate maximum fees. |
| **RISK-05** | **Race Conditions During Multi-Lock Withdrawals** | Med | Low | User rapidly taps withdraw on multiple matured locks or double-submits. Local store drops locks before confirmation resolves. | Button debouncing in `useMaturedLockWithdrawal` (`if (step === 'submitting') return;`); locks are dropped from store strictly *after* on-chain success. |
| **RISK-06** | **Unfunded Destination / Minimum Reserve Breaches** | High | Med | Withdrawing vault funds into an account below minimum reserve or depositing the entire balance leaving zero XLM for fees. | Balance validation checks reserve buffer ($0.5\text{ XLM} \times (2 + \text{subentries})$) before allowing deposit submissions. |
| **RISK-07** | **Sensitive Data Leakage in Logs** | High | Low | Private keys or secret seeds included in raw transaction error traces or crash reports. | All error pipelines route through `redactSensitiveString()` in `src/utils/vaultErrors.ts` to sanitize keys and secrets. |

---

## 8. Cross-Repository Integration & Coordination Roadmap

To transition the vault from mock placeholder to production readiness, cross-repository tasks must follow this coordinated sequence:

### Phase 1: Contract Interface Freeze (`pocketpay-contracts`)
- [ ] Finalize Soroban contract entrypoints: `deposit`, `withdraw`, `balance`, `get_locks`, `unlock`.
- [ ] Standardize custom Soroban error enum codes (e.g., `LockNotMatured = 1`, `LockNotFound = 2`, `InsufficientUnlockedBalance = 3`).
- [ ] Deploy stable reference contract to Stellar Testnet and publish the contract address.

### Phase 2: SDK Vault Module Implementation (`pocketpay-sdk`)
- [ ] Implement `VaultClient` class replacing `src/sdk-stub/`.
- [ ] Provide TypeScript type definitions for `Lock` struct, `VaultCapabilities`, and `VaultErrorCode`.
- [ ] Wrap `prepareTransaction`, footprint simulation, and error translation into high-level helpers.
- [ ] Implement `sdk.vault.isReady()` capability detection.

### Phase 3: Mobile Service & Store Integration (`pocketpay-mobile`)
- [ ] Replace custom transaction building in `src/services/vault.ts` with official `pocketpay-sdk` calls.
- [ ] Update `src/store/vaultStore.ts` to fetch locks directly from `sdk.vault.getUserLocks()`.
- [ ] Wire `evaluateVaultCapabilities()` into `sdk.vault.getCapabilities()`.
- [ ] Verify complete test suite against live Testnet contract.

---

## Related Documentation

* [Vault Feature Module Documentation](../src/features/vault/README.md) - Architecture of components, hooks, and stores
* [Vault Integration Assumptions](./vault-integration-assumptions.md) - Baseline interface assumptions and dependencies
* [Vault SDK Capability Assumptions](./vault-sdk-capability-assumptions.md) - Capability gating and feature flag design
* [Vault UI Guidance](./vault-ui-guidance.md) - Copywriting guidelines, Testnet constraints, and disclaimer policies
* [Multi-Lock Feature Documentation](./multi-lock.md) - `MultiLockList` UI components and fixture data
