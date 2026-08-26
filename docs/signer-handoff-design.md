# Signer Handoff Design

This document describes the signer handoff architecture introduced to make PocketPay future-safe for external wallet and hardware signer integrations.

## Overview

PocketPay currently signs Stellar transactions locally using a secret key stored in `expo-secure-store`. The signer handoff design decouples transaction construction from signing, so that the same payment flow can eventually support:

- **Local signing** (current): Secret key on device, signed in-app
- **External wallet** (future): Deep-link to a wallet app (e.g. LOBSTR, Solar) for approval
- **Hardware wallet** (future): Ledger or similar device over BLE/USB

This is a **design-first** change. Only the local signer is implemented. External and hardware signers are stubbed at the type level.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Review Screen                         │
│  (Transaction details, signer info, confirm/cancel)      │
└────────────────────────┬─────────────────────────────────┘
                         │  initiateSigning()
                         ▼
┌──────────────────────────────────────────────────────────┐
│               useSignerHandoff hook                       │
│  Orchestrates: idle -> review -> handoff -> signing       │
│                -> submitting -> completed/failed          │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐  ┌────────────┐  ┌──────────┐
    │ Local    │  │ External   │  │ Hardware │
    │ Signer   │  │ (future)   │  │ (future) │
    │ ──────── │  │ ────────── │  │ ──────── │
    │ SecureStore│ │ Deep-link  │  │ BLE/USB  │
    │ signing  │  │ callback   │  │ signing  │
    └──────────┘  └────────────┘  └──────────┘
```

### Key principle: Private keys never leave the device

The `Signer` interface receives a `buildTransaction` callback, **not** the secret key. Each signer implementation is responsible for obtaining signing material through its own secure channel:

- Local signer: reads from SecureStore
- External signer: opens wallet app, which holds its own keys
- Hardware signer: communicates with the device over secure transport

---

## Files

| File | Purpose |
|------|---------|
| `src/types/signer.ts` | All signer-related TypeScript types |
| `src/services/signer.ts` | `LocalSigner` implementation, error helpers, signer resolution |
| `src/store/signerStore.ts` | Zustand store for handoff phase, review, result, error state |
| `src/hooks/useSignerHandoff.ts` | Orchestration hook for the full signing lifecycle |
| `app/review-transaction.tsx` | Full-screen transaction review with phase UI |

---

## Types

### `SignerType`

```typescript
type SignerType = 'local' | 'external' | 'hardware';
```

### `HandoffPhase`

The state machine for the signing flow:

```
idle -> review -> handoff -> signing -> submitting -> completed
                   |                      |
                   v                      v
                cancelled              failed
```

### `Signer` interface

```typescript
interface Signer {
  readonly type: SignerType;
  readonly label: string;
  isAvailable(): Promise<boolean>;
  sign(
    review: TransactionReview,
    buildTransaction: () => Promise<Transaction>,
  ): Promise<Transaction>;
}
```

### `TransactionReview`

Signer-agnostic summary of what is being signed. Never includes the secret key. Contains: source, destination, amount, asset, memo, network, fee, timeout.

### `SignerError`

Structured error with classification (`user_cancelled`, `signer_unavailable`, `network_error`, etc.) for UI branching.

---

## Flow Walkthrough

### 1. User enters payment details (Send screen)

The Send screen validates destination, amount, and memo. On "Send Payment", it navigates to `/review-transaction` with the details as route params.

### 2. Transaction Review screen

Displays:
- **Transaction details card**: From, To (with contact label), Amount, Memo, Network
- **Signer info card**: Which signer will be used and its security model
- **Security notice**: Reminder that the secret key never leaves the device
- **Action buttons**: "Sign & Send" and "Cancel"

### 3. User confirms — signing begins

The review screen calls the signer through `useSignerHandoff`:

1. `store.startReview(review)` — enters `review` phase
2. `store.enterHandoff()` — enters `handoff` phase (for external signers, this is where the deep-link opens)
3. `store.enterSigning()` — enters `signing` phase (the `LocalSigner.sign()` call)
4. `store.enterSubmitting()` — enters `submitting` phase (Horizon submission)

### 4. Success or failure

- **Success**: `store.completeSigning(result)` → `completed` phase → auto-navigate to payment success
- **Failure**: `store.failSigning(error)` → `failed` phase → error displayed inline with dismiss action
- **Cancel**: `store.cancelSigning()` → `cancelled` phase → navigate back

---

## Cancellation and Failure States

### Cancellation

- User can tap "Cancel" at any point during `review`, `handoff`, or `signing` phases
- A `cancelledRef` flag prevents the signing callback from submitting after cancellation
- The `cancelled` phase shows a warning-styled card with a "Go Back" button

### Failure states

| Error Type | UI | Recovery |
|-----------|-----|----------|
| `user_cancelled` | Yellow warning card | Go back to edit |
| `signer_unavailable` | Red error card | Dismiss and retry |
| `signer_timeout` | Red error card | Retry |
| `network_error` | Red error card | Retry |
| `invalid_transaction` | Red error card | Go back to edit |
| `unknown` | Red error card | Dismiss and retry |

All failure states include the error message and a "Dismiss" button that navigates back to the Send screen.

---

## Current Limitations

1. **Only local signing is implemented.** The `LocalSigner` reads from SecureStore and signs in-app. External and hardware signers are type-level stubs only.

2. **No deep-link protocol for external wallets.** The handoff to an external wallet app (e.g. via `Linking.openURL()`) is not implemented. The `Signer` interface is designed to support this but no external signer exists.

3. **No transaction building abstraction.** The `sendXlmTransaction()` function in `stellar.ts` still builds, signs, and submits in one call. The review screen calls it directly. A full implementation would separate building from signing.

4. **No WalletConnect or similar protocol.** The design is compatible with adding WalletConnect, but no such integration exists.

5. **Single payment type only.** The review screen handles XLM payments. Multi-asset or smart contract operations would need additional review templates.

6. **The SigningConfirmModal is still available.** The existing modal-based confirmation in `SigningConfirmModal.tsx` is preserved for backward compatibility. The review screen is the new path.

---

## Adding a New Signer

To add an external wallet signer:

1. Implement the `Signer` interface in a new file (e.g. `src/services/externalSigner.ts`)
2. Implement `isAvailable()` to check if a compatible wallet app is installed
3. Implement `sign()` to open the wallet app via deep-link and await a callback
4. Register the signer in the signer store's `availableSigners`
5. The review screen will display the signer info and route through the same handoff flow

```typescript
// Example external signer skeleton
class ExternalWalletSigner implements Signer {
  readonly type = 'external' as const;
  readonly label = 'External Wallet';

  async isAvailable(): Promise<boolean> {
    // Check if a compatible wallet app is installed
    return Linking.canOpenURL('lobstr://');
  }

  async sign(review, buildTransaction): Promise<Transaction> {
    // 1. Build the unsigned transaction
    const tx = await buildTransaction();
    // 2. Serialize and open external wallet
    const serialized = tx.toEnvelope().toXDR('base64');
    await Linking.openURL(`lobstr://sign?xdr=${encodeURIComponent(serialized)}`);
    // 3. Await callback with signed transaction
    // (implementation depends on wallet app's protocol)
    throw new Error('Not implemented');
  }
}
```
