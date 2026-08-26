# Mobile Architecture Readiness Review

> Status: **Draft for discussion** — Issue [#374](https://github.com/Axionvera/pocketpay-mobile/issues/374)
> Review date: 2026-07-27
> Reviewed revision: branch `docs/374-architecture-readiness-review` (at commit `187eea6`)

This review assesses whether the PocketPay mobile app's architecture is ready to keep
absorbing features across wallet, payment, transaction, contacts, vault, settings,
diagnostics, and security flows. It is deliberately blunt: the goal is to surface risk
early, not to grade the work. Much of the codebase is careful and well-commented — the
findings below concentrate on the places where growth has outpaced structure.

---

## 1. Scope & method

**What was reviewed** — static reading of the repository at the revision above:

| Area | Paths |
|---|---|
| Navigation & screens | `app/` (22 screen files) |
| Feature modules | `src/features/` |
| State | `src/store/` (5 Zustand stores), `src/hooks/` |
| SDK integration | `src/sdk-stub/`, `src/types/pocketpay-sdk.d.ts`, `api-reports/`, `scripts/check-sdk-api.js` |
| Secure storage & vault | `src/services/`, `src/utils/vault*.ts` |
| Components | `src/components/` (39 components) |
| Tests | `__tests__/`, `tests/`, `src/utils/__tests__/` (34 test files) |
| Onboarding | `README.md`, `CONTRIBUTING.md`, `.env*`, `.github/workflows/` |

**Method** — reading source, cross-referencing documentation claims against the code that
implements them, and mapping test imports to modules to derive real coverage.

**What was _not_ done** — see [§12 Limitations](#12-limitations-of-this-review). In short:
the app was never launched, no test was executed, no dependency was installed, and no
Soroban contract was deployed. Every finding is derived from reading code. Findings marked
_(inferred)_ are reasoned from the source but were not observed at runtime.

---

## 2. Executive summary

| ID | Finding | Severity | Area |
|---|---|---|---|
| [ARCH-01](#arch-01) | SDK type contract contradicts the stub implementation; address validation can fail open | **High** | SDK |
| [ARCH-02](#arch-02) | The vault "lock" feature never touches the chain, even with a live contract | **High** | Vault |
| [ARCH-03](#arch-03) | Vault receipts read stale state — successful actions can report "Failed" | **High** | Vault |
| [ARCH-04](#arch-04) | Soroban submission never polls for confirmation | **High** | SDK |
| [ARCH-05](#arch-05) | No CI runs the test suite, contrary to `CONTRIBUTING.md` | **High** | Process |
| [ARCH-06](#arch-06) | Duplicate `expo-local-authentication` key in `package.json` | **High** | Deps |
| [ARCH-07](#arch-07) | `.env` is committed despite `.gitignore` and contributor guidance | **Medium‑High** | Security |
| [ARCH-08](#arch-08) | Secret key retrieval has no authentication gate | **Medium‑High** | Security |
| [ARCH-09](#arch-09) | Vault locks (financial state) persist unencrypted with collision-prone IDs | **Medium‑High** | Security |
| [ARCH-10](#arch-10) | `src/features/` covers 3 of ~8 domains — feature boundaries are inconsistent | **Medium** | Boundaries |
| [ARCH-22](#arch-22) | Eleven root-level routes are declared by no navigator; three header conventions | **Medium** | Navigation |
| [ARCH-11](#arch-11) | Four divergent async-state patterns; vault tracks submission three times | **Medium** | State |
| [ARCH-12](#arch-12) | Three independent, mutually inconsistent vault gating systems | **Medium** | State |
| [ARCH-13](#arch-13) | The SDK compatibility guard never checks the implementation it guards | **Medium** | SDK |
| [ARCH-14](#arch-14) | Security-critical modules have zero test coverage | **Medium** | Tests |
| [ARCH-15](#arch-15) | The entire Soroban service layer is mocked in every test | **Medium** | Tests |
| [ARCH-16](#arch-16) | Dead duplicate component; partial barrel export | **Low‑Medium** | Components |
| [ARCH-17](#arch-17) | Feature-flag screen renders controls that do nothing | **Low‑Medium** | Settings |
| [ARCH-18](#arch-18) | Business logic concentrated in screen components | **Medium** | Boundaries |
| [ARCH-19](#arch-19) | Contributor docs contradict the codebase in three places | **Medium** | Onboarding |
| [ARCH-20](#arch-20) | Three lockfiles; `.env`/`.env.example` drift | **Low‑Medium** | Onboarding |
| [ARCH-23](#arch-23) | 36 doc links point at absolute paths on other developers' machines | **Low‑Medium** | Onboarding |
| [ARCH-21](#arch-21) | Untyped Horizon boundary; dead code in `walletStore` | **Low** | State |

---

## 3. Feature boundaries & navigation

### ARCH-10
**`src/features/` covers 3 of roughly 8 domains — Medium**

The repository has begun migrating to feature modules, but the migration stopped early:

| Domain | Feature module? | Where the logic actually lives |
|---|---|---|
| Transactions | ✅ `src/features/transactions/` | partly — also `src/utils/transactions.ts` |
| Vault | ✅ `src/features/vault/` | partly — also `src/store/vaultStore.ts`, `src/services/vault.ts`, 4 hooks, 3 utils |
| Settings | ✅ `src/features/settings/` | one hook only |
| Wallet | ❌ | `src/store/walletStore.ts` |
| Payments / send | ❌ | `app/send.tsx`, `src/utils/paymentErrors.ts`, `src/components/SendPaymentForm.tsx` |
| Contacts | ❌ | `src/store/appStore.ts`, `src/utils/contacts.ts`, `app/contacts.tsx` |
| Signing / security | ❌ | `src/store/signerStore.ts`, `src/store/appLockStore.ts`, `src/services/signer.ts` |
| Diagnostics | ❌ | `src/utils/diagnostics.ts`, `app/diagnostics.tsx` |

Contacts is the clearest boundary problem: it is a first-class user feature, but its state
lives inside a general-purpose `appStore` alongside theme preferences
(`src/store/appStore.ts:31-49`). A contributor asked to "change contacts" has no single
place to look.

The result is that `src/features/` currently signals a convention the codebase does not
actually follow, which is more confusing than having no convention at all.

**Remediation** — either finish the migration (move wallet, payments, contacts, signing,
diagnostics into `src/features/`) or document explicitly which domains are intentionally
excluded and why. Pick one and record it in `CONTRIBUTING.md`.

### ARCH-18
**Business logic concentrated in screen components — Medium**

`app/(tabs)/vault.tsx` is 595 lines and owns orchestration that belongs in a feature
module: it composes the sign/submit/confirm sequence inline (`app/(tabs)/vault.tsx:143-200`),
re-implements balance validation that `validateAmount` already performs
(`app/(tabs)/vault.tsx:120-132` vs `src/utils/validation.ts:131-166`), and wires three
separate capability systems together (lines 38, 57-61).

`app/_layout.tsx:47-67` additionally hard-codes route names in the auth-redirect guard
(`segments[0] !== 'send' && segments[0] !== 'receive' && segments[0] !== 'review-transaction'`),
so adding a screen that must be reachable pre-auth requires editing this conditional — an
easy step to miss, and one with a security-relevant failure mode.

**Remediation** — extract the vault action orchestration into `src/features/vault/`, and
replace the route allow-list with a declarative constant (e.g. `PUBLIC_ROUTES`) exported
from the routing layer.

### ARCH-22
**Eleven root-level routes are declared by no navigator — Medium**

The route tree has three tiers, but only two of them are declared:

| Tier | Navigator | Routes |
|---|---|---|
| `(auth)` | `<Stack>` — `app/(auth)/_layout.tsx:8-21` | index, create, import |
| `(tabs)` | `<Tabs>` — `app/(tabs)/_layout.tsx:13-67` | index, history, vault, settings |
| root | **none** — `app/_layout.tsx:138` renders `<Slot />` | 11 routes |

`<Slot />` renders whichever child route matches, without stack semantics. The eleven
root-level routes — `send`, `receive`, `scan`, `contacts`, `diagnostics`,
`review-transaction`, `payment-success`, `sign-confirmation`, `transaction/[id]`,
`vault/[id]`, `vault-lock/[id]` — therefore have no navigator declaring their titles,
headers, presentation style, or back behaviour.

Each screen compensates differently, producing three coexisting header conventions:

- **4 screens** use the custom `ScreenHeader` component (`send`, `receive`,
  `review-transaction`, `sign-confirmation`).
- **1 screen** declares `<Stack.Screen options={{ title: 'Diagnostics' }} />`
  (`app/diagnostics.tsx:38`) — addressing a `Stack` navigator that the root layout does not
  provide.
- **6 screens** do neither (`contacts`, `payment-success`, `scan`, and the three dynamic
  `[id]` routes).

There is also no `app/+not-found.tsx`, so an unmatched route has no handler. The app depends
on `expo-linking` (`package.json:42`), which makes deep links — and therefore unmatched
paths — a realistic entry point. _(inferred — deep-link handling was not traced end to end.)_

`docs/navigation-map.md` documents the intended route structure and should be the reference
when reconciling this.

**Remediation** — declare a root `<Stack>` (or a nested one for the non-tab routes) so
titles, presentation, and back behaviour come from a single place, then converge on one
header convention. Add a `+not-found` route.

---

## 4. State management & duplication

### ARCH-11
**Four divergent async-state patterns — Medium**

Every store models "an operation is in flight" differently:

| Store | Pattern | Evidence |
|---|---|---|
| `walletStore` | Multiple ad-hoc booleans + two error fields | `isLoading`, `isLoadingMore`, `isFunding`, `error`, `fundError` — `src/store/walletStore.ts:39-42,56` |
| `vaultStore` | Per-resource booleans + one error field | `isLoadingBalance`, `isLoadingLocks`, `isSubmitting`, `balanceError` — `src/store/vaultStore.ts:36-39` |
| `appLockStore` | Single boolean + error | `isAuthenticating`, `authError` — `src/store/appLockStore.ts:18-26` |
| `signerStore` | Explicit phase state machine | `phase: HandoffPhase` — `src/store/signerStore.ts:17` |

A fifth pattern exists at the hook layer: `useVaultAction` implements its own
`signing → submission → pending → confirmed` machine (`src/hooks/useVaultAction.ts:20-49`),
and `useVaultDepositForm` maintains yet another `isSubmitting` / `isSuccess` / `submitError`
triple (`src/features/vault/useVaultDepositForm.ts:31-35`).

The cost is visible in the vault screen, which must manually reconcile three of them:

```tsx
// app/(tabs)/vault.tsx:341
editable={!(isSubmitting || depositForm.isSubmitting)}
// app/(tabs)/vault.tsx:347
isLoading={depositForm.isSubmitting || (isSubmitting && pendingAction === 'deposit')}
```

**Remediation** — standardise on the phase-machine approach already proven in
`signerStore`, and expose one shared helper (e.g. `createAsyncSlice`) that every store
uses. Retire the per-store boolean pairs.

### ARCH-12
**Three independent, mutually inconsistent vault gating systems — Medium**

Three mechanisms answer "may the user use the vault?", and they disagree:

1. **`useVaultAvailability`** reads the env flag —
   `vaultEnabledFlag: process.env.EXPO_PUBLIC_VAULT_ENABLED` (`src/hooks/useVaultAvailability.ts:22`).
2. **`useVaultCapabilities`** hard-codes the same concerns to `true`:
   ```ts
   // src/hooks/useVaultCapabilities.ts:37-38
   isFeatureEnabled: true, // Feature flag check; defaults to true
   isSdkReady: true,       // SDK readiness; assumed true until SDK integration
   ```
3. **`FEATURE_FLAGS.ENABLE_VAULT_EXPERIMENTAL`** exists in `src/config/featureFlags.ts:3-7`
   and is read by no vault code at all.

Both hooks are consumed simultaneously by the same screen
(`app/(tabs)/vault.tsx:38,57`). Setting `EXPO_PUBLIC_VAULT_ENABLED=false` therefore
produces a contradictory UI: `useVaultAvailability` reports the vault unavailable while
`useVaultCapabilities` still reports every action supported. _(inferred — not observed at
runtime.)_

**Remediation** — make `useVaultCapabilities` consume `useVaultAvailability` rather than
re-deriving its inputs, and either wire `ENABLE_VAULT_EXPERIMENTAL` in or delete it.

### ARCH-21
**Untyped Horizon boundary and dead code — Low**

- `TransactionRecord = Record<string, any> & { id: string }` (`src/store/walletStore.ts:27`)
  leaves the entire Horizon response untyped. The accompanying comment acknowledges this is
  a stopgap.
- `const isZero = balance === '0.0000000';` (`src/store/walletStore.ts:241`) is computed and
  never used.
- `refreshWalletData` sets `fundingStatus: 'funded'` on any successful balance fetch
  (`src/store/walletStore.ts:252`), including a zero balance — which contradicts the
  dedicated `checkFundingStatus` logic at lines 365-388.
- `useVault` destructures the whole store without selectors (`src/hooks/useVault.ts:6-22`),
  so every vault screen re-renders on any vault state change, while the sibling hooks
  (`useVaultAvailability`, `useVaultCapabilities`) correctly use selectors.

**Remediation** — type the Horizon payload at the service boundary, remove the dead
assignment, reconcile the two funding-status paths, and convert `useVault` to selectors.

---

## 5. SDK integration & blockers

The real `pocketpay-sdk` is not published. The app depends on a local stub
(`package.json:49` → `"pocketpay-sdk": "file:./src/sdk-stub"`), with an ambient type
contract in `src/types/pocketpay-sdk.d.ts` and a snapshot guard in `api-reports/`.
This is a reasonable strategy — but the three pieces have drifted apart.

### ARCH-01
**The declared SDK contract contradicts the stub implementation — High**

| Export | Declared (`src/types/pocketpay-sdk.d.ts`) | Implemented (`src/sdk-stub/pocketpay-sdk.js`) |
|---|---|---|
| `validatePublicKey` | `(publicKey: string) => boolean` (line 7) | returns `undefined`; **throws** on invalid (lines 3-9) |
| `importWallet` | `(mnemonic: string) => Promise<{publicKey, secretKey}>` (line 8) | takes a **secret key**, is **synchronous**, returns `{publicKey}` only (lines 11-18) |

This is not a cosmetic mismatch — the app depends on the *undeclared* behaviour:

```ts
// src/utils/validation.ts:32-36 — relies on the throw, and not the boolean
try {
  validatePublicKey(trimmed);
} catch {
  return "This doesn't look like a valid Stellar address. …";
}
```

The declared contract says `validatePublicKey` returns `boolean`. If the real SDK ships
honouring its own declared signature — returning `false` instead of throwing — this `try`
block never catches, `validateAddress` returns `null`, and **every** address is accepted as
valid, including malformed ones. Payment destination validation would fail open. _(inferred
— depends on the unreleased SDK's behaviour, which is exactly why it is worth pinning
down now.)_

Separately, `app/(auth)/import.tsx:45` calls `await importWallet(trimmedKey)` where
`trimmedKey` is a 56-character secret key validated to start with `"S"` (lines 34-42) —
passed to a parameter the contract names `mnemonic`. TypeScript cannot catch this because
both are `string`.

A third and fourth variant of the same API exist in test doubles:
`__mocks__/pocketpay-sdk.ts:2-8` mirrors the throwing stub, while
`__tests__/send.test.tsx:38` overrides it with `jest.fn(() => true)`. No test exercises the
declared contract.

**Remediation** — decide which behaviour is canonical, then make the declaration, the stub,
and both mocks agree. Given the failure mode, prefer the total form
(`validatePublicKey(key: string): boolean`) and update `validateAddress` to branch on the
return value rather than on an exception. Confirm `importWallet`'s intended input
(mnemonic vs secret key) with the SDK team before the real package lands — this is a
genuine integration blocker.

### ARCH-13
**The compatibility guard never checks the implementation — Medium**

`scripts/check-sdk-api.js` reads exactly one input file:

```js
// scripts/check-sdk-api.js:23
const DECL_FILE = path.join(ROOT, 'src/types/pocketpay-sdk.d.ts');
```

It parses the `.d.ts`, prints a normalised snapshot, and diffs it against
`api-reports/pocketpay-sdk.api.md`. It never loads `src/sdk-stub/pocketpay-sdk.js`. The
divergence documented in ARCH-01 is therefore invisible to the check — and the check passes
today.

`CONTRIBUTING.md:135` nonetheless instructs: *"If your change touches
`src/types/pocketpay-sdk.d.ts` or `src/sdk-stub/`, run `npm run api:check`"*, and
`.github/workflows/api-check.yml:7,15` triggers the workflow on `src/sdk-stub/**` changes.
Both imply a guarantee the script does not provide.

**Remediation** — extend the script to import the stub and assert that every declared export
exists with matching arity and sync/async shape, or narrow the documentation and workflow
path filters to state plainly that only the declaration is snapshotted.

### ARCH-04
**Soroban submission never polls for confirmation — High**

```ts
// src/services/vault.ts:150-160
const sendResponse = await server.sendTransaction(prepared);
if (sendResponse.status === 'ERROR') { … }

const confirmation = await server.getTransaction(sendResponse.hash);
if (confirmation.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
  throw new Error(`Vault ${method} failed on-chain (status: ${confirmation.status})`);
}
```

`sendTransaction` returns as soon as the RPC node accepts the transaction; the ledger has
not closed yet. Calling `getTransaction` immediately, with no retry or backoff, will
typically observe `NOT_FOUND` or `PENDING` and throw — reporting a failure for a deposit or
withdrawal that in fact succeeds on-chain moments later. _(inferred — no contract was
deployed to observe this, but it follows from the Soroban RPC submission model.)_

This is the single most likely blocker the first live-contract integration will hit.

**Remediation** — poll `getTransaction` with backoff until the status leaves `NOT_FOUND`/
`PENDING` or a timeout elapses, and surface `PENDING` to the UI as a distinct state rather
than as an error.

---

## 6. Secure storage & vault readiness

### ARCH-02
**The vault "lock" feature never touches the chain — High**

`addLock` writes a JSON record to `AsyncStorage` and returns; it makes no contract call and
takes no secret key (`src/store/vaultStore.ts:118-135`). `unlockLock` simply filters the
record out of the array (`src/store/vaultStore.ts:137-146`). Neither branches on
`isConfigured`.

The screen reports success regardless:

```tsx
// app/(tabs)/vault.tsx:156-159
if (pendingAction === 'lock') {
  const unlockDate = new Date(Date.now() + LOCK_PERIOD_SECONDS * 1000);
  await addLock(depositForm.amount, unlockDate.toISOString());
  return { txHash: 'mock-lock' };
}
```

Consequently, when a real contract **is** configured — and the UI is displaying
*"Connected to a live Soroban smart contract … Deposits and withdrawals submit real
transactions"* (`app/(tabs)/vault.tsx:287-291`) — pressing **"Set Aside for 30 Days"** moves
no funds, yet presents a success receipt. The unlock path is blunter still, surfacing
developer language directly to users:

```tsx
// app/(tabs)/vault.tsx:208
Alert.alert('Success', 'Funds unlocked! (mock)');
```

`README.md:10` does state the vault is "mock-backed by default", which covers the default
path honestly. The gap is the *configured* path: the lock feature stays mock while the
surrounding UI asserts it is live.

**Remediation** — before any contract goes live, either implement locks against the
contract or gate the lock controls behind `isConfigured` with explicit "not yet supported
on-chain" copy. Do not ship a success receipt for an action that moved nothing.

### ARCH-03
**Vault receipts read stale state — High**

Inside the `confirm` step, the code reads the state machine it is currently driving:

```tsx
// app/(tabs)/vault.tsx:170-179
confirm: async () => {
  const hash = vaultAction.status.txHash;
  setReceiptData({
    …
    status: vaultAction.status.state === 'confirmed' ? 'Success' : 'Failed',
```

`vaultAction.status` comes from `useState` (`src/hooks/useVaultAction.ts:21`), so within a
single render pass this closure sees the value captured at render time — not the
`{ state: 'pending', txHash }` set moments earlier at line 31, and never `'confirmed'`,
which is only set *after* `confirm` resolves (line 34). The receipt should therefore report
**"Failed"** for successful vault actions, with a null or stale transaction hash.

The failure branch has the mirror-image problem: `if (vaultAction.status.state === 'failed')`
(`app/(tabs)/vault.tsx:187`) runs immediately after `await vaultAction.run(...)`, reading the
same stale closure, so it should never fire. _(inferred — consistent with React's state
model; not observed at runtime.)_

**Remediation** — have `run()` return its terminal result and derive the receipt from that
return value instead of from `status`.

### ARCH-08
**Secret key retrieval has no authentication gate — Medium‑High**

- The wallet secret is written with `SecureStore.setItemAsync(WALLET_KEY, secretKey)`
  (`src/store/walletStore.ts:163`) — no `requireAuthentication` option, so the OS keystore
  does not demand biometrics on read.
- `getSecretKey()` (`src/store/walletStore.ts:317-347`) returns the plaintext secret to any
  caller with no authentication check.
- App lock is a **UI-layer** gate only: `appLockStore.isAuthenticated` guards rendering via
  `LockScreen` (`app/_layout.tsx:137`), and nothing in the storage path consults it.
- `LAST_AUTH_KEY` is written (`src/store/appLockStore.ts:124`) but never read, so there is
  no session timeout — once authenticated, the session stays authenticated until `lock()` is
  called manually.

`docs/WALLET_SECURITY_FAQ.md` and `docs/app-lock-model.md` exist and should be reconciled
with this; the review did not audit whether they already disclose these limits.

**Remediation** — pass `requireAuthentication: true` to SecureStore where platform support
allows, route `getSecretKey()` through an explicit re-authentication for
value-transferring actions, and implement the session timeout that `LAST_AUTH_KEY` implies.

### ARCH-09
**Vault locks persist unencrypted with collision-prone IDs — Medium‑High**

Locks represent user funds set aside, and are stored in plain `AsyncStorage`:

```ts
// src/store/vaultStore.ts:21
const LOCKS_KEY = '@pocketpay_vault_locks';
// src/store/vaultStore.ts:130
await AsyncStorage.setItem(LOCKS_KEY, JSON.stringify(updatedLocks));
```

`docs/storage.md` documents the SecureStore-vs-AsyncStorage split; financial records sitting
on the AsyncStorage side deserves an explicit justification there. Lock identity is also
`id: Date.now().toString()` (`src/store/vaultStore.ts:122`), which collides for two locks
created in the same millisecond — and `unlockLock` filters by that id, so a collision
deletes both records.

`isConfigured` is captured once at store-creation time (`src/store/vaultStore.ts:75`), so
configuration changes never take effect without a full reload.

**Remediation** — use a UUID for lock ids, document (or change) the storage tier for
financial records, and evaluate `isConfigured` reactively.

### ARCH-07
**`.env` is committed despite `.gitignore` and contributor guidance — Medium‑High**

```
$ git ls-files | grep '^\.env'
.env
.env.example
.envEXPO_PUBLIC_STELLAR_NETWORK=TESTNET
```

`.env` is tracked in git even though `.gitignore:35` lists `.env` — it was committed in
`3ffee93` before the ignore rule took effect, and `.gitignore` does not retroactively untrack
files. This directly contradicts `CONTRIBUTING.md:172` (*"Never commit secret keys, `.env`
files, or credentials"*).

**The committed `.env` currently contains only public Testnet endpoints and an empty
`EXPO_PUBLIC_VAULT_CONTRACT_ID` — no secrets are exposed today.** The risk is structural:
the file is tracked, so the next contributor who fills in a value commits it by default,
and `git add .` will not warn them.

A third file, literally named `.envEXPO_PUBLIC_STELLAR_NETWORK=TESTNET`, is also tracked —
almost certainly a shell redirection accident. It matches neither `.gitignore` pattern.

**Remediation** — `git rm --cached .env ".envEXPO_PUBLIC_STELLAR_NETWORK=TESTNET"`, commit
the removal, and confirm `.gitignore` covers both. Treat any value ever committed in a
tracked env file as disclosed.

---

## 7. Error handling & reusable components

Error handling is one of the stronger areas. `src/utils/errorReporting.ts` provides a single
funnel with a clear extension point for a real crash reporter, `installGlobalErrorHandlers()`
runs before anything can throw (`app/_layout.tsx:22`), an `ErrorBoundary` wraps the tree
(`app/_layout.tsx:26`), and `getDiagnostics()` deliberately redacts to counts and booleans
(`src/utils/diagnostics.ts:11-31`). Domain-specific error taxonomies exist for payments
(`src/utils/paymentErrors.ts`), wallet storage (`src/utils/walletStorageErrors.ts`), and
vault withdrawals (`src/features/vault/maturedLockWithdrawal.ts`).

Two caveats: `getDiagnostics` includes `lastError: walletState.error` verbatim
(`src/utils/diagnostics.ts:28`), which can carry a raw Horizon message rather than one of the
curated constants (see `src/store/walletStore.ts:259`); and the redaction guarantee is worth
a test, since `__tests__` contains none for `diagnostics.ts`.

### ARCH-16
**Dead duplicate component; partial barrel export — Low‑Medium**

`src/components/VaultConfirmationModal.tsx` has **zero importers** anywhere in the codebase —
it duplicates the actively used `VaultConfirmModal.tsx`, and it imports the static `COLORS`
palette directly instead of `useTheme()`, violating `CONTRIBUTING.md:152` ("Always import
design tokens… Never hardcode"). It is also absent from `src/components/index.ts`.

The barrel itself is partial: 18 of 39 components are exported (`src/components/index.ts`).
The vault screen consequently imports everything by direct path
(`app/(tabs)/vault.tsx:4-11`) rather than through the barrel, so both conventions coexist.

**Remediation** — delete `VaultConfirmationModal.tsx`, then either complete the barrel and
require its use, or drop the barrel and standardise on direct paths.

### ARCH-17
**Feature-flag screen renders controls that do nothing — Low‑Medium**

```tsx
// app/(tabs)/settings/flags.tsx:25-31
<Switch
  value={enabled}
  onValueChange={() => {
    // In a real dev environment you might persist this to AsyncStorage.
    // Here we simply alert the developer.
    console.log(`Toggle ${key}`);
  }}
```

`FEATURE_FLAGS` is declared `as const` (`src/config/featureFlags.ts:18`), so flags are
compile-time constants with no runtime override path. The switch always snaps back. The
screen is labelled "Development Only", which softens this, but a control that silently
ignores input is worse than a disabled control.

**Remediation** — either back the flags with AsyncStorage overrides, or render them as
read-only rows with a note that changes require a rebuild.

---

## 8. Transaction flows

The transaction path is comparatively well-built. Pending sends are tracked optimistically
and keyed by hash so concurrent sends cannot overwrite each other
(`src/store/walletStore.ts:37,264-270`); reconciliation deliberately re-reads
`pendingTransactions` after the await to avoid dropping an entry added mid-flight
(`src/store/walletStore.ts:228-239`); pagination deduplicates by id
(`src/store/walletStore.ts:282-287`). These are the repository's best-commented decisions,
and three test files cover them.

The signing handoff (`src/store/signerStore.ts`) is the cleanest state model in the codebase
— an explicit phase machine with cancellation semantics and three dedicated test files.

Two gaps:

- The `external` and `hardware` signer types are declared and given UI labels
  (`src/services/signer.ts:82-91`) but only `LocalSigner` is implemented.
  `resolveSigner` silently falls back to local when a requested type is missing
  (`src/services/signer.ts:64-72`) — reasonable, but it means selecting "Hardware Wallet"
  would sign on-device without an explicit warning. _(inferred — the selection UI was not
  traced end to end.)_
- Unreconciled pending transactions stay pending indefinitely by design
  (`src/store/walletStore.ts:36`). Deliberate and documented, but it means a dropped
  transaction is indistinguishable from a slow one in the UI.

---

## 9. Test coverage gaps

**34 test files** cover **88 source modules** and **22 screens**. Coverage is uneven rather
than uniformly thin — wallet, signer, and vault-withdrawal logic are well covered, while
whole security-relevant subsystems have nothing.

### ARCH-14
**Security-critical modules have zero test coverage — Medium**

Derived by mapping every module imported by a file under `__tests__/`, `tests/`, or
`src/utils/__tests__/`:

| Module | Risk if wrong |
|---|---|
| `src/store/appLockStore.ts` | Biometric app lock — auth bypass |
| `src/services/signer.ts` | Transaction signing — the `LocalSigner` itself |
| `src/utils/validation.ts` | Address / amount / memo validation — funds to wrong destination |
| `src/utils/vaultCapabilities.ts` | Action gating (note: the sibling `vaultAvailability.ts` *is* tested) |
| `src/utils/paymentErrors.ts`, `transactions.ts`, `contacts.ts`, `diagnostics.ts` | Error mapping, redaction |
| `src/config/featureFlags.ts` | Feature gating |
| `src/hooks/` — `useVault`, `useVaultAction`, `useVaultAvailability`, `useVaultCapabilities`, `useSignerHandoff`, `useDirtyForm`, `useOnlineStatus` | Only `useNetworkStatus` and `useTheme` are imported by tests |
| `src/features/vault/useVaultDepositForm.ts`, `useMaturedLockWithdrawal.ts` | Only the pure `maturedLockWithdrawal.ts` is tested |
| `src/features/settings/useNetworkEnvironment.ts`, `src/features/transactions/helpers.ts` | Untested |

Screens imported by no test: `(auth)/create`, `(auth)/import`, `(auth)/index`, `contacts`,
`diagnostics`, `receive`, `review-transaction`, `scan`, `settings`, `settings/flags`,
`vault/[id]`, `vault-lock/[id]`, and all three `_layout` files. Tested screens are
`(tabs)/index`, `(tabs)/history`, `(tabs)/vault`, `send`, `payment-success`,
`sign-confirmation`, and `transaction/[id]`.

`CONTRIBUTING.md:127` states *"All new screens and interactive components **must** include
tests"*. That bar is not currently met.

### ARCH-15
**The entire Soroban service layer is mocked in every test — Medium**

`src/services/vault.ts` is referenced by three test files, and **all three replace it with
`jest.mock`** (`__tests__/vault.test.tsx:42`,
`__tests__/maturedLockWithdrawalFlow.test.tsx:13`,
`__tests__/vaultStore.withdrawMaturedLock.test.ts:13`). No test ever executes the real
module.

That includes the money math. `xlmToStroops` and `stroopsToXlm`
(`src/services/vault.ts:45-65`) convert between decimal XLM strings and `i128` stroops with
`BigInt` — precision-critical, edge-case-rich (7-decimal padding, negative values, rejection
of malformed input), and **asserted by no test anywhere in the repository**. These are pure
functions with no dependencies; they are the cheapest high-value tests available.

### ARCH-05
**No CI runs the test suite — High**

`.github/workflows/` contains exactly two files: `api-check.yml` and
`trigger-auto-merge.yml`. Neither runs `npm test`, `jest`, or `tsc`. The only quality gate is
the SDK API snapshot check — and that is path-filtered to four SDK-related paths
(`.github/workflows/api-check.yml:5-9,13-17`), so a PR touching only `src/store/` or `app/`
triggers **no CI at all**.

`CONTRIBUTING.md:131` states: *"Tests should pass before you open a PR. CI will run the suite
automatically on every push."* The second sentence is not true today.

Combined with `trigger-auto-merge.yml`, this means changes can merge with no automated
verification.

**Remediation** — add a workflow running `npm test` and `npm run typecheck` on every PR,
unfiltered by path. This is the highest-leverage single fix in this review: several findings
above (ARCH-01, ARCH-03) are exactly the kind of defect a test run would surface.

---

## 10. Contributor onboarding

### ARCH-19
**Contributor docs contradict the codebase in three places — Medium**

| Claim | Reality |
|---|---|
| *"CI will run the suite automatically on every push"* — `CONTRIBUTING.md:131` | No workflow runs tests (ARCH-05) |
| *"The app uses a **dark-only palette** — there is no light mode"* — `CONTRIBUTING.md:153` | `useTheme` fully supports `light`/`dark`/`system` (`src/hooks/useTheme.ts:16-31`), persisted via `appStore.themeMode` (`src/store/appStore.ts:10`) |
| *"Never commit … `.env` files"* — `CONTRIBUTING.md:172` | `.env` is tracked (ARCH-07) |

The Project Structure diagram (`CONTRIBUTING.md:91-105`) also omits `src/features/`,
`src/hooks/`, `src/config/`, `src/types/`, and `src/sdk-stub/` — so the newest architectural
layer, the one a contributor most needs explained, is invisible in the only document that
describes the layout.

A contributor following `CONTRIBUTING.md` today would hardcode dark colours, skip light-mode
testing, assume CI has their back, and never discover `src/features/`.

### ARCH-06
**Duplicate `expo-local-authentication` key in `package.json` — High**

```json
// package.json:43-44
"expo-local-authentication": "~16.0.5",
"expo-local-authentication": "~17.0.8",
```

Duplicate keys in JSON are legal and resolve last-wins **silently** — no npm warning. The
effective version is `~17.0.8`; the `~16.0.5` line is dead but looks authoritative to anyone
reading or editing the file. This governs the biometric authentication package used by
`appLockStore`, and a major-version ambiguity in an auth dependency is worth resolving
deliberately rather than by JSON parser behaviour.

**Remediation** — delete one line after confirming which version the lockfiles resolved.

### ARCH-20
**Three lockfiles; `.env`/`.env.example` drift — Low‑Medium**

The repository tracks `bun.lock`, `package-lock.json`, **and** `pnpm-lock.yaml`
simultaneously, while `README.md:80` and `CONTRIBUTING.md:50` both instruct
`npm install --legacy-peer-deps`, and `.github/workflows/api-check.yml:36` uses npm. Three
lockfiles cannot stay mutually consistent; whichever a contributor's package manager picks
up may not match CI.

`.env.example:13` defines `EXPO_PUBLIC_VAULT_ENABLED=true`, but the committed `.env` omits
it entirely — so a contributor who copies the example and one who uses the tracked file get
different vault gating (the flag defaults to enabled when unset,
`src/utils/vaultAvailability.ts:45`).

`README.md` has additional structural defects that hurt first impressions: two separate
`## Documentation` sections (lines 12 and 45) with a repeated "UI State Catalogue" link, an
unterminated ```` ```bash ```` fence opened at line 79 that swallows the prose at lines
84-85 into a code block, and `MIT` duplicated at lines 103-104. `README.md:84-85` also
claims the SDK *"is pinned to an official source commit and built by the app's `postinstall`
script"* — there is no `postinstall` script in `package.json:5-15`, and the dependency
resolves to the local stub.

> Note: `README.md` line numbers in this section reflect the file *after* this review added
> its own entry to the first Documentation list. That entry is the only README change made
> by this review; the defects above pre-date it.

**Remediation** — keep one lockfile, reconcile `.env` with `.env.example`, and repair the
README structure. These are small fixes with outsized effect on the first-run experience.

### ARCH-23
**36 documentation links point at absolute paths on other developers' machines — Low‑Medium**

Two documents embed `file:///` links to local filesystem paths that exist only on the
machine of whoever wrote them:

| Document | Broken links | Embedded path prefix |
|---|---|---|
| `docs/navigation-map.md` | 33 (across 28 lines) | `file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/…` |
| `docs/polyfills.md` | 3 | `file:///c:/Users/HP/drips/work/…` |

Example — `docs/navigation-map.md:24`:

```md
| `/` (in auth) | [app/(auth)/index.tsx](file:///c:/Users/Muhammad/.trae/Grantfox/pocketpay-mobile/app/(auth)/index.tsx) | … |
```

Every one of these resolves to nothing for any other reader, on GitHub or locally. This
matters more than typical link rot because `navigation-map.md` is the canonical route
reference — the document a new contributor is sent to in order to understand navigation
(and the one this review cites in [ARCH-22](#arch-22)). Its entire route table is
unnavigable.

As a side effect, the paths disclose two contributors' local directory structures.

**Remediation** — replace each with a repository-relative link
(`[app/(auth)/index.tsx](../app/(auth)/index.tsx)`). Consider a CI link-check, or a
`grep -r 'file:///' docs/` guard in the PR checklist, to stop these reappearing.

---

## 11. Prioritised remediation

Ordered by risk-reduction per unit of effort.

| # | Action | Addresses | Effort |
|---|---|---|---|
| 1 | Add a CI workflow running `npm test` + `npm run typecheck` on every PR, unfiltered by path | ARCH-05 | S |
| 2 | Remove the duplicate `expo-local-authentication` key | ARCH-06 | S |
| 3 | `git rm --cached` the two tracked env files | ARCH-07 | S |
| 4 | Add unit tests for `xlmToStroops` / `stroopsToXlm` | ARCH-15 | S |
| 5 | Delete the dead `VaultConfirmationModal` | ARCH-16 | S |
| 6 | Fix the vault receipt to use `run()`'s return value | ARCH-03 | S |
| 7 | Correct the three false claims in `CONTRIBUTING.md` and repair the README | ARCH-19, ARCH-20 | S |
| 8 | Replace the 36 `file:///` links in `navigation-map.md` / `polyfills.md` with relative paths | ARCH-23 | S |
| 9 | Reconcile the SDK declaration, stub, and mocks; make `validateAddress` branch on a boolean | ARCH-01 | M |
| 10 | Poll `getTransaction` with backoff after `sendTransaction` | ARCH-04 | M |
| 11 | Gate or implement vault locks against the contract | ARCH-02 | M |
| 12 | Extend `check-sdk-api.js` to verify the stub, or narrow its documented promise | ARCH-13 | M |
| 13 | Collapse the three vault gating systems into one | ARCH-12 | M |
| 14 | Tests for `appLockStore`, `signer.ts`, `validation.ts`, `vaultCapabilities.ts` | ARCH-14 | M |
| 15 | Add `requireAuthentication` + session timeout to secret access | ARCH-08 | M |
| 16 | UUID lock ids; document or change the storage tier for locks | ARCH-09 | M |
| 17 | Declare a root navigator for the 11 root-level routes; add `+not-found` | ARCH-22 | M |
| 18 | Standardise on one async-state pattern across stores | ARCH-11 | L |
| 19 | Finish — or explicitly scope — the `src/features/` migration | ARCH-10, ARCH-18 | L |
| 20 | Back feature flags with runtime overrides, or render them read-only | ARCH-17 | S |
| 21 | Type the Horizon payload; remove dead code; convert `useVault` to selectors | ARCH-21 | M |

Items 1-8 are each under an hour and remove two High-severity findings outright.

---

## 12. Limitations of this review

Stated plainly, per the issue's request to be honest about incomplete areas.

- **Nothing was executed.** The app was never launched, no test was run, no dependency was
  installed, and `npm run typecheck` was not run. Every finding comes from reading source.
- **Findings marked _(inferred)_ were not observed.** ARCH-01's fail-open scenario, ARCH-03's
  stale-state receipt, ARCH-04's polling failure, and ARCH-12's contradictory gating are
  reasoned from the code and from documented platform behaviour, but each needs a runtime
  reproduction before being treated as confirmed. They are stated as risks, not as verified
  bugs.
- **No Soroban contract was deployed**, so the entire live-contract path
  (`src/services/vault.ts`) is unexercised — by this review and by the test suite alike.
- **The real `pocketpay-sdk` was not available.** ARCH-01 compares the local stub against the
  local declaration; the actual SDK's behaviour is unknown and may differ from both.
- **Not covered in depth:** accessibility (see `docs/accessibility.md`), visual/design-system
  conformance beyond the one `COLORS` violation noted, performance and bundle size,
  Android/iOS platform-specific behaviour, `metro.config.js` and `shim.js` polyfill ordering,
  and the ~30 existing documents under `docs/` — several of which (`docs/storage.md`,
  `docs/app-lock-model.md`, `docs/vault-integration-risks.md`) likely already discuss
  findings in §6 and may partly supersede them.
- **Test coverage was derived from import analysis**, not from a coverage report. A module
  imported by a test file is counted as "covered" even if only incidentally exercised, so the
  real coverage of the modules listed as tested is likely *lower* than this review implies.
  The zero-coverage list is reliable; the covered list is optimistic.
- **Severities are this review's judgement**, weighted toward user-funds impact. They have
  not been agreed with maintainers.

---

## Related documentation

- [SDK API Compatibility](sdk-api-compatibility.md) — how the stub contract is guarded
- [Vault Integration Risks](vault-integration-risks.md) — prior analysis of the vault/SDK boundary
- [Vault SDK Capability Assumptions](vault-sdk-capability-assumptions.md)
- [Storage Guide](storage.md) — SecureStore vs AsyncStorage policy
- [Mobile Security Checklist](mobile-security-checklist.md)
- [Navigation Map](navigation-map.md) · [Screen Inventory](screen-inventory.md)
