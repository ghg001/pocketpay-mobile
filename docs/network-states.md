# Network States

This document describes how PocketPay detects and handles different network connectivity states, and how each screen responds to degraded or unavailable network conditions.

---

## Network State Model

The app classifies connectivity into five distinct states defined in `src/types/network.ts`:

| State | Meaning | Banner | Write Actions |
|---|---|---|---|
| `online` | Device has internet and Stellar Horizon is reachable | Hidden | Enabled |
| `degraded` | Device has internet but Horizon responses are slow or intermittent | Yellow warning | Enabled (with warning) |
| `service-unavailable` | Stellar Horizon or Friendbot is returning server errors (5xx, rate-limit) | Orange warning | Disabled |
| `offline` | Device has no internet connectivity at all | Red warning | Disabled |
| `unknown` | Connectivity has not been checked yet (e.g. app boot) | Hidden | Enabled |

---

## How State Is Derived

The unified `useNetworkState` hook (`src/hooks/useNetworkState.ts`) combines two data sources:

1. **`useOnlineStatus`** — Polls `https://1.1.1.1` with a HEAD request every 30 seconds. Returns `isOnline` (boolean) and `isChecking`.

2. **Wallet store error string** — After a failed network call, the error message is classified by `classifyNetworkError()` from `useNetworkStatus.ts` into `offline`, `service-unavailable`, or `none`.

**Resolution logic:**
1. If `isOnline === false` → `offline`
2. If `isOnline === true` and error matches service patterns (Horizon, 5xx, rate-limit) → `service-unavailable`
3. If `isOnline === true` and error matches offline patterns (Network request failed, ECONNRESET) → `degraded`
4. If `isOnline === true` and no error → `online`
5. If still checking and no error → `unknown`

The key distinction between `offline` and `degraded`: when the device can reach the internet (Cloudflare DNS ping succeeds) but Horizon requests fail, the network is considered *degraded* rather than *offline*. This tells the user that their connection works but Stellar services may be having issues.

---

## Screen Integration

### Tabs Layout (`app/(tabs)/_layout.tsx`)
- Renders `NetworkStateBanner` at the top of every tab screen.
- Uses `useNetworkState()` without an error string (connectivity check only).

### Home Screen (`app/(tabs)/index.tsx`)
- Uses `useNetworkState({ error })` with the wallet store error.
- Shows `NetworkStateBanner` with retry button.
- **Disables the Send button** when `disableWriteActions` is true (offline or service-unavailable).
- Pull-to-refresh triggers both wallet data refresh and connectivity re-check.

### Send Screen (`app/send.tsx`)
- Uses `useNetworkState({ error })` with the wallet store error.
- Shows `NetworkStateBanner` below the header.
- **Disables the Send Payment button** when offline or service-unavailable.
- Button label changes to "Network Unavailable" when network-disabled.

### Transaction History (`app/(tabs)/history.tsx`)
- Uses `useNetworkState({ error })` with the wallet store error.
- Shows `NetworkStateBanner` in the list header.
- Pull-to-refresh triggers both data refresh and connectivity re-check.
- Cached transactions remain visible when offline (data is preserved in the store).

### Vault Screen (`app/(tabs)/vault.tsx`)
- Uses `useNetworkState({ error })` with the wallet store error.
- Shows `NetworkStateBanner` above the vault card.
- **Disables Deposit, Withdraw, and Lock buttons** when network is offline or service-unavailable.
- Retry button triggers both connectivity check and vault data reload.

---

## UI Components

### `NetworkStateBanner` (`src/components/NetworkStateBanner.tsx`)
A unified banner that renders distinct UI for each network state. Replaces the previous `OfflineBanner` and `NetworkStatusBanner` for screens that use the new `useNetworkState` hook.

- **Offline**: Red-tinted banner with WifiOff icon
- **Degraded**: Yellow-tinted banner with AlertTriangle icon
- **Service-unavailable**: Orange-tinted banner with CloudOff icon
- **Online/Unknown**: Hidden

Includes a Retry button that triggers the provided `onRetry` callback.

### `OfflineBanner` (`src/components/OfflineBanner.tsx`)
The original offline-only banner. Still exists for backward compatibility but is no longer rendered in the tabs layout (replaced by `NetworkStateBanner`).

---

## Refresh Actions

| Trigger | Action |
|---|---|
| Pull-to-refresh on Home/History | `refreshWalletData()` + `checkNow()` |
| Retry button on NetworkStateBanner | `checkNow()` (connectivity re-check) |
| Retry button on vault error box | `loadBalance()` + `loadLocks()` |
| App foreground (via useOnlineStatus) | Automatic connectivity re-check |

---

## Diagnostics

`getDiagnostics()` in `src/utils/diagnostics.ts` now includes:
- `walletState.balanceState` — Current balance fetch lifecycle state
- `walletState.fundingStatus` — Account existence on the network
- `walletState.lastRefreshed` — Timestamp of last successful refresh
- `networkHealth.classifiedError` — Error classification from `classifyNetworkError()`
- `networkHealth.hasError` — Whether the wallet store has an active error

---

## Testing

- `src/types/network.test.ts` — Unit tests for `describeNetworkState()` (6 tests)
- `src/hooks/useNetworkState.test.ts` — Unit tests for the `useNetworkState` hook (7 tests)
- `src/components/NetworkStateBanner.test.tsx` — Component tests for the banner (7 tests)

---

## Architecture Notes

- The `useNetworkStatus` hook (error classifier) is retained for backward compatibility. New screens should prefer `useNetworkState` which wraps it.
- `useOnlineStatus` is not added as a Zustand store — it remains a React hook with internal state. This keeps the architecture simple: connectivity is a UI concern, not app state.
- No automatic retry/backoff is implemented. All retries are user-triggered (pull-to-refresh or Retry button). This is intentional for a mobile wallet — automatic retries can waste battery and confuse users.
- The degraded state allows write-actions to proceed (with a warning) because the device *does* have internet. The user may succeed on retry. Only true offline and service-unavailable states disable writes.
