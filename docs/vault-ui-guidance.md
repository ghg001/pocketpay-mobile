# Vault UI Guidance

This document describes how the mobile app should present the Soroban Savings Vault to users. It covers Testnet language, current contract limitations, and communication best practices.

---

## Testnet Wording

The vault connects to **Stellar Testnet** only. All UI text must make this clear:

- Use "Testnet" or "TESTNET" in labels, footnotes, and info banners.
- Never refer to the vault as a "savings account", "bank", or any term that implies production financial custody.
- Balance displays and transaction confirmations should carry a Testnet disclaimer where appropriate.

**Examples:**

| Do | Don't |
|---|---|
| "Soroban Savings Vault (Testnet)" | "Savings Account" |
| "Connected to Soroban contract on TESTNET" | "Live on Mainnet" |
| "Testnet XLM has no real value" | (omit the disclaimer entirely) |

The vault screen in `app/(tabs)/vault.tsx` already shows a TESTNET badge when a contract is configured. Any new vault-related screens or components must follow the same pattern.

---

## Internal Balance Tracking Limitation

The vault contract tracks user balances internally via the `balance(id: Address) -> i128` function. This means:

- **No external indexing.** The vault does not emit events or maintain an off-chain ledger. Balance queries rely on simulating the `balance` contract call (see `src/services/vault.ts:79`).
- **Mock fallback.** When `EXPO_PUBLIC_VAULT_CONTRACT_ID` is not set, the app falls back to a mock balance (`src/services/stellar.ts`) that does not reflect real on-chain state.
- **UI must not claim real-time accuracy.** Display a warning when running in mock mode, and avoid promising "live" balance tracking even when connected.

**Relevant code:**
- `src/store/vaultStore.ts` — switches between real and mock balance fetching.
- `src/services/vault.ts:79-106` — real balance via Soroban simulation.
- `app/(tabs)/vault.tsx:96-105` — shows "Mock balance" or contract ID snippet.

---

## Multiple Locked Funds Support

The UI now supports displaying multiple independent locks per user, each with:

- Locked amount
- Unlock date
- Status (locked/matured)
- Eligible actions (unlock for matured locks)

### UI Components:
- `VaultLockList.tsx` - Displays all locks with empty and loading states
- `VaultLockEducationModal.tsx` - Explains lock functionality (updated for multiple locks)

### State Management:
- `src/store/vaultStore.ts` uses an array of `Lock` objects stored in AsyncStorage
- Each lock has an id, amount, unlockDate, status, and createdAt timestamp
- Lock status is automatically checked against current time when loading

**Relevant code:**
- `src/components/VaultLockList.tsx` — lock list component with empty/loading states
- `src/components/VaultLockEducationModal.tsx` — updated education modal
- `src/store/vaultStore.ts` — `locks` state, `loadLocks`, `addLock`, `unlockLock` functions
- `app/(tabs)/vault.tsx` — uses `VaultLockList` and integrates with store
## Locked Funds Education

To avoid user confusion when funds are locked, the UI provides:

- A **locked funds box** showing locked amount and unlock time (when applicable), using AsyncStorage for mock persistence
- A **help icon** in the locked funds box that opens `VaultLockEducationModal`
- The `VaultLockEducationModal` explains:
  - Lock period and why early withdrawal isn't possible
  - Unlock time calculation
  - That this is currently a mock/test feature

**Relevant code:**
- `src/components/VaultLockEducationModal.tsx` — modal implementation
- `src/store/vaultStore.ts` — `lockedBalance`, `unlockTime`, `loadLockedState`, `lockFunds`
- `app/(tabs)/vault.tsx` — UI integration

---

## Avoiding Production Custody Claims

Do not represent the vault as a production-grade custody solution. Specifically:

- Do not use terms like "insured", "guaranteed", "secured by contract", or "safe storage" without clear Testnet qualification.
- The "Lock Funds (30 days)" button in `app/(tabs)/vault.tsx:164-185` is currently implemented with mock local storage. It must not be described as an active time-lock feature until Soroban time-lock logic is implemented in the contract and wired in the mobile app.
- When displaying transaction hashes (e.g. `app/(tabs)/vault.tsx:77-78`), clearly distinguish between real contract transactions and mock operations.

**Acceptable language:**
- "Soroban Savings Vault — experimental Testnet feature"
- "Deposit and withdraw XLM via a Soroban smart contract on Testnet"
- "No real funds moved (mock mode)"

**Unacceptable language:**
- "Secure your XLM in the vault"
- "Your funds are protected by the contract"
- "Production-ready savings"

---

## Linking to Contract Docs

When the vault UI references the on-chain contract, link to or cite the relevant PocketPay Contracts documentation:

- **Contract repository:** [PocketPay Contracts](https://github.com/Axionvera/pocketpay-contracts)
- **Contract interface:** `deposit(from, amount)`, `withdraw(to, amount)`, `balance(id)` — documented in `src/services/vault.ts:5-9`
- **Environment configuration:** `EXPO_PUBLIC_VAULT_CONTRACT_ID` and `EXPO_PUBLIC_SOROBAN_RPC_URL` in `.env`

Any new vault UI that displays contract interaction details (transaction hashes, contract IDs, method names) should include a footnote or tooltip linking to the contract source and its README.

---

## Vault Unavailable State

When the vault cannot be used (no wallet, feature disabled, or SDK not ready), the UI renders a dedicated `VaultUnavailableState` component instead of the interactive form.

### Triggering Conditions

| Condition | Reason Code | User-Facing Message |
|---|---|---|
| No wallet loaded (`publicKey` null) | `no-wallet` | Create or import a wallet to use the Soroban Savings Vault. |
| `EXPO_PUBLIC_VAULT_ENABLED=false` | `feature-disabled` | The vault is currently disabled by configuration. |
| SDK reports vault not ready | `sdk-not-ready` | The vault backend is not yet available. |

### UI Behaviour

- The deposit/withdraw/lock form is **replaced** by `VaultUnavailableState`
- All vault action buttons are not rendered (preventing any interaction)
- A fallback navigation button is shown:
  - `no-wallet` → "Go to Settings" (navigates to settings tab)
  - `feature-disabled` / `sdk-not-ready` → "Try Again" (retriggers availability check)
- The docs link at the bottom points to this document

### Important

Mock mode (`EXPO_PUBLIC_VAULT_CONTRACT_ID` unset) is **not** treated as "unavailable". The vault form remains accessible with a warning banner explaining that no real funds are moved. This is intentional — mock mode exists for development and demo purposes.

---

## Summary Checklist

| Guideline | Status |
|---|---|
| Testnet language used consistently | Required |
| Internal balance tracking limitation documented in UI | Required |
| No production custody claims | Required |
| Lock funds placeholder clearly marked as not-yet-implemented | Required |
| Locked funds explained with education UI | Required |
| Multiple locks supported with distinct UI | Required |
| Matured/immature locks visually distinct | Required |
| Empty and loading states handled | Required |
| Vault unavailable state shown when capability is missing | Required |
| SDK capability assumptions documented | Required |
| Fallback navigation available from unavailable state | Required |
| Actions disabled when vault is unavailable | Required |
| Contract docs referenced in UI footnotes or tooltips | Recommended |
| Mock mode distinguished from real contract mode | Required |

---

## Related Documentation

- [Security Guide](./security.md) — key handling, Testnet risks, and safe development practices
- [Storage Guide](./storage.md) — how SecureStore and AsyncStorage are used
- [Vault Integration Assumptions](./vault-integration-assumptions.md) — expected SDK/contract dependencies, placeholder behaviors, and known gaps
- [Vault SDK Capability Assumptions](./vault-sdk-capability-assumptions.md) — SDK readiness signals & feature flag assumptions
- [Soroban Savings Vault contract](https://github.com/Axionvera/pocketpay-contracts) — contract source and interface

