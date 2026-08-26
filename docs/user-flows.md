# PocketPay user flows

This document describes the expected screen sequence and UI states for PocketPay's core Stellar Testnet wallet journeys. Use it when changing navigation, wallet state, persistence, or transaction UI so that loading, empty, success, and failure behavior remains consistent.

## Shared navigation and state

- On launch, the root layout initializes app preferences and checks `expo-secure-store` for the wallet secret.
- While local state initializes, show a full-screen loading indicator; do not briefly expose authenticated screens or secret material.
- If a stored secret exists, derive its public key and route the user to the Home tab. Otherwise, route to onboarding.
- Store wallet secrets only in SecureStore. Never put a secret in route parameters, logs, AsyncStorage, screenshots, analytics, or network requests other than the locally signed Stellar transaction flow.
- Home and Activity use the wallet store's `isLoading`, `error`, `balance`, and `transactions` state. A failed refresh must stop loading and preserve a recoverable screen.
- PocketPay currently operates on Stellar Testnet. Screens that display balances, funding instructions, or receive details must make the network clear.

## Create a wallet

**Entry:** Onboarding (`/(auth)`) → **Create New Wallet** → `/(auth)/create`.

1. The initial Create screen explains that key generation happens on-device and shows **Generate Keypair**.
2. Tapping the button generates a Stellar keypair locally.
3. The backup state displays:
   - a prominent secret-key warning;
   - the public key;
   - the secret key and **Copy Secret** action; and
   - **I've Saved It, Continue**.
4. Copying the secret shows confirmation and leaves the user on the backup state.
5. Continuing opens a confirmation alert. Cancel returns to the backup state without saving anything.
6. Confirming **Yes, I saved it** writes the secret to SecureStore, updates the public key in wallet state, and shows a loading state on the button.
7. The wallet-created screen confirms success and offers **Go to Wallet**, which replaces the auth flow with the Home tab.
8. Home shows the backup reminder over the wallet until the user acknowledges it (see below).

### Backup reminder

Creating a wallet marks the backup reminder as pending (`walletStore.markBackupPending`), which the Home tab renders as a blocking `BackupReminderModal`.

- The reminder restates that the secret key is the only way back into the wallet, that PocketPay stores no copy of it, and that it must never be shared.
- It shows **no key material** — the secret key is revealed only on the creation screen, behind an explicit reveal.
- The **I Understand, Continue** action stays disabled until the user ticks the confirmation checkbox, then calls `walletStore.acknowledgeBackupReminder`.
- The reminder cannot be dismissed by tapping outside it or by the Android back button, and the pending flag is persisted — so an app restart before acknowledgement brings the reminder back rather than silently skipping it.
- Clearing the wallet clears the flag, so a newly created wallet is reminded again.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Initial | Explanation and Generate Keypair action. No key material is visible. |
| Generated | Public and secret keys plus backup warning and confirmation action. |
| Saving | Continue action is disabled/loading; repeated submissions are prevented. |
| Success | Wallet is stored securely and Home shows an unfunded `0.0000000 XLM` balance. |
| Backup reminder | Blocking reminder over Home; acknowledge action disabled until the confirmation is checked. |
| Reminder unacknowledged | Reminder reappears on the next launch until it is acknowledged. |
| Failure | Show a generation or secure-storage error and keep the user in the auth flow. |

## Import a wallet

**Entry:** Onboarding (`/(auth)`) → **Import Existing Wallet** → `/(auth)/import`.

1. The Import screen requests a 56-character Stellar secret beginning with `S` and masks the input.
2. Tapping **Import Wallet** with an empty value shows an inline required-field error.
3. On submission, trim the value and derive its public key with the Stellar SDK.
4. Invalid secrets show **Invalid secret key. Please check and try again.** The user remains on the screen and can edit the input.
5. A valid secret is saved to SecureStore and its public key is placed in wallet state.
6. Root navigation replaces the auth flow with Home. Wallet data then refreshes from Horizon.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Input | Masked secret field with no secret copied into app logs or navigation state. |
| Invalid | Inline actionable error; editing clears the old error. |
| Importing | Import action is disabled/loading. |
| Success | Home displays the derived public key and the account's Testnet data. |
| Sync failure | The imported wallet remains stored; Home exposes a recoverable refresh failure. |

## Fund a wallet

New keypairs do not exist on the Stellar ledger until they receive their first Testnet funding payment.

1. From Home, note the displayed public key and `0.0000000 XLM` balance.
2. Open **Receive** to copy or share the complete public key.
3. Open [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#create-account), select the Testnet account-funding flow, and submit the public key.
4. Return to PocketPay and pull to refresh Home.
5. While refreshing, the refresh control is active and duplicate refresh feedback is avoided.
6. On success, Home displays the funded XLM balance and the funding operation in Recent Activity.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Unfunded | Zero balance and empty activity are valid states, not fatal errors. |
| Funding externally | PocketPay remains usable; it does not claim success before Horizon confirms the account. |
| Refreshing | Home shows its refresh indicator while balance and activity load together. |
| Funded | Updated balance and received activity appear. |
| Horizon unavailable | Stop loading, retain the wallet, and allow another pull-to-refresh attempt. |

## Send XLM

**Entry:** Home → **Send** → `/send`.

1. The Send screen displays the currently available XLM balance.
2. Enter a destination public key, amount, and optional memo.
3. Tapping **Send Payment** validates locally before navigating:
   - destination and amount are required;
   - amount must be greater than zero; and
   - amount must not exceed the displayed balance or violate the XLM reserve floor.
4. Validation failures stay inline on the form so the user can correct the destination, amount, or memo safely.
5. If validation passes, navigate to `/sign-confirmation` with the payment details.

### Sign Confirmation

**Entry:** Send → **Send Payment** (after validation) → `/sign-confirmation`.

1. The Sign Confirmation screen shows the final source, destination, amount, memo, fee, and network details before any signing happens.
2. Tapping **Cancel** keeps signing separate from editing and lets the user abort before any transaction is signed or submitted.
3. Tapping **Sign Transaction** continues to `/review-transaction`.

### Transaction Review

**Entry:** Sign Confirmation → **Sign Transaction** → `/review-transaction`.

1. The Review screen displays the full transaction details: source, destination (with contact label if known), amount, memo, and network.
2. A signer info card shows which signer will be used (currently "This Device") and its security model.
3. A security notice reminds the user that the secret key never leaves the device.
4. Tapping **Sign & Send** initiates the signing handoff flow:
   - Phase transitions: `review` → `handoff` → `signing` → `submitting` → `completed`
   - A loading indicator shows the current phase.
5. On success, a success card appears with the transaction hash, then the user is navigated to the payment success screen.
6. On failure, a red error card appears with safe, actionable copy and a **Go Back** path so the user can leave the failed state without risking a duplicate submission.
7. At any point before submission, the user can tap **Cancel** to abort and return to Send.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Review | Full transaction details and signer info with Sign & Send / Cancel actions. |
| Handoff / Signing / Submitting | Loading indicator with phase-specific status text. Actions disabled. |
| Completed | Green success card with transaction hash. Auto-navigates to success screen. |
| Failed | Red error card with message and Dismiss action. |
| Cancelled | Yellow warning card. User returns to Send screen. |
| Review (missing data) | Screen redirects back if required params are missing. |

### Legacy Signing Modal

The original `SigningConfirmModal` remains available for backward compatibility. The review screen is the new default path for the signer handoff flow.

## Receive XLM

**Entry:** Home → **Receive** → `/receive`.

1. The Receive screen identifies Stellar Testnet and renders a QR code containing only the wallet public key.
2. The complete public key is displayed as selectable text.
3. **Copy Address** writes the public key to the clipboard.
4. **Share** opens the operating system share sheet with the public key and title **My Stellar Address**.
5. The sender completes payment outside this screen. Return Home and refresh to confirm receipt from Horizon.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Ready | QR code, full public key, Copy Address, and Share are available. |
| Missing key | Show **No public key found** and do not invoke copy/share with an empty value. |
| Payment pending | Do not claim receipt until a refresh returns the operation. |
| Received | Home and Activity show the incoming amount with received styling. |

## View balance and activity

**Entry:** Home for a three-item preview; Home → **See All** or the Activity tab for full history.

1. Entering Home or Activity triggers `refreshWalletData`.
2. Pull to refresh fetches the XLM balance and up to 20 recent Horizon operations in parallel.
3. Home displays total Testnet balance, the abbreviated public key, and the three most recent operations.
4. Activity displays the full fetched list with localized timestamps.
5. Operations sourced from the active public key are styled as sent with a minus sign; others are styled as received with a plus sign.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Loading | Refresh indicator is visible. |
| Empty | Home shows **No recent transactions**; Activity shows **No transactions found** and explanatory copy. |
| Populated | Newest operations appear first with direction, amount, and date/time. |
| Refresh failure | Loading ends, the screen remains usable, and the user can retry. |

## Manage contacts

**Entry:** Settings → **Address Book / Contacts** → `/contacts`.

1. With no saved contacts, display **No contacts yet** and two entry points: **+ Add Manually** and **Scan QR**.
2. **+ Add Manually** opens a Name / Stellar Address form with Save and Cancel actions, plus a **Scan QR Instead** shortcut into the scanner.
3. **Scan QR** opens the full-screen `QrScanner` in a modal. On a valid address it pre-fills the address (read-only) into the same form under **Save Scanned Contact**; the user only has to enter a name.
4. Saving validates that a name is present and that the address is a valid, non-duplicate 56-character Stellar public key (starting with `G`).
5. Validation errors appear inline (manual form) or as an alert (scan flow) and keep the entered values available for correction.
6. A valid contact is appended to the list and the form resets.
7. Cancel closes the form without adding a contact.
8. Tapping the delete icon opens a confirmation alert. Cancel keeps the contact; Delete removes it from state.

**Expected states**

| State | Expected UI and behavior |
| --- | --- |
| Empty | Empty-state copy and both Add Manually / Scan QR actions. |
| Scanning | Full-screen camera with a scan-window overlay and a Close action. |
| Adding / Confirming scan | Name/public-key form with Save and Cancel; the address field is read-only after a scan. |
| Invalid | Alert or inline error explains missing fields, an invalid Stellar public-key format, or a duplicate address. |
| Populated | Contact name and abbreviated public key are shown. |
| Deleting | Destructive confirmation prevents accidental removal. |

**QR scan debounce (QA notes, issue #104)**

Mobile QR scanners can fire more than one `onBarcodeScanned` callback for the same physical code before the resulting state update or navigation completes. `QrScanner` guards against this so a scan is only ever processed once:

- A `hasScanned` flag plus a `lastScanTime` timestamp (checked synchronously, so it isn't affected by React's batching) reject any scan that arrives while a previous one is still being processed or within `SCAN_DEBOUNCE_MS` (1.5s) of the last one.
- Once a scan is accepted, the camera's `onBarcodeScanned` prop is set to `undefined` so the camera stops delivering further events entirely, in addition to the guard above.
- On an invalid scan, the lock is released automatically after the debounce window so the user can immediately try again without leaving the scanner.
- On a valid scan, the lock is only released by unmounting/remounting the scanner (i.e. the user closing and reopening **Scan QR**), matching "reset it only when the user starts a new scan."
- Covered by the `AC11` test group in `__tests__/contacts.scan.test.tsx`, which drives the scanner's real `onBarcodeScanned` handler (not just its `onScan`/`onError` callbacks) to prove duplicate and rapid-fire events are ignored and that scanning again after closing/reopening works.

Contacts are currently an address-book management flow; the Send form does not yet provide contact selection. Document and test that integration separately when it is implemented.
