# PocketPay Mobile — Navigation Map

This document answers the onboarding questions:

- *"Which screen file do I open to edit the Home balance view?"*
- *"Which store slice owns wallet create/import vs. vault time-locks?"*
- *"What happens if I add a new route group inside `app/` — do I need to update the auth gate?"*
- *"Which screen do users land on after a successful payment?"*

All file paths are relative to repository root. All routes use **Expo Router v6 file-based routing**. For routing internals see the [Expo Router documentation](https://docs.expo.dev/router/introduction/).

---

## 1. Route Inventory (20 Routes Across 3 Groups)

Expo Router converts files in `app/` directly to routes. Parentheses in directory names (e.g. `(auth)`) are **route groups** — they organize layout nesting but do NOT appear in the URL / deep link path.

### 1.1 Unauthenticated Route Group: `(auth)/`

Shown when `walletStore.walletChecked === true` AND `publicKey === null` (no wallet on device). Stack navigator inside [app/(auth)/_layout.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(auth)/_layout.tsx).

| Route Path        | File on Disk                                                 | Purpose                                                      | Primary Entry: Navigate Here From…          |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------- |
| `/` (in auth)     | [app/(auth)/index.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(auth)/index.tsx) | Landing tile: **Create New Wallet** vs **Import Existing**   | RootLayout auth gate / app cold start        |
| `/create`         | [app/(auth)/create.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(auth)/create.tsx) | 3-step onboarding: Generate → Reveal keys → Confirm backup   | `(auth)/index` [Create New Wallet]           |
| `/import`         | [app/(auth)/import.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(auth)/import.tsx) | Paste secret → StrKey validation → activate wallet           | `(auth)/index` [Import Existing]             |

### 1.2 Authenticated Tab Group: `(tabs)/`

Shown when `walletStore.publicKey != null` AND `walletStore.walletChecked === true`. Bottom-tab navigator inside [app/(tabs)/_layout.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(tabs)/_layout.tsx). Adds an `OfflineBanner` at the top on all tabs.

| Route Path       | File on Disk                                                 | Tab Label | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ | --------- | ------------------------------------------------------------ |
| `/` (tabs home)  | [app/(tabs)/index.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(tabs)/index.tsx) | Home      | XLM Balance, Public Key, **Fund my Wallet** button, Backup reminder modal, 5 most-recent transactions |
| `/history`       | [app/(tabs)/history.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(tabs)/history.tsx) | Activity  | **SectionList grouped by date**, filter chips (All/Sent/Received), cursor-based pagination, pull-to-refresh, empty CTA → Send |
| `/vault`         | [app/(tabs)/vault.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(tabs)/vault.tsx) | Vault     | Soroban Savings Vault: balance card, Deposit / Withdraw CTAs, Pending/Matured lock lists, intro/education modals |
| `/settings`      | [app/(tabs)/settings.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(tabs)/settings.tsx) | Settings  | 4 sections — Preferences (theme, app lock), Wallet (export, sign out), Network & Environment (new), About (version, diagnostics) |

### 1.3 Stack / Modal Routes (Outside Groups)

Presented modally, or pushed onto the stack above the tabs.

| Route Path            | File on Disk                                                 | Presentation | Purpose                                                      | Primary Entry: Navigate Here From…          |
| --------------------- | ------------------------------------------------------------ | ------------ | ------------------------------------------------------------ | -------------------------------------------- |
| `/send`               | [app/send.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/send.tsx) | Stack push   | Payment form: destination, amount, memo. Validates before navigation to sign confirmation. | Home [Send XLM], Activity [New Payment] CTA, contact row tap, scan success |
| `/sign-confirmation`  | [app/sign-confirmation.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/sign-confirmation.tsx) | Stack push   | Pre-signing confirmation: shows transaction summary, explains signing implications, provides clear cancel option. Separates approval intent from execution. | Send form [Send Payment] button             |
| `/receive`            | [app/receive.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/receive.tsx) | Stack push   | Public-key QR code, address copy + share sheet              | Home [Receive] icon / button                 |
| `/scan`               | [app/scan.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/scan.tsx) | Stack push   | `expo-camera` QR scanner. On valid decode → navigates back to `/send` with `?destination=` prefilled. | Home [Scan] icon, Send form [Scan] button    |
| `/review-transaction` | [app/review-transaction.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/review-transaction.tsx) | Modal-like push | 8-phase Sign & Send flow: review summary → handoff → signing → submitting → completed / failed → success screen | Sign confirmation [Sign Transaction]         |
| `/payment-success`    | [app/payment-success.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/payment-success.tsx) | `replace` (no back history) | Post-send confirmation: big success checkmark, tx hash copy, explorer link, Back to Home | Review transaction [phase → completed]       |
| `/contacts`           | [app/contacts.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/contacts.tsx) | Stack push   | Address book: list, search, add/edit/delete, duplicate guards. Tapping a contact pushes to `/send` with destination prefilled. | Settings [Address Book], Send form [Pick contact] |
| `/diagnostics`        | [app/diagnostics.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/diagnostics.tsx) | Stack push   | Read-only dev/debug panel: redacted `getDiagnostics()` JSON, environment summary, synthetic-error trigger if enabled | Settings → About → [Open Diagnostics]       |
| `/transaction/:id`    | [app/transaction/[id].tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/transaction/%5Bid%5D.tsx) | Stack push   | **Dynamic route** (segment `:id = operation id`): single-transaction detail view, memo, fee, source/dest, explorer link | Activity row tap, Home recent-list tap      |
| `/vault/:id`          | [app/vault/[id].tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/vault/%5Bid%5D.tsx) | Stack push   | Dynamic: deep-linkable vault overview / account view (placeholder/detail) | Vault header card, from external deep link  |
| `/vault-lock/:id`     | [app/vault-lock/[id].tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/vault-lock/%5Bid%5D.tsx) | Stack push   | Dynamic: single time-lock detail — countdown, status, mature-withdraw CTA | Vault list row tap, matured notification     |

---

## 2. Navigation Tree — ASCII Diagram

Read top-down from the single JS entry point `expo-router/entry`. Arrow `→` means "navigates to"; `—` means "wraps as child"; `↩` means "navigates back with result / prefilled params".

```
                                     package.json: "main": "expo-router/entry"
                                                  │
                                                  ▼
                                      app/_layout.tsx (Root Stack)
                                      ├─ preload: shim.js (polyfills FIRST)
                                      ├─ ErrorBoundary + LockScreen wrap
                                      └─ Auth redirect gate (walletChecked + publicKey)
                                                   │
                              ┌─ NO wallet ───────┴───────── YES wallet ──┐
                              │                                           │
                              ▼                                           ▼
                    (auth)/_layout.tsx                          (tabs)/_layout.tsx
                   ┌────────────────────┐                      ┌─── OFFLINE BANNER ────┐
                   │ index (Create/Imp) │                      │  Home     Activity     │
                   │  ▼            ▼    │                      │  Vault    Settings     │
                   │ create      import │                      └────────────────────────┘
                   └────────────────────┘                                  │
                                                              ┌────────────┴─────────────┬──────────────┬────────────┬───────────────┐
                                                              ▼                         ▼              ▼            ▼              ▼
                                                          /send                    /receive       /scan       /contacts    /diagnostics
                                                              │  (form validates)                 │
                                                              ▼                                   └── on decode: /send ?destination=...
                                                     /sign-confirmation
                                                              │  (user approves signing intent)
                                                              ▼
                                                     /review-transaction
                                                              │
                                                     (8-phase signer SM)
                                                              │ success: replace (no back)
                                                              ▼
                                                     /payment-success  →  "Back to Home"  →  /(tabs)

                         DYNAMIC DEEP-LINKABLE ROUTES (stack-pushed from within their parent screen)
                         ├─ /transaction/:id     ← tap row in Home recent / Activity list
                         ├─ /vault/:id           ← tap Vault header / deep link scheme://stellar-pocketpay/vault/123
                         └─ /vault-lock/:id      ← tap lock row in Vault list
```

### 2.1 Back-Stack Behavior — Key Rules

Document these behaviors explicitly when modifying navigation:

- `/payment-success` uses **`router.replace`**, not `push`. The user cannot go "Back to signing" → always jumps to Home. This prevents accidental duplicate sends. See: [app/review-transaction.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/review-transaction.tsx)
- RootLayout auth gate uses **`router.replace`** when swapping `(auth)`↔`(tabs)`. This means tapping hardware Back after sign-out does NOT pop a tab screen back into view. See: [app/_layout.tsx auth gate](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/_layout.tsx#L46-L66)
- `/scan` calls **`router.back()` after setting params** on a successful decode. This returns to the form, preserving what the user had already typed into Amount/Memo before scanning. See [app/scan.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/scan.tsx).
- Dynamic routes `/transaction/:id`, `/vault/:id`, `/vault-lock/:id` accept **both deep links and programmatic pushes**. They must render gracefully even when the parent store state is empty (e.g. user taps a stored deep link before the wallet loads — show a loading or "Wallet not loaded yet" placeholder).

### 2.2 Deep Links (Scheme: `stellar-pocketpay://`)

Configured in `app.json` → `scheme: "stellar-pocketpay"`. Currently 5 deep-link targets are supported because Expo Router maps file paths 1:1 to scheme paths:

| Deep link                           | Resolves to                        | Prerequisite                          |
| ----------------------------------- | ---------------------------------- | ------------------------------------- |
| `stellar-pocketpay:///`             | Home (if wallet) or auth (if not)  | —                                     |
| `stellar-pocketpay:///send?destination=G…` | Prefilled Send form          | `destination` must be valid strkey    |
| `stellar-pocketpay:///receive`      | Receive screen                     | wallet loaded                         |
| `stellar-pocketpay:///transaction/tx-123` | Transaction detail          | wallet loaded **or** network fetch succeeds; tx ID validated |
| `stellar-pocketpay:///vault-lock/4` | Single lock detail view           | wallet loaded + id 4 in vaultStore.locks |

#### Transaction Deep Link Behavior

The transaction detail route (`/transaction/[id]`) supports full deep link resolution:

1. **In-memory lookup first** — if the transaction is already in the wallet store (e.g. user just sent it), it renders instantly.
2. **Network fetch fallback** — if not in the store, the app fetches the operation from Horizon via `fetchOperationById()`. Shows a loading spinner during fetch.
3. **Validation** — the `id` param is validated (non-empty, reasonable length, no control characters) before any network request. Invalid IDs show a clear error state.
4. **Not found / error states** — if the transaction doesn't exist on the network or the fetch fails, the user sees a descriptive error with Retry and Go Back actions.
5. **Auth gating** — if a logged-out user arrives via deep link, the URL is preserved and replayed after authentication completes (via `pendingDeepLink` in `app/_layout.tsx`).

---

## 3. Feature Boundaries & Ownership Grid

This is the most important section for contributors. If you are working on *feature X*, the "OWNED BY" columns tell you which files to edit and which you should touch only via exported actions/hooks.

**Legend:**

- 🟢 **Primary — edit here first.** The file owns the logic/UI for this feature.
- 🟡 **Secondary — read-only / call via exported hooks/actions.** Depend on this, do not modify unless the feature needs a new capability.
- 🔗 **Deep dependency — rarely need to modify.** Core layout/shell, shared types, shared components.
- 🚫 **Never modify for this feature.** Would break invariants.

### 3.1 Ownership Grid (7 Feature Areas)

| Feature Area             | UI Entry: File(s) 🟢                                        | Hooks / Feature Logic 🟢                                   | Store Owner 🟢                                                | Service Layer 🟡                                              | Shared Components 🟡 |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------- |
| **1. Wallet Lifecycle**  | `(auth)/create.tsx` `(auth)/import.tsx` `(tabs)/settings.tsx Wallet section` | — (inline orchestration in screen; import logic helper `parseStoredSecret` in store) | [store/walletStore.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/store/walletStore.ts) — create/import/export/clear, backup reminders | [services/stellar.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/services/stellar.ts#L17-L24) — `generateKeypair`, `validateSecretKey`; also SecureStore via store | SecretKeyReveal, WalletResetConfirmModal, BackupReminderModal |
| **2. Balance / History** | `(tabs)/index.tsx` (Top 5 + Balance card) `(tabs)/history.tsx` `transaction/[id].tsx` | Pagination inside walletStore actions; pull-to-refresh inline | walletStore → balance, transactions[], nextCursor, isLoadingMore | stellar.ts → fetchXlmBalance, fetchTransactionsPage, getExplorerTxUrl | TransactionListItem, EmptyState, NetworkStatusBanner |
| **3. Send / Receive**    | `send.tsx` `receive.tsx` `review-transaction.tsx` `payment-success.tsx` `scan.tsx` | **[hooks/useSignerHandoff.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/hooks/useSignerHandoff.ts)** — 8-phase orchestrator; validation.ts pure funcs | walletStore (getSecretKey, refresh after send), **[store/signerStore.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/store/signerStore.ts)** — handoff phases, lastResult | stellar.ts → sendXlmTransaction, fetchBaseFee; signer.ts → LocalSigner; pocketpay-sdk → validatePublicKey | QrScanner, FundButton, SigningConfirmModal, PaymentErrorBanner, DirtyFormConfirm |
| **4. QR / Scanner**      | `scan.tsx` `receive.tsx` (QR render)                        | — (inline Expo Camera barcode callbacks)                   | walletStore publicKey read only                              | —                                                            | **QrScanner** (component)  + react-native-qrcode-svg lib |
| **5. Address Book**      | `contacts.tsx` + Send form contact picker flow              | dedup helpers in `utils/contacts.ts`                       | [store/appStore.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/store/appStore.ts) → contacts[] + addContactIfUnique + removeContact | — (persists via AsyncStorage inside appStore actions)        | FormField, ConfirmModal     |
| **6. Vault**             | `(tabs)/vault.tsx` `vault/[id].tsx` `vault-lock/[id].tsx`   | **[features/vault/](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/features/vault)** — maturedLockWithdrawal, useMaturedLockWithdrawal, useVaultDepositForm, useVault | **[store/vaultStore.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/store/vaultStore.ts)** — balance, locks[], isConfigured | **[services/vault.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/services/vault.ts)** — Soroban RPC calls; stellar.ts — mock fallbacks | All Vault* Modal & List components (MaturedLockWithdrawalModal, VaultIntroModal, LockDurationSelector, …) |
| **7. Settings / Network / Theme / AppLock** | `(tabs)/settings.tsx` `diagnostics.tsx`             | **NEW:** [features/settings/useNetworkEnvironment.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/features/settings/useNetworkEnvironment.ts) (Network tier, hostname mask, warnings); [hooks/useTheme.ts](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/src/hooks/useTheme.ts) | appStore (theme, init), walletStore (secret export, clear), appLockStore (lock flag, biometrics authenticateAsync), vaultStore (locks purge, intro reset) | stellar.ts/vault.ts read only (isVaultConfigured); AsyncStorage + SecureStore via stores | AsyncActionButton, ConfirmModal, LockScreen |

### 3.2 Cross-Feature Boundary Rules (Hard Invariants)

1. **No screen imports a `services/` module directly.** Always go through the owning store/hook. The single exception today is `getExplorerTxUrl()` (pure string formatter — may be relaxed).
2. **No store imports another store.** If store A needs store B's data, read it inline inside the screen/hook with two separate `useXxxStore(…)` calls and combine locally.
3. **`features/` modules never import from `app/` (screens).** Features are pure logic + hooks; dependency arrow must point from app→features, never reverse.
4. **`components/` never import a store.** Always pass props/callbacks from the screen. This keeps the 36-component library portable.

---

## 4. End-to-End Payment Flow — Navigation Path (Send → Review → Success)

Contributor onboarding reference: every step along the send/receive user journey with navigation events marked.

```
 USER ACTIONS                  FILES / NAV EVENTS
 ─────────────────             ─────────────────────────────────────────────────────────────────
 ▼ Taps [Send XLM]             Home (index.tsx) → router.push('/send')
   on Home tile
 │
 ▼ Enters: dest + amount +     /send.tsx
   memo. [Scan] also ok →        ├─ Validates address, amount, memo (inline)
   prefills dest                  └─ All pass? → router.push('/review-transaction?dest=...&amt=...&memo=...')
 │
 ▼ Review screen renders:      /review-transaction.tsx
   amount + fee + dest + memo    ├─ signerStore.startReview() → phase = 'review'
   "Sign & Send" CTA             ├─ USER TAPS [Sign & Send]
 │                                │   ├─ useSignerHandoff.initiateSigning()
 │                                │   └─ phases: handoff → signing → submitting → completed
 │                                │         └─ service call: stellar.sendXlmTransaction
 │                                │
 │                                └─ phase==='completed' → setTimeout 1500ms →
 │                                                                 router.replace('/payment-success?hash=...')
 ▼ "Payment successful" +       /payment-success.tsx
   hash + explorer link          └─ [Back to Home] → router.replace('/(tabs)')
                                                                  │
 User is back on Home.           └─ walletStore.refreshWalletData(publicKey) has fired automatically
                                     → new balance visible, top of Activity shows the new row
```

**Why `replace` instead of `push` here?** If `payment-success` used `push`, the user could tap "Back" on the OS and land on Review Transaction *again*, with a stale amount already pre-signed and the Sign button still clickable — an invite for double-spend UX bugs. `replace` cleans the stack.

---

## 5. Route Assumptions & Adding New Routes

When you add a new route under `app/`, these assumptions are baked into the current architecture — **you are opting in to all of them** unless you explicitly modify the root layout or create a new route group.

### 5.1 Assumption A — Every route gets the 3 safety wrappers automatically

Every file under `app/` (including new ones you add) inherits, top-down:

1. **Polyfills loaded FIRST** via `shim.js` at `app/_layout.tsx:1` (Buffer, process, crypto.getRandomValues). If you add a new screen that imports StellarSdk before root renders (don't), it will throw.
2. **`ErrorBoundary` → `ErrorBoundaryFallback`** on render exceptions. (No partial crashes.)
3. **`GestureHandlerRootView`** → if your screen uses swipeable rows, gesture handlers work without re-wrapping.
4. **App Lock gate (`LockScreen` wrapper around `<Slot/>`)** — if `appLockStore.isLockEnabled && !isAuthenticated`, the screen is hidden behind biometrics regardless of how the user arrived (deep link, OS relaunch, or push notification).
5. **`NetworkStatusBanner` / `OfflineBanner`** — in `(tabs)/` sub-layout, banners render. Outside `(tabs)/`, you may need to include it yourself if offline behavior matters for the new screen.

### 5.2 Assumption B — Auth redirection gate runs for EVERY route, not just group roots

The `useEffect` in `app/_layout.tsx` (lines 46–66) redirects to `/(auth)` or `/(tabs)` based on:

- `appStore.isInitialized === true` AND
- `walletStore.walletChecked === true`

**If you add a new route in a new group, e.g. `(payments)/something.tsx`**, the root layout still knows nothing about it and will redirect based on the same two rules. If your new group is **meant to be reachable without a wallet** (e.g. a marketing onboarding flow), move it inside `(auth)/` — the gate redirects *any* wallet-absent route into the `(auth)` group.

### 5.3 Assumption C — Deep links always work (file path = URL)

Because we use `scheme: "stellar-pocketpay"` and Expo Router's filesystem-routing 1:1 mapping, any new file `/app/foo/bar.tsx` will instantly be reachable via `stellar-pocketpay:///foo/bar`.

**Secure your new routes the same way the existing ones are.** Example safe patterns:

- Dynamic routes `/transaction/:id` and `/vault-lock/:id` should check `publicKey` on mount and redirect to `/(auth)` when missing (never render a partial screen with empty on-chain data).
- If the parameter references a non-existent ID (user hand-edited the scheme URL), show a user-friendly "Transaction not found" state inside the dynamic screen — not a crash.

### 5.4 Assumption D — The `(tabs)` root and `(auth)` root both mount at `/`

Two files are both named `index.tsx` inside different route groups: `(auth)/index.tsx` and `(tabs)/index.tsx`. **Only one renders at a time**, decided by the root redirect gate.

This means:

- ❌ Do NOT add a top-level `app/index.tsx` alongside the two group index files — it will win the routing ambiguity and break the gate.
- ✅ When you want to add a *new unauthenticated screen*, always add it inside `(auth)/` as a sibling of `create.tsx`.
- ✅ When you want to add a *new authenticated tab* (e.g. `explore`), add it inside `(tabs)/` AND add its tab entry in `(tabs)/_layout.tsx` tabs config.

---

## 6. Cross-Reference — Other Docs Related to Navigation & Features

This document is one of several contributor references in `docs/`.

| Document                                                     | What It Covers / Cross-Reference |
| ------------------------------------------------------------ | --------------------------------- |
| [screen-inventory.md](./screen-inventory.md)                 | Per-screen UI state catalog (loading / empty / error / …). Complementary to this nav map: use it after you've found the right file. |
| [user-flows.md](./user-flows.md)                             | 9 detailed diagrams of user journeys, including onboarding, send, vault lock maturity. Read this before editing a flow you haven't touched. |
| [signer-handoff-design.md](./signer-handoff-design.md)       | The 8-phase signer state machine's original design rationale, external signer/hardware wallet roadmap. |
| [vault-integration-assumptions.md](./vault-integration-assumptions.md) | Contract addresses, test accounts, mock-vs-real switch. Required context before modifying `/vault`, `/vault/:id`, or `/vault-lock/:id`. |
| [release-testing-checklist.md](./release-testing-checklist.md) | Manual QA that re-traces every route above. If you change a route or add a new one, **you MUST add corresponding boxes to this checklist.** |
| [accessibility.md](./accessibility.md)                       | A11y labels, touch targets, focus order, announcements — apply to *every* new route you add. |
| [contacts.md](./contacts.md)                                 | Address book duplicate rules, data model, expected edge cases — specific to `/contacts`. |
| [qr-payment-requests.md](./qr-payment-requests.md)           | QR format / BIP-21 style prefix plans, future extensions — specific to `/receive` + `/scan`. |

---

## 7. Quick Finder — "I Need To Change … Where?"

Contributor cheat sheet. If you're about to make one of these common changes, open the left file first.

| Change Goal                                                  | Open This First 🎯                                             | Also Check                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Add a new bottom-tab screen                                  | `(tabs)/_layout.tsx` → add Tabs.Screen entry, then create the file | root auth gate in `_layout.tsx` if it needs special auth rules |
| Add a new pre-auth onboarding step                           | Add under `(auth)/` as a sibling of `create.tsx`, register in `(auth)/_layout.tsx` stack | release-testing-checklist §2 wallet flows                   |
| Change the "what screen after sign-in / after sign-out" rule | Auth gate in `app/_layout.tsx` lines 46–66                    | LockScreen component for app-lock behavior                  |
| Rename a route file                                          | 1) Rename the file; 2) Update every `router.push('/old-path')` site-wide (grep for the string); 3) Add a redirect or note the deep-link breakage | deep-link table §2.2 (changing file names breaks scheme URLs) |
| Add a new Store slice (e.g. `nftStore`)                      | Create under `src/store/nftStore.ts`, follow slice pattern (no cross-store imports), initialize in its own module top scope. Never add to a single root combine store. | `shim.js` if new service/SDK requires an extra polyfill      |
| Add a new feature section in Settings                        | `(tabs)/settings.tsx` as a new `<View>` section + new sub-constants in `features/settings/useNetworkEnvironment.ts` if env-derived | release-testing-checklist §7 Settings/Persistence           |
| Add a new payment / signing path (e.g. MUXED account, XLM path with base64 memo) | `/send.tsx` validators + `review-transaction.tsx` + `stellar.ts` send helper; route navigation stays the same | signer-handoff-design.md, user-flows.md § send payment flow |
