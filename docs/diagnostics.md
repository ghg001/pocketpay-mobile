# Development Diagnostics Export

Debugging mobile applications often requires insight into the app's internal state. However, ensuring that sensitive user data is protected is paramount.

The Development Diagnostics feature allows contributors to easily view, export, and share non-sensitive app state when debugging issues or reporting bugs.

## How It Works

A **Diagnostics** option is available in the **About** section of the Settings tab. Tapping **Diagnostics** opens a dedicated status view displaying real-time system diagnostic info and provides an **Export Diagnostics Log** button to copy or send the redacted log via the native system share sheet.

## Redacted Information

The diagnostics payload is explicitly designed to **exclude** any sensitive data that could compromise a user's wallet or privacy. 

The following information is **REDACTED**:
- Secret Keys
- Public Keys
- Exact contact details (names, public keys)
- Full transaction history and amounts
- Full Horizon / Soroban RPC URLs (only the hostname is included)
- The vault contract ID (shown masked, e.g. `CABCDE…UVWXYZ`, or omitted entirely in mock mode)
- Wallet balance

## Included Information

The exported JSON string includes useful metadata for debugging:
- **Environment**: OS Platform, OS Version, App Version, Build Version, Development status
- **Network**: Network tier (`mainnet` / `testnet` / `custom`) and label, Horizon and Soroban RPC **hostnames only** (never the full URL), and vault mode (`configured` with a masked contract ID, or `mock`). Reuses the exact same classification the Settings screen shows (`src/features/settings/useNetworkEnvironment`), so this can never drift from what the user sees on-device.
- **Feature Flags**: every flag defined in `src/config/featureFlags.ts`, by name, with its enabled/disabled state — no description text, just enough to tell support which build variant a user is on.
- **Storage**: whether secure device storage (Keychain on iOS, Keystore on Android) is available via `SecureStore.isAvailableAsync()` — a capability check, not a read of anything actually stored.
- **App State**: Initialization status, UI Theme, total count of saved contacts
- **Wallet State**: Wallet initialization status (has public key), balance load status, transaction count, loading state, and the most recent wallet-store error message (if any, already redacted)
- **Last Reported Failure**: Snapshot from the global `reportError` funnel (ErrorBoundary / JS handler / unhandled rejection) — source, name, redacted message, fatal flag, timestamp

In **development builds**, the Diagnostics screen also exposes a **Trigger Test Error** control so contributors can exercise the root ErrorBoundary fallback (see [Error Handling](./error-handling.md) and the release testing checklist §5.3).

## Safe Sharing

The **Export Diagnostics Log** button opens the native system share sheet
(`Share.share`) with the redacted JSON as the message body — the same flow
as sharing any other text on the device (Messages, Mail, copy to clipboard
via the share sheet's own copy action, pasting into a GitHub issue, etc.).
Nothing is uploaded automatically; the user chooses the destination each
time, the same as they would for any other shared text.

Before sharing a diagnostics export publicly (a GitHub issue, a public
support forum), a reporter should still eyeball the payload once: this
feature redacts every known secret pattern (Stellar secret/public/muxed
keys, BIP-39 mnemonics, 64-char hex seeds — see
[`redactSensitive.ts`](../src/utils/redactSensitive.ts)) and never includes
balances, full transaction data, or full RPC URLs, but "known patterns" is
not a substitute for a human glance if a device is showing unexpected
behavior that might put unrelated data into an error message.

### Example Payload

```json
{
  "environment": {
    "platform": "ios",
    "osVersion": "16.4",
    "appVersion": "1.0.0",
    "isDevelopment": true
  },
  "network": {
    "tier": "testnet",
    "label": "Testnet",
    "horizonHost": "horizon-testnet.stellar.org",
    "sorobanHost": "soroban-testnet.stellar.org",
    "vaultMode": "mock",
    "vaultContractLabel": "Mock (no contract)"
  },
  "featureFlags": {
    "ENABLE_VAULT_EXPERIMENTAL": true,
    "SHOW_DEBUG_PANEL": false,
    "ENABLE_NEW_SEND_FLOW": false
  },
  "storage": {
    "secureStoreAvailable": true
  },
  "appState": {
    "isInitialized": true,
    "themeMode": "system",
    "contactsCount": 2
  },
  "walletState": {
    "hasPublicKey": true,
    "isBalanceLoaded": true,
    "transactionsCount": 5,
    "isLoading": false,
    "lastError": null
  },
  "lastReportedError": {
    "source": "ErrorBoundary",
    "name": "Error",
    "message": "Synthetic diagnostics error for ErrorBoundary testing",
    "isFatal": false,
    "timestamp": "2026-07-27T17:00:00.000Z"
  },
  "timestamp": "2026-07-27T17:00:00.000Z"
}
```

For the full app-wide error recovery model, see [Global Error Handling](./error-handling.md).