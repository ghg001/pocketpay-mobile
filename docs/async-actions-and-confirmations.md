# Async Actions & Confirmations

PocketPay's flows share one shape: the user commits to something, the app works
for a moment, and the result matters. Before this refactor each screen solved
that shape on its own — some used a native `Alert`, some a bespoke modal, some a
raw `ActivityIndicator` — so a destructive action looked and sounded different
depending on where you hit it.

Four shared pieces now cover that ground. **Reach for these before hand-rolling a
button, spinner, or confirmation.**

| Piece | Use it for |
|---|---|
| [`AsyncActionButton`](../src/components/AsyncActionButton.tsx) | Any button whose press kicks off async work |
| [`useConfirm`](../src/hooks/useConfirm.tsx) | "Are you sure?" — especially destructive actions |
| [`ConfirmModal`](../src/components/ConfirmModal.tsx) | A confirmation whose visibility you own, or one with custom content |
| [`ReviewConfirm`](../src/components/ReviewConfirm.tsx) | "Check these details, then commit" |
| [`LoadingState`](../src/components/LoadingState.tsx) | Any waiting surface — screen, section, or inline |

All five import from the barrels: `@/components` and `@/hooks`.

---

## AsyncActionButton

Wraps a press handler that returns a promise. It tracks the in-flight state
itself, so the caller does not need an `isSubmitting` piece of state at all.

```tsx
import { AsyncActionButton } from '@/components';

<AsyncActionButton
  title="Send Payment"
  loadingText="Sending…"
  onPress={async () => {
    await sendPayment();
  }}
/>
```

What you get for free:

- **Double-tap protection.** A ref guard rejects presses that land before React
  re-renders the button as disabled — the handler cannot run twice.
- **Consistent busy UI.** Spinner plus `loadingText`, in the button's text colour.
- **Correct accessibility state.** `accessibilityState={{ disabled, busy }}` and a
  label defaulting to `title`.
- **No unmount warnings.** Flows that navigate away on success (payment review,
  onboarding) settle after the button is gone; the internal mounted-ref handles it.

Pass `isLoading` when the pending flag lives in a store rather than in the press
handler. Pass `onError` if the flow surfaces its own error UI — otherwise a
rejection is only logged, which silently strands the user.

---

## useConfirm

The imperative confirmation. This replaced every
`Alert.alert(..., [{ style: 'destructive' }])` call site in the app.

```tsx
import { useConfirm } from '@/hooks';

const { confirm, confirmationDialog } = useConfirm();

const handleDelete = (contact: Contact) => {
  void confirm({
    title: 'Delete Contact',
    message: `Are you sure you want to delete "${contact.name}"?`,
    confirmLabel: 'Delete',
    destructive: true,
    onConfirm: () => deleteContact(contact.id),
  });
};

// Render the dialog somewhere in the returned tree:
return (
  <View>
    {/* … */}
    {confirmationDialog}
  </View>
);
```

Two ways to use the result, depending on where the work belongs:

- **Pass `onConfirm`** — the dialog stays open in its busy state until the work
  settles, then closes. Use this for anything that can fail or take time.
- **Await the promise** — `const ok = await confirm({...})` resolves `true`/`false`
  after the dialog closes. Use this when the follow-up work belongs to the caller.

`confirm()` always resolves, so the promise never dangles: cancelling resolves
`false`, and raising a second confirmation supersedes the first (resolving the
superseded one `false`).

> **Why not `Alert.alert`?** The native alert cannot stay open while async work
> runs, cannot be themed, and cannot show progress — so a slow delete looked
> identical to a failed one. It also bypasses the app's own accessibility
> conventions. Use `useConfirm` instead.

---

## ConfirmModal

The declarative form, and what `useConfirm` renders underneath. Use it directly
when you already hold the visibility state, or when the confirmation needs custom
content — a typed-phrase field, a lock summary, a fee breakdown.

```tsx
<ConfirmModal
  visible={showReset}
  title="Reset Wallet"
  message="This erases your keys from this device."
  confirmLabel="Delete Everything"
  destructive
  confirmDisabled={phrase !== 'confirm reset'}
  confirmDisabledHint="Type the confirmation phrase to enable this action"
  onConfirm={handleReset}
  onCancel={() => setShowReset(false)}
>
  <Input value={phrase} onChangeText={setPhrase} placeholder="confirm reset" />
</ConfirmModal>
```

`onConfirm` may return a promise. The modal tracks it and holds the busy state
itself, so callers no longer need to thread an `isLoading` flag through for the
common case. While busy, **both** the cancel button and the close affordance are
disabled — a half-applied destructive action is worse than a slow one.

---

## ReviewConfirm

The "last look before something irreversible" surface: a labelled detail card
followed by the confirm action. Used by payment review, and available to any
flow that moves funds.

```tsx
<ReviewConfirm
  items={[
    { label: 'To', value: 'Ada', secondaryValue: 'GABC…XYZ', truncate: true },
    { label: 'Amount', value: '10.5 XLM', emphasis: true },
    { label: 'Network', value: 'Testnet' },
  ]}
  confirmLabel="Sign & Send"
  loadingText="Signing…"
  onConfirm={handleConfirmSign}
  cancelLabel="Back to Edit"
  onCancel={() => router.back()}
/>
```

Row options: `emphasis` (accent colour, larger — for the amount), `truncate`
(middle-ellipsis, for addresses and hashes), and `secondaryValue` (a dimmer line
beneath, e.g. the raw address behind a contact name).

Omit `confirmLabel`/`onConfirm` to render the summary card with no actions. That
is how the payment review screen keeps the same details on screen through its
signing, submitting, completed, and failed phases.

---

## LoadingState

One component for every wait, so spinner size, spacing, and copy stay consistent.

```tsx
<LoadingState fullScreen message="Loading lock details…" />   {/* whole screen */}
<LoadingState inline message="Loading older transactions…" /> {/* list footer  */}
<LoadingState message="" accessibilityLabel="Loading vault balance" /> {/* bare  */}
```

Every instance is announced as a busy `progressbar`, so a wait is never a silent
spinner. When there is no visible message, pass `accessibilityLabel` so the wait
still has a name. Pass `testID` when a screen test targets a specific loader.

---

## Accessibility contract

These components exist partly so accessibility is not re-litigated per screen.
They guarantee:

- Every action has an `accessibilityLabel` (defaulting to its visible title) and
  `accessibilityRole="button"`.
- Busy and disabled states are exposed via `accessibilityState`, not just colour —
  a screen reader announces a submitting button as busy.
- A disabled confirm explains itself through `accessibilityHint`, so the user
  learns *why* it is unavailable rather than only *that* it is.
- Loading surfaces use `accessibilityRole="progressbar"` with `busy: true`.
- `ReviewConfirm` exposes its rows as a single `summary` label, so VoiceOver and
  TalkBack read the whole transaction in one pass instead of making the user
  navigate disconnected label/value fragments before reaching Confirm.

See the [Accessibility Checklist](./accessibility.md) for the full review criteria.

---

## Where they're used

| Area | Screen / component | Uses |
|---|---|---|
| Payments | [`app/review-transaction.tsx`](../app/review-transaction.tsx) | `ReviewConfirm`, `LoadingState` |
| Payments | [`app/send.tsx`](../app/send.tsx) | `AsyncActionButton` |
| Contacts | [`app/contacts.tsx`](../app/contacts.tsx) | `useConfirm` |
| Contacts | [`src/components/ContactManagement.tsx`](../src/components/ContactManagement.tsx) | `useConfirm` |
| Wallet | [`src/components/SecretKeyReveal.tsx`](../src/components/SecretKeyReveal.tsx) | `useConfirm` |
| Wallet | [`app/(tabs)/history.tsx`](../app/(tabs)/history.tsx) | `LoadingState` |
| Wallet | [`app/(tabs)/settings.tsx`](../app/(tabs)/settings.tsx) | `ConfirmModal` |
| Vault | [`app/vault/[id].tsx`](../app/vault/[id].tsx) | `LoadingState` |
| Vault | [`app/(tabs)/vault.tsx`](../app/(tabs)/vault.tsx) | `AsyncActionButton`, `ConfirmModal`, `LoadingState` |

---

## Adding a new flow

1. Async button → `AsyncActionButton`. Do not add your own `isSubmitting` state.
2. Needs a confirmation → `useConfirm`. Reach for `ConfirmModal` directly only if
   you need custom content inside the dialog.
3. Money or anything irreversible → `ReviewConfirm`, so the user sees a labelled
   summary before committing.
4. Any wait → `LoadingState`. Never a bare `ActivityIndicator`.
5. Never introduce a new `Alert.alert` with a `destructive` button.

See also: [Design System](./design-system.md) · [UI State Catalogue](./ui-states.md) ·
[Accessibility Checklist](./accessibility.md)
