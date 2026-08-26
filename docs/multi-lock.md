# Multi-Lock Vault Feature

## Overview

The multi-lock list displays all time-locked deposits associated with the user's vault account. Each lock represents an independent deposit with its own amount, unlock date, and status. This aligns with the future Soroban contract direction supporting multiple locks per user.

## Component: `MultiLockList`

**Location:** `src/components/MultiLockList.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `locks` | `VaultLock[]` | Array of lock objects to render |
| `isLoading` | `boolean` | Shows an `ActivityIndicator` spinner |
| `error` | `string \| null` | Displays error message with retry button |
| `onWithdraw` | `(lock: VaultLock) => void` | Called when user taps withdraw on a matured lock |
| `onRetry` | `() => void` | Called when user taps retry after an error |
| `isWithdrawing` | `boolean` | Disables withdraw buttons during submission |

### States Handled

| State | Visual |
|---|---|
| **Loading** | Spinner + "Loading locks…" |
| **Error** | Error icon + message + retry button |
| **Empty** | Lock icon + "No Locks Yet" + guidance text |
| **Populated** | List of lock cards |

### Lock Status Display

| Status | Icon | Color | Action |
|---|---|---|---|
| `locked` | `Clock` | Warning (amber) | None (immature) |
| `matured` | `Unlock` | Success (green) | "Withdraw" button |
| `withdrawn` | `CheckCircle2` | Muted (grey) | None (completed) |

## Type: `VaultLock`

**Location:** `src/types/vault.ts`

```ts
interface VaultLock {
  id: string;           // Unique lock identifier
  amount: string;       // XLM amount, 7-decimal string (e.g. "500.0000000")
  unlockDate: string;   // ISO-8601 date when lock matures
  status: LockStatus;   // 'locked' | 'matured' | 'withdrawn'
  txHash?: string;      // Optional creation transaction hash
}
```

## Placeholder Data

**Location:** `tests/fixtures/vault.ts`

Until the Soroban contract's multi-lock interface is ready, the vault screen uses hardcoded fixtures:

```ts
vaultLockFixtures.all  // 3 locks: locked, matured, withdrawn
vaultLockFixtures.locked   // 2 immature locks
vaultLockFixtures.matured  // 2 matured locks
vaultLockFixtures.empty    // []
```

The unlock dates are computed dynamically (e.g., 30 days from now, 7 days ago) so the fixtures always show a realistic mix of statuses.

## Integration Roadmap

1. **Done** — `MultiLockList` component with loading/empty/error states
2. **Done** — Placeholder fixtures for UI development
3. **TODO** — Add `fetchLocks(publicKey)` to `src/services/vault.ts` that calls the Soroban contract's lock registry
4. **TODO** — Add lock state to `src/store/vaultStore.ts` (Zustand slice)
5. **TODO** — Implement `withdrawLock(secretKey, lockId)` contract call
6. **TODO** — Replace fixture data in `app/(tabs)/vault.tsx` with real store data

## Contract Interface (Expected)

The Soroban vault contract is expected to expose:

```
get_locks(owner: Address) -> Vec<Lock>
withdraw_lock(owner: Address, lock_index: u32) -> i128
```

Where `Lock` is a struct containing `amount: i128`, `unlock_time: u64`, and `withdrawn: bool`.
