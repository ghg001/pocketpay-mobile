# Vault Feature Module

This module encapsulates state management, UI hooks, components, error classification, and integration boundaries for the Soroban Savings Vault feature in PocketPay Mobile.

---

## Architecture & Module Structure

```
src/features/vault/
├── index.ts                     # Public module exports
├── DepositPreview.tsx           # Deposit confirmation & review modal component
├── WithdrawalPreview.tsx        # Withdrawal source selection & review modal component
├── useVaultDepositForm.ts       # Hook managing deposit input state, validation, and submission
├── useMaturedLockWithdrawal.ts  # Hook driving the matured lock withdrawal state machine
├── maturedLockWithdrawal.ts     # Pure business logic for withdrawal eligibility & error mapping
├── vaultStore.ts                # Zustand store slice for vault balance, locks, and withdrawals
└── README.md                    # Module documentation & integration guide
```

---

## Core Components & Hooks

### 1. `DepositPreview.tsx`
* **Purpose**: Modal sheet presenting a structured summary of a pending deposit before cryptographic signing.
* **Key Visual Elements**:
  * Deposit summary (amount, native XLM asset badge, destination vault contract ID).
  * Post-deposit wallet balance calculation.
  * Dual-mode context banner (green verified notice for configured contracts, yellow mock badge for preview mode).
  * Contract lock terms disclaimer.
* **Security**: Never receives or handles private keys; coordinates with `useVaultDepositForm` and `useWalletStore`.

### 2. `WithdrawalPreview.tsx`
* **Purpose**: Two-step withdrawal workflow allowing users to choose between available vault balance or specific matured time-locks.
* **Step 1 (Source Selection)**: Lists available instant balance and all matured locks.
* **Step 2 (Review & Confirm)**: Presents recipient wallet address, amount, and preview disclaimer before initiating withdrawal.

### 3. `useVaultDepositForm.ts`
* **Purpose**: Form state manager handling amount inputs, real-time validation against current wallet balance, submission lifecycle, and error capture.
* **Interface**:
  ```typescript
  interface UseVaultDepositFormReturn {
    amount: string;
    amountError: string | undefined;
    isSubmitting: boolean;
    isSuccess: boolean;
    submitError: string | undefined;
    setAmount: (value: string) => void;
    validate: (walletBalance?: string) => boolean;
    submit: (
      publicKey: string,
      getSecretKey: () => Promise<string | null>,
      depositFn: (secret: string, publicKey: string, amount: string) => Promise<string | null>,
      walletBalance?: string
    ) => Promise<string | null>;
    reset: () => void;
  }
  ```

### 4. `useMaturedLockWithdrawal.ts`
* **Purpose**: State machine managing the whole-lock withdrawal lifecycle for matured deposits.
* **States**: `idle` → `confirming` → `submitting` → `success` | `failed`.
* **Eligibility derivation**: Automatically evaluates eligibility via `evaluateWithdrawalEligibility(lock, { publicKey })` whenever lock amount, unlock date, or active public key changes.

### 5. `maturedLockWithdrawal.ts`
* **Purpose**: Pure domain logic and typed error definitions for matured lock operations.
* **Key Functions**:
  * `evaluateWithdrawalEligibility(lock, options)`: Assesses whether a lock is eligible for withdrawal based on unlock timestamp vs current time.
  * `createWithdrawalError(code, message)`: Instantiates a typed `VaultWithdrawalError`.
  * `describeWithdrawalError(code)`: Returns localized, user-friendly recovery copy (`WithdrawalErrorCopy`).
  * `toWithdrawalErrorCode(err)`: Classifies caught exceptions into typed error codes.

### 6. `vaultStore.ts`
* **Purpose**: Local Zustand store managing vault balance, lock collections, submission indicators, and withdrawal action dispatches.

---

## Integration Points & External Services

| Service / Utility | Path | Relationship |
| :--- | :--- | :--- |
| **Vault Service** | `src/services/vault.ts` | Handles Soroban RPC interaction, contract call simulation, transaction preparation, and submission. |
| **Vault Errors** | `src/utils/vaultErrors.ts` | Categorizes vault errors into standard `VaultRecoveryGuidance` and strips sensitive secrets. |
| **Vault Capabilities** | `src/utils/vaultCapabilities.ts` | Evaluates action-level availability (deposit, withdraw, lock, unlock) based on wallet state and configuration. |
| **Vault Availability** | `src/utils/vaultAvailability.ts` | Determines screen-level accessibility and feature toggle status (`EXPO_PUBLIC_VAULT_ENABLED`). |
| **Wallet Store** | `src/store/walletStore.ts` | Provides active `publicKey` and on-demand `getSecretKey()` callback backed by `expo-secure-store`. |

---

## Dual-Mode Execution Model

```
                     ┌───────────────────────────────┐
                     │   Is Contract Configured?     │
                     │ (EXPO_PUBLIC_VAULT_CONTRACT_ID)│
                     └───────────────┬───────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
           [Yes: Configured]                    [No: Empty/Unset]
                    │                                 │
                    ▼                                 ▼
       ┌─────────────────────────┐       ┌─────────────────────────┐
       │     Live Soroban Mode   │       │     Local Mock Mode     │
       ├─────────────────────────┤       ├─────────────────────────┤
       │ - Soroban RPC calls     │       │ - AsyncStorage storage  │
       │ - On-chain simulations  │       │ - Device clock timing   │
       │ - Real cryptographic tx │       │ - Simulated state updates│
       │ - Returns ledger tx hash│       │ - Returns null hash     │
       └─────────────────────────┘       └─────────────────────────┘
```

---

## Error Handling & Recovery

All vault exceptions are intercepted and categorized before reaching the user interface:
1. **Never leak raw stack traces or Soroban host error codes** directly in UI components.
2. **Always provide actionable recovery steps** (e.g. "Fund your wallet", "Wait until unlock date", "Check internet connection").
3. **Always sanitize logs** through `redactSensitiveString` to prevent secret key leakage.

---

## Related Documentation

* [Mobile Vault SDK Integration Risks](../../docs/vault-integration-risks.md) - Complete technical risk analysis, assumptions, and cross-repo handoff roadmap.
* [Vault Integration Assumptions](../../docs/vault-integration-assumptions.md) - Core dependencies and placeholder behaviors.
* [Vault SDK Capability Assumptions](../../docs/vault-sdk-capability-assumptions.md) - Capability gating and feature flag design.
* [Vault UI Guidance](../../docs/vault-ui-guidance.md) - UI design standards, copywriting rules, and Testnet constraints.
