# Screen Test Matrix

A screen-by-screen map of what testing and visual verification each part of
the wallet is expected to have, and what actually exists today. Use this
before opening a PR that touches a screen: find its row, do what the row
says, and if you're adding a new screen, add a row for it in the same PR.

This is a coverage map, not a spec of *how* to write the tests — see
[CONTRIBUTING.md](../CONTRIBUTING.md#testing) for the testing setup and
[UI State Catalogue](ui-states.md) for the six required states
(Loading/Empty/Error/Success/Disabled/Pending) each screen's *behavior*
should satisfy regardless of whether an automated test exists yet.

## Test Types Referenced Below

| Type | What it means | Tooling |
|---|---|---|
| **Component test** | Renders the screen (or a meaningful slice of it) with Testing Library and asserts on states, interactions, and accessible queries. | `@testing-library/react-native`, co-located in `__tests__/` or `tests/` |
| **Store/logic test** | Unit-tests the Zustand store or utility function the screen depends on, independent of rendering. | Jest |
| **Flow test** | Exercises a multi-screen journey end-to-end within RTL (e.g. create → success, send → review → sign-confirmation). | `@testing-library/react-native` + `expo-router` mock |
| **Visual verification** | Manual check against [Design System](design-system.md) tokens, the applicable row in [UI State Catalogue](ui-states.md), and [Accessibility Checklist](accessibility.md). Required on every PR that changes a screen's UI — this project has no automated visual-regression/snapshot tooling, so this step is not optional. |

**Status legend:** ✅ covered · ⚠️ partial (logic tested, screen render/flow is not, or vice versa) · ❌ gap — no automated test exists.

---

## 1. Wallet Creation & Import (Onboarding)

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Welcome | `app/(auth)/index.tsx` | Component, Visual | None found | ❌ |
| Create Wallet | `app/(auth)/create.tsx` | Component, Flow, Visual | None found | ❌ |
| Import Wallet | `app/(auth)/import.tsx` | Component, Flow, Visual | None found | ❌ |
| Wallet Creation Success | `app/(auth)/wallet-creation-success.tsx` | Component, Visual | None found | ❌ |

**Visual verification expectations:** secret key / recovery phrase text must never be logged, screenshotted in CI artifacts, or left visible after navigating away (see [Security Guide](security.md)); "I've backed this up" / confirmation controls meet the 44×44 dp touch target and 4.5:1 contrast minimums from the [Accessibility Checklist](accessibility.md); the create → success handoff must not allow the success screen to be reached without a wallet actually existing in the store.

This is the largest gap in the app: onboarding has no automated coverage at
all today. A PR touching any of these four screens should add at least a
component test for that screen before merging.

## 2. Balance (Home / Wallet)

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Home / Wallet | `app/(tabs)/index.tsx` | Component, Store, Visual | `__tests__/home.pullToRefresh.test.tsx`, `__tests__/walletStore.test.ts`, `__tests__/walletStore.pagination.test.ts` | ✅ |

**Visual verification expectations:** all six [UI State Catalogue](ui-states.md#wallet-home) rows for Wallet (Loading/Empty/Error/Success/Disabled/Pending); balance formatting and sent/received sign conventions.

## 3. Send

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Send (compose) | `app/send.tsx` | Component, Visual | `__tests__/send.test.tsx` | ✅ |
| Review Transaction | `app/review-transaction.tsx` | Component, Flow, Visual | `__tests__/ReviewConfirm.test.tsx`, `__tests__/signerStore.confirming.test.ts`, `__tests__/signerStore.cancellation.test.ts`, `__tests__/signerStore.cancelled.test.ts` | ✅ |
| Sign Confirmation | `app/sign-confirmation.tsx` | Component, Visual | `__tests__/screens/sign-confirmation.test.tsx` | ✅ |
| Payment Success | `app/payment-success.tsx` | Component, Visual | `__tests__/paymentSuccess.test.tsx` | ✅ |

**Visual verification expectations:** the four signer phases (Reviewing →
Signing → Submitting → Waiting for confirmation) from
[UI State Catalogue](ui-states.md#send) must each be visually distinct and
non-duplicable; validation errors render beside the offending field, not as
a generic banner.

## 4. Receive & QR

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Receive | `app/receive.tsx` | Component, Visual | Covered indirectly via `__tests__/qrPayload.test.ts` (payload logic only) | ⚠️ |
| Scan (generic) | `app/scan.tsx` | Component, Visual | None found | ❌ |
| Scan to Pay | `app/scan-pay.tsx` | Component, Flow, Visual | `__tests__/contacts.scan.test.tsx` covers scan-to-contact, not scan-to-pay | ⚠️ |

**Visual verification expectations:** QR code renders the correct
address-only or SEP-0007 payload per [QR Payment Requests](qr-payment-requests.md);
camera-permission-denied state is handled visibly, not a blank screen; scan
never auto-submits a payment — see [Scan-to-Pay Review](scan-to-pay.md) for
the required "cancel before payment" behavior.

## 5. Activity / Transaction Detail

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Activity (history) | `app/(tabs)/history.tsx` | Component, Visual | `__tests__/history.pagination.test.tsx` | ✅ |
| Transaction Detail | `app/transaction/[id].tsx` | Component, Flow, Visual | `__tests__/transactionDetail.test.tsx`, `__tests__/transactionDetail.deeplink.test.tsx` | ✅ |

## 6. Address Book (Contacts)

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Contacts (address book) | `app/contacts.tsx` | Component, Store, Flow, Visual | `__tests__/ContactForm.test.tsx`, `__tests__/ContactPicker.test.tsx`, `__tests__/contactStore.test.ts`, `tests/contact-delete-confirmation.test.tsx` | ✅ |

**Visual verification expectations:** deleting a contact requires the
confirmation dialog every time (no accidental data loss); a contact picked
from scan or history correctly resolves to its saved label on Send/Receive.

## 7. Vault (Placeholder)

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Vault (main) | `app/(tabs)/vault.tsx` | Component, Store, Visual | `__tests__/vault.test.tsx`, `__tests__/VaultUnavailableState.test.tsx` | ✅ |
| Vault Detail | `app/vault/[id].tsx` | Component, Visual | None found | ❌ |
| Vault Lock Detail | `app/vault-lock/[id].tsx` | Component, Flow, Visual | `__tests__/maturedLockWithdrawal.test.ts` (store logic), `__tests__/maturedLockWithdrawalFlow.test.tsx` (flow), `__tests__/VaultLockEducationModal.test.tsx` | ⚠️ |

**Visual verification expectations:** the vault must clearly read as
**mock/Testnet-only** whenever `EXPO_PUBLIC_VAULT_CONTRACT_ID` is unset — see
[Vault UI Guidance](vault-ui-guidance.md); lock statuses (locked, matured,
withdrawn) each have a visually distinct badge; `app/vault/[id].tsx` has no
dedicated screen test today even though the store and lock-detail flow do —
don't assume vault coverage is complete just because `vault.test.tsx` passes.

## 8. Settings

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Settings (main) | `app/(tabs)/settings.tsx` | Component, Visual | None found | ❌ |
| Feature Flags | `app/(tabs)/settings/flags.tsx` | Component, Visual | None found | ❌ |

**Visual verification expectations:** destructive settings actions (wallet
reset) require `WalletResetConfirmModal` — see
`__tests__/WalletResetConfirmModal.test.tsx` for the confirmation contract
itself, even though the Settings screen that launches it is untested;
toggling a feature flag takes effect without requiring an app restart, or
the UI explains that it does.

## 9. Diagnostics

| Screen | Route | Test Types Required | Existing Coverage | Status |
|---|---|---|---|---|
| Diagnostics | `app/diagnostics.tsx` | Component, Store/logic, Visual | `__tests__/diagnostics.test.ts` (covers `getDiagnostics()` utility only, not the screen render) | ⚠️ |

---

## Cross-Cutting Checks (every screen, regardless of row above)

These apply on top of whatever this screen's row requires — they're not a
substitute for it:

- [ ] Every interactive element has `accessible={true}` and a descriptive
  `accessibilityLabel` (see [Accessibility Checklist](accessibility.md)).
- [ ] The screen satisfies all six [UI State Catalogue](ui-states.md) rows
  that apply to it, including any explicitly marked *Not applicable* with a
  stated reason.
- [ ] Design tokens come from `src/constants/theme.ts` — no hardcoded hex
  colors or pixel sizes (see [Design System Guide](design-system.md)).
- [ ] No secret key, seed phrase, or full transaction signature is ever
  logged or left in a test snapshot/fixture.
- [ ] `npm run typecheck`, `npm run lint`, and `npm test` all pass — see the
  [CI Troubleshooting Guide](ci-troubleshooting.md) if any of them fail for
  a reason you can't immediately explain.

## Keeping This Matrix Current

If you add a new screen under `app/`, add a row for it here in the same PR
— don't leave it for someone else to discover the gap. If you add a test for
a screen marked ❌ or ⚠️ above, update its Status and Existing Coverage
columns in the same PR that adds the test.
