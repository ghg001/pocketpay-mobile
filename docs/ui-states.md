# UI State Catalogue

This document is the governance baseline for the six core UI states — **Loading, Empty, Error, Success, Disabled, Pending** — across PocketPay Mobile's primary screens: Wallet, Send, Receive, Transactions (Activity), Contacts, Vault, Settings, and Diagnostics.

Use this as a required review reference when building or changing a screen or reusable component. A row marked *not applicable* still needs a reason; it must not be omitted accidentally. Existing screens that do not yet meet a requirement should be treated as implementation gaps, not as alternative patterns. For full step-by-step journeys (e.g. the multi-step create/import wallet flow), see [Main wallet user flows](./user-flows.md). For vault-specific Testnet/mock-mode language, see [Vault UI Guidance](./vault-ui-guidance.md). For visual tokens (colours, spacing, the shared `Button`/`Input` components), see the [Design System guide](./design-system.md). All states must also pass the [Mobile Accessibility Audit Checklist](./accessibility.md).

State conventions used throughout the app:

- **Loading** — data or code needed to render the next stable state is being fetched or calculated. Keep existing usable data visible during refresh where possible, expose a busy state, and provide progress text for waits longer than a moment.
- **Empty** — the request succeeded but there is no content. Explain why the state is valid and provide a safe next action where one exists. Never present an empty result as an error.
- **Error** — the requested operation did not complete. Preserve safe user input and previously loaded data, use actionable copy, and provide retry or correction near the error.
- **Success** — an operation completed or valid data is available. Confirm what changed without relying on colour alone, then move to the next stable state.
- **Disabled** — an action is intentionally unavailable. Make the control visibly and semantically disabled and explain non-obvious prerequisites; never use disabled styling as the only busy signal.
- **Pending** — the app accepted an action but the result is not final. Name the phase (`Reviewing`, `Signing`, `Submitting`, `Waiting for confirmation`) and prevent duplicate execution. Pending may contain a loading indicator, but is distinct from initial data loading because user intent has already been accepted.

When more than one state could apply, render the most actionable state: a blocking error takes priority over empty, pending takes priority over disabled styling for the action in progress, and stale content should remain visible beneath non-blocking refresh or error feedback.

---

## Wallet (Home)

**Route:** `app/(tabs)/index.tsx` · **Store:** `useWalletStore` (`publicKey`, `balance`, `transactions`, `isLoading`, `refreshWalletData`)

| State | Behavior |
|---|---|
| **Loading** | Pull-to-refresh `RefreshControl` is active while balance and the 3-item recent activity preview load together. |
| **Empty** | A valid, non-error state: unfunded wallet shows `0.0000000 XLM` and **No recent transactions** — not treated as an error. |
| **Error** | A failed refresh stops loading and leaves the screen in a recoverable state (data preserved, user can pull to refresh again); if Horizon is unavailable, loading stops without clearing existing data. |
| **Success** | Populated balance, abbreviated public key, and the 3 most recent operations (sent shown with a minus sign, received with a plus sign). |
| **Disabled** | *Not applicable* — Home has no primary action to disable; the header/tab remains interactive during loading. |
| **Pending** | While a send/receive-related action is being prepared elsewhere in the flow, keep the wallet visible and avoid implying the balance is final if the transaction has not been confirmed yet. |

## Send

**Routes:** `app/send.tsx`, `app/review-transaction.tsx` · **Stores:** `useWalletStore`, `useSignerStore`

| State | Behavior |
|---|---|
| **Loading** | The review action shows a spinner while the transaction is signed and submitted; wallet refresh after completion must not make the confirmed result appear to regress. |
| **Empty** | *Not applicable* — the form intentionally renders with empty/default input values on entry. Empty fields are a form condition, not an empty-screen state. |
| **Error** | Local validation (missing/invalid destination or amount, amount ≤ 0, amount exceeds balance) is shown beside the field before review. A signing or submission failure shows safe, actionable copy and preserves the editable values for correction or retry. |
| **Success** | The completion state identifies the amount and recipient, refreshes wallet data, and offers an unambiguous path back to Wallet or Activity. |
| **Disabled** | **Review Transaction** is disabled until required fields are valid. Confirm/submit is disabled during signing or submission and when signing prerequisites are unavailable. |
| **Pending** | Use explicit phases for **Reviewing → Signing → Submitting → Waiting for confirmation**. The accepted payment cannot be submitted twice, and navigation away from an irreversible phase must be guarded. |

## Receive

**Route:** `app/receive.tsx` · **Store:** `useWalletStore` (`publicKey`)

| State | Behavior |
|---|---|
| **Loading** | *Not applicable* — the QR code and public key render immediately from local wallet state; no network fetch. |
| **Empty** | **No public key found** is shown if the public key is unavailable; **Copy Address** / **Share** must not be invoked with an empty value. |
| **Error** | A copy/share platform failure is shown with recoverable feedback while the address remains visible. A missing public key uses the empty state above, not a generic error. |
| **Success** | QR code, full public key (selectable text), **Copy Address**, and **Share** (opens OS share sheet with title "My Stellar Address") are all available. |
| **Disabled** | Copy/Share actions are visibly and semantically disabled when no public key is present. |
| **Pending** | No long-running pending state is expected; if share/copy is in progress, keep the UI responsive and return to the steady receive view immediately after the OS action is triggered. |

## Transactions (Activity)

**Route:** `app/(tabs)/history.tsx` · **Store:** `useWalletStore` (`transactions`, `isLoading`, `refreshWalletData`, `publicKey`)

| State | Behavior |
|---|---|
| **Loading** | `RefreshControl` indicator is visible while the full transaction list (up to 20 recent Horizon operations) loads. |
| **Empty** | **No transactions found** with explanatory copy — a valid state for a new/unfunded wallet. |
| **Error** | Refresh failure ends loading, the list remains usable with previously-loaded data, and another pull-to-refresh can be attempted. |
| **Success** | Full list renders newest-first, with sent/received direction, amount, and localized timestamp per row. |
| **Disabled** | *Not applicable* — list has no primary action to disable. |
| **Pending** | During an in-flight transfer, show the new transaction as pending or keep the list stable with a clear "pending confirmation" indicator until Horizon confirms it. |

## Contacts

**Route:** `app/contacts.tsx` · **Store:** `useAppStore` (`contacts`, `addContact`, `removeContact`)

| State | Behavior |
|---|---|
| **Loading** | **Scanning**: full-screen `QrScanner` camera view with a scan-window overlay and Close action (functions as this screen's loading/in-progress state). |
| **Empty** | **No contacts yet**, with **+ Add Manually** and **Scan QR** entry points. |
| **Error** | Invalid/duplicate address or missing name shows inline error (manual form) or an `Alert` (scan flow); entered values remain editable. Delete is gated behind a destructive confirmation alert to prevent accidental removal. |
| **Success** | Contact list populated with name + abbreviated public key per row; after a QR scan, the address field is pre-filled and read-only under **Save Scanned Contact**. |
| **Disabled** | Address field becomes read-only after a successful scan (user can only edit the name before saving). |
| **Pending** | While scanning or saving a scanned contact, show that the device is working and prevent duplicate submissions. |

**Note:** contacts scanning has a debounce guard (`hasScanned` + `lastScanTime`, `SCAN_DEBOUNCE_MS` = 1.5s) so a single physical QR code can't fire multiple scan events — see `user-flows.md` for detail and the `AC11` test group in `__tests__/contacts.scan.test.tsx`.

## Vault

**Route:** `app/(tabs)/vault.tsx` · **Store:** `useWalletStore` (`publicKey`, `getSecretKey`) / `vaultStore` (`locks`, `lockedBalance`, `unlockTime`)

| State | Behavior |
|---|---|
| **Loading** | `VaultLockList` shows a loading state while fetching/calculating lock status; balance fetch shows loading via `mockFetchVaultBalance` (mock mode) or Soroban simulation (real mode). |
| **Empty** | `VaultLockList` has a dedicated empty state when the user has no locks yet. |
| **Error** | Real-mode balance/deposit/withdraw calls that fail (e.g. RPC unavailable) surface an error — the app currently has **no RPC-failure fallback**, so this should be treated as an area needing careful, honest error copy rather than a silent failure. Contract/Soroban result codes are **not yet mapped** to user-friendly messages — mock functions currently throw generic errors only. |
| **Success** | Vault balance, TESTNET badge, and the locks list (each with locked amount, unlock date, status, and eligible actions for matured locks) render correctly. |
| **Disabled** | "Lock Funds (30 days)" and withdraw actions must clearly indicate **mock mode** when no real contract is configured (`EXPO_PUBLIC_VAULT_CONTRACT_ID` unset) — this isn't a literal disabled button, but the UI must not imply a live/production action is being taken. Matured vs. immature locks must be visually distinct so users can tell which locks are eligible for withdrawal. |
| **Pending** | Vault deposit, withdraw, and lock actions should show a clear in-flight state while the transaction is being prepared or confirmed, especially in mock mode where the outcome is simulated. |
| **Unavailable** | When no wallet is connected, the vault feature is disabled via configuration (`EXPO_PUBLIC_VAULT_ENABLED=false`), or the SDK reports the vault backend as not ready, the interactive form is replaced by a `VaultUnavailableState` card showing why the vault cannot be used and offering fallback navigation (to settings or retry). See `src/utils/vaultAvailability.ts` for evaluation logic. |


**Testnet & custody language:** every vault state must follow [Vault UI Guidance](./vault-ui-guidance.md) — no "savings account"/"bank"/"insured"/"secured" language, and mock mode must be visually distinguished from real contract mode at all times, per that doc's Summary Checklist.

---

## Settings

**Route:** `app/(tabs)/settings.tsx` · **Stores/hooks:** `useAppStore`, `useAppLockStore`, `useWalletStore`, `useNetworkEnvironment`

| State | Behavior |
|---|---|
| **Loading** | Secret-key access, app-lock authentication, and wallet reset show a labelled busy state on the initiating control or confirmation modal. The rest of the settings screen remains readable when safe. |
| **Empty** | A missing wallet renders `WalletEmptyState` with create/import actions instead of wallet-specific settings. An environment field with no configured value uses explicit **Not configured** copy rather than a blank row. |
| **Error** | Secure-storage, authentication, or reset failures use non-sensitive, actionable messages. Environment warnings remain beside the affected configuration and do not rely on badge colour alone. |
| **Success** | The selected theme/lock state and environment values are updated in place. Secret-key reveal succeeds only after explicit user action and remains clearly marked as sensitive. |
| **Disabled** | Destructive confirmation is disabled while reset is running. Controls whose prerequisites are unavailable expose a reason; development-only feature flags are omitted from production rather than rendered as an unexplained disabled row. |
| **Pending** | Lock enable/disable, authentication, and reset use one in-flight owner, ignore duplicate taps, and do not show the final toggle or signed-out state until persistence succeeds. |

## Diagnostics

**Route:** `app/diagnostics.tsx` · **Utility:** `getDiagnostics`

| State | Behavior |
|---|---|
| **Loading** | Initial load and manual refresh announce **Loading diagnostics**, set the content busy, and keep the last successful snapshot visible during refresh. |
| **Empty** | No recent error, no enabled feature flags, or no configured wallet is shown as an explicit valid value such as **None recorded this session** or **No wallet configured**, never as a blank section. |
| **Error** | Collection or JSON parsing failure shows a redacted inline error and a labelled **Retry** action. Previously collected diagnostics remain available if they are safe to display/export. |
| **Success** | Redacted environment, network, feature-flag, storage, wallet, and last-failure values are readable; export shares exactly the redacted snapshot described in [Diagnostics](./diagnostics.md). |
| **Disabled** | Export is disabled until a valid snapshot exists. Refresh is disabled while already refreshing. The synthetic error action is omitted outside development builds. |
| **Pending** | Refresh and export identify the active operation, prevent duplicate taps, and return focus to the initiating control or updated heading when the operation completes. |

---

## Reusable component contracts

Reusable components own state behavior that would otherwise be reimplemented inconsistently. A screen may add context, but must not weaken these contracts.

| Component or pattern | Required state contract |
|---|---|
| `Button` / `AsyncActionButton` | Disable immediately when an async action starts, show stable loading text, expose `disabled` and `busy`, ignore duplicate presses, and restore the enabled state after failure. |
| `Input` / `FormField` | Keep a persistent visible label, place validation feedback beside the field, preserve the entered value after recoverable errors, and expose read-only/disabled state semantically. |
| `LoadingState` / `EmptyState` / unavailable-state cards | State what is happening, occupy a predictable layout, and offer a labelled retry or next action when one exists. Empty and unavailable are not interchangeable with error. |
| Error and status banners | Use safe, actionable copy; pair colour with text/icon; announce meaningful changes; and remain visible long enough to act on. |
| `TransactionListItem` / `StatusBadge` | Present direction, amount, asset, counterparty, time, and pending/confirmed/failed status as one understandable summary. Unknown status must not be guessed. |
| `ConfirmModal` / review-confirm patterns | Name the consequence, provide cancel and confirm paths, trap accessibility focus while open, make destructive intent explicit, and lock both dismissal and confirmation while the action is pending. |
| `QrScanner` and QR display | Provide permission, scanning, invalid-code, and close states; debounce scan results; and always provide a non-camera/non-visual alternative. |

### Component review questions

- Does a component derive visual copy, interaction blocking, and accessibility state from one source of truth?
- Can two rapid taps start the action twice, including before React re-renders?
- What does the user see after a rejected promise, lost network connection, empty result, or unmount during completion?
- Does the component preserve safe content and focus across loading, retry, modal open/close, and success?
- Are state differences communicated with text or semantics in addition to colour and animation?
- Do focused tests query controls by role/label and cover default, disabled, pending, success, and error behavior that the component owns?

## Complex flow examples

### Send transaction

1. **Editing / disabled:** keep **Review Transaction** disabled until destination and amount are valid; validation errors remain beside their fields.
2. **Review / pending:** present recipient, amount, asset, memo, fee, network, and signer as one reviewable summary. No funds have been sent yet.
3. **Signing and submitting / pending + loading:** change the phase copy, mark the confirm action busy/disabled, guard navigation, and prevent a second submission.
4. **Confirmed / success:** show a durable receipt, then reconcile Wallet and Activity without hiding the receipt behind a refresh spinner.
5. **Rejected / error:** explain whether the user should edit, retry, or wait; retain safe form values and never display raw SDK or secret material.

### Vault action

1. Resolve unavailable, mock, or configured mode before enabling the action.
2. Review the amount, unlock conditions, network, custody limitations, and mode before confirmation.
3. During preparation/submission/confirmation, show the named pending phase and disable conflicting deposit/withdraw actions.
4. On success, update the lock list and balance together. On failure, keep the prior snapshot and show vault-specific recovery guidance.

### Diagnostics refresh and export

1. Keep the previous redacted snapshot visible while refresh is pending and disable duplicate refresh.
2. Replace the snapshot only after collection and parsing succeed; otherwise retain it with an inline retryable error.
3. Enable export only for a valid redacted snapshot, identify the OS share-sheet transition, and do not add secrets or raw exception payloads.

## Screens governed elsewhere

Other routes (`app/(auth)/*` onboarding, `app/scan.tsx`, `app/payment-success.tsx`, `app/transaction/*`) have their state behavior documented step-by-step in [user-flows.md](./user-flows.md). They still follow the state definitions and reusable-component contracts above.
