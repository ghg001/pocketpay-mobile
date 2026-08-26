# Pending Transaction Queue

This document describes the mobile pending transaction queue feature, which provides visibility into optimistic pending transactions on the History screen.

## Overview

When a user submits a payment, the app optimistically inserts a pending transaction record into the wallet store before Horizon confirms it. The pending transaction queue UI surfaces these entries in a dedicated section at the top of the History screen, giving users clear feedback that their transaction has been submitted and is awaiting network confirmation.

---

## Architecture

### Data source

Pending transactions are stored in `useWalletStore.pendingTransactions`, a `Record<string, TransactionRecord>` keyed by transaction hash. Entries are added by `addPendingTransaction()` and reconciled (removed) in `refreshWalletData()` once the real Horizon record appears.

```
Pending map: { [hash]: TransactionRecord & { status: 'pending' } }
```

### Reconciliation

During `refreshWalletData()`, each pending hash is checked against the Horizon response's `transaction_hash` field. If a match is found, the optimistic entry is dropped from the map to avoid duplicate display. Entries that don't reconcile are left in the map indefinitely — no forced expiry.

### Components

| Component | File | Role |
|---|---|---|
| `PendingTransactionItem` | `src/components/PendingTransactionItem.tsx` | Single pending transaction row |
| `PendingTransactionQueue` | `src/components/PendingTransactionQueue.tsx` | Section container with header, count badge, refresh, and empty state |

### History integration

The `PendingTransactionQueue` is rendered in the `ListHeaderComponent` of the History screen's `SectionList`, between the filter chips and the grouped transaction sections. It is always visible regardless of the active filter, ensuring users always see pending items.

---

## Acceptance Criteria

### PendingTransactionItem

| AC | Description |
|---|---|
| AC-PTI1 | Shows the correct direction label: "Sent XLM" or "Received XLM" based on `currentPublicKey` |
| AC-PTI2 | Displays the formatted amount with +/– prefix (e.g. `-10.0000000`, `+25.5000000`) |
| AC-PTI3 | Shows a `StatusBadge` with text "Pending" and tone "info" |
| AC-PTI4 | Shows relative time since submission (e.g. "2 min ago", "1 hr ago", "1d ago") |
| AC-PTI5 | Displays the transaction type tag: "Payment" for standard payments, "Vault" for `invoke_host_function` |
| AC-PTI6 | Does not crash with missing fields — gracefully handles undefined `amount`, `created_at`, etc. |

### PendingTransactionQueue

| AC | Description |
|---|---|
| AC-PTQ1 | Shows a `PendingTransactionItem` for each entry in `pendingTransactions` |
| AC-PTQ2 | Displays a count badge with the number of pending items in the section header |
| AC-PTQ3 | Shows a success-style empty state ("All caught up") when there are no pending transactions |
| AC-PTQ4 | Refresh button calls the `onRefresh` callback when tapped |
| AC-PTQ5 | Refresh button is disabled (non-responsive) while `isRefreshing` is true |
| AC-PTQ6 | Shows safe guidance text: "These transactions have been submitted and are waiting for network confirmation" |
| AC-PTQ7 | Does **not** offer retry/resend/try-again actions (unsafe retry messaging is avoided) |

---

## Design Decisions

### No retry actions

The queue deliberately does not expose any retry or resend mechanism. This is an explicit design requirement — retrying a Stellar transaction is unsafe (duplicate submissions, nonce conflicts, or re-signing with stale state). The guidance text makes it clear that pending transactions are automatically reconciled on pull-to-refresh.

### Always-visible section

The pending queue section is shown regardless of the active filter tab (All, Sent, Received, etc.). This ensures users never miss visibility into pending transactions, even when browsing a specific transaction type.

### Relative time display

The `PendingTransactionItem` shows time since submission using `formatRelativeTime()`:
- `< 1 min` → "just now"
- `1–59 min` → "X min ago"
- `1–23 hr` → "X hr ago"
- `≥ 24 hr` → "Xd ago"

---

## History filter fix

The "Pending" filter in the History screen previously only checked `tx.is_pending === true` (the Horizon field). Optimistic entries use `status: 'pending'` instead. The filter was updated to check both:

```typescript
const isPending = tx.is_pending === true || tx.status === 'pending';
```

This ensures the "Pending" filter correctly shows both Horizon-confirmed pending operations and locally inserted optimistic entries.

---

## Testing

Tests are in `__tests__/PendingTransactionItem.test.tsx` and `__tests__/PendingTransactionQueue.test.tsx`.

To run the tests:

```bash
npx jest PendingTransactionItem
npx jest PendingTransactionQueue
```

---

## Files

| File | Description |
|---|---|
| `src/components/PendingTransactionItem.tsx` | Single pending tx row component |
| `src/components/PendingTransactionQueue.tsx` | Queue section container |
| `app/(tabs)/history.tsx` | History screen (integration + filter fix) |
| `__tests__/PendingTransactionItem.test.tsx` | Item component tests (6 ACs) |
| `__tests__/PendingTransactionQueue.test.tsx` | Queue component tests (7 ACs) |
| `docs/pending-transaction-queue.md` | This document |
