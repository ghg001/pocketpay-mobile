# Low-Effort Contribution Examples

A small PR that merges is not automatically a PR that earns evaluation
credit. This guide shows the concrete shapes low-effort contributions take in
PocketPay Mobile, explains **why** each one falls short of the bar, and shows
an **improved alternative** for the same work.

> ⚠️ **A merged PR does not guarantee payment approval.** GrantFox
> evaluation checks whether the requested behaviour, tests, CI, and acceptance
> criteria were actually delivered — not just whether the diff was accepted.
> See the [Meaningful Change Guide](meaningful-change-guide.md) for the bar a
> change is measured against and the [Self-Review Checklist](self-review-checklist.md)
> to check your own work before opening a PR.

## How To Use This Guide

Each section below follows the same shape:

- **The poor example** — a realistic low-effort diff for a PocketPay Mobile
  issue.
- **Why it is insufficient** — which part of the bar it fails and why a
  reviewer or evaluator would push back.
- **The improved alternative** — the same intent, done to a standard that can
  pass evaluation.

This guide is the worked-example companion to the
[Meaningful Change Guide](meaningful-change-guide.md), which lists the shapes
of incomplete work in brief. Read that guide for the reasoning; read this one
for the before/after examples.

The four categories map to the situations contributors most often
underestimate:

1. [Superficial changes](#1-superficial-changes)
2. [Partial implementations](#2-partial-implementations)
3. [Missing tests](#3-missing-tests)
4. [Failing CI](#4-failing-ci)

## 1. Superficial Changes

A superficial change touches the codebase without addressing the behaviour the
issue asked for. It often looks plausible in isolation — the diff is small,
the title matches the issue — but nothing a user experiences actually changes.

### Poor Example

The issue asks the Send screen to block submission when the amount exceeds the
available balance. The PR only restyles the existing error banner:

```tsx
// SendScreen.tsx
- <Text style={styles.error}>{error}</Text>
+ <Text style={[styles.error, styles.errorBold]}>{error}</Text>
```

Or the change is limited to renaming a local variable, reflowing whitespace,
or fixing a comment typo, then closing the issue as done.

### Why It Is Insufficient

- The requested behaviour — validation that prevents an over-balance send —
  was never implemented. The `error` string still comes from wherever it came
  from before; no new validation branch exists.
- The diff *looks* like it addresses the issue title but does not touch the
  logic the issue is about. A reviewer checking the acceptance criteria line
  by line finds nothing that satisfies them.
- Restyling and renames are legitimate as part of a real change, but on their
  own they do not close a behavioural issue. See the "Styling-only fix for a
  functional bug" shape in the
  [Meaningful Change Guide](meaningful-change-guide.md#examples-of-incomplete-changes).

### Improved Alternative

Add the actual validation, wire it to the submit action, and cover it with a
test:

```tsx
// SendScreen.tsx
const amountExceedsBalance = Number(amount) > Number(availableBalance);

<PrimaryButton
  label="Review payment"
  disabled={amountExceedsBalance || !recipient}
  onPress={handleReview}
/>
{amountExceedsBalance && (
  <Text style={styles.error} accessibilityRole="alert">
    Amount exceeds your available balance.
  </Text>
)}
```

- The submit path is blocked when the amount is invalid, matching the issue's
  Expected Behaviour.
- The error state matches the Send row in the
  [UI State Catalogue](ui-states.md#send), with an `accessibilityRole` so it
  is announced (see the [Accessibility Checklist](accessibility.md)).
- A test exercises both the failing case (over balance → disabled) and the
  passing case (within balance → enabled), and the PR description includes a
  screenshot of the new error state.

## 2. Partial Implementations

A partial implementation delivers some of the requested behaviour and silently
leaves the rest broken or unhandled. Disclosed partial scope is acceptable;
*undisclosed* partial scope reads as a completed issue that is not actually
complete.

### Poor Example

The issue asks the Vault lock list to render correctly across **locked**,
**matured**, and **withdrawn** states. The PR handles only the locked case:

```tsx
// VaultLockList.tsx
{locks.map((lock) => (
  <LockRow key={lock.id} label="Locked" amount={lock.amount} />
))}
```

Every lock renders as "Locked" regardless of its real state, and the PR
description says only "Implemented vault lock list."

### Why It Is Insufficient

- Two of the three required states are wrong: matured and withdrawn locks are
  mislabelled, so the screen actively misinforms the user.
- The gap is **undisclosed**. Nothing in the PR tells the reviewer that
  matured and withdrawn are out of scope, so the work is presented as complete
  when it is not.
- Acceptance criteria are checked one by one against the diff. Solving one of
  three states and implying full coverage fails implementation completeness.
  See the "Happy-path-only fix for a multi-state issue" shape in the
  [Meaningful Change Guide](meaningful-change-guide.md#examples-of-incomplete-changes).

### Improved Alternative

Handle every state the issue lists, or disclose the boundary explicitly:

```tsx
// VaultLockList.tsx
const STATE_LABEL: Record<LockState, string> = {
  locked: "Locked",
  matured: "Ready to withdraw",
  withdrawn: "Withdrawn",
};

{locks.map((lock) => (
  <LockRow
    key={lock.id}
    label={STATE_LABEL[lock.state]}
    amount={lock.amount}
    muted={lock.state === "withdrawn"}
  />
))}
```

- All three states render distinctly, matching the vault rows in the
  [UI State Catalogue](ui-states.md).
- A test covers each state so a future regression in matured/withdrawn is
  caught.
- If a state genuinely cannot be finished in this PR, the description says so
  directly — "Withdrawn state is tracked as a follow-up because the SDK does
  not yet expose settlement time; locked and matured are complete here" —
  rather than leaving the gap silent.

## 3. Missing Tests

New or changed behaviour ships with no automated test, and the PR description
leaves the Screen Test Matrix untouched. The code may work when the author taps
through it once, but nothing stops the next change from silently breaking it,
and a reviewer has no evidence the branch was ever exercised beyond a
screenshot. This fails review 2 of the
[Self-Review Checklist](self-review-checklist.md#2-tests).

**Scenario:** the Receive screen gains a "Copy Address" button that writes the
wallet's public key to the clipboard.

### Poor example — feature with no test

```tsx
export function CopyAddressButton({ address }: { address: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Clipboard.setStringAsync(address)}
    >
      <Text>Copy Address</Text>
    </Pressable>
  );
}
```

No file appears under `__tests__/` or `tests/`, and
[Screen Test Matrix](screen-test-matrix.md) still lists Receive as uncovered
for this interaction.

**Why it's insufficient:**

- There is no proof the happy path (address copied) ever ran outside a manual
  tap, and no proof the failure path (clipboard write rejects) is handled at
  all — see the
  [Test-First Contribution Guide](test-first-contribution-guide.md).
- A future refactor of `Clipboard` or the button's props can break copying with
  nothing to catch it.
- The Screen Test Matrix now overstates the app's real coverage, which misleads
  the next contributor and the evaluator.

### Improved alternative — happy path and failure path covered

```tsx
// __tests__/CopyAddressButton.test.tsx
it("copies the address to the clipboard", async () => {
  const setString = jest
    .spyOn(Clipboard, "setStringAsync")
    .mockResolvedValue(true);
  const { getByRole } = render(<CopyAddressButton address="GABC…" />);

  fireEvent.press(getByRole("button"));

  await waitFor(() => expect(setString).toHaveBeenCalledWith("GABC…"));
});

it("shows an error when the clipboard write fails", async () => {
  jest
    .spyOn(Clipboard, "setStringAsync")
    .mockRejectedValue(new Error("denied"));
  const { getByRole } = render(<CopyAddressButton address="GABC…" />);

  fireEvent.press(getByRole("button"));

  await waitFor(() =>
    expect(getByRole("alert")).toHaveTextContent(/couldn't copy/i),
  );
});
```

- Both the success and the branch where the clipboard rejects are exercised, as
  required by the [Test-First Contribution Guide](test-first-contribution-guide.md).
- The [Screen Test Matrix](screen-test-matrix.md) row for Receive is updated in
  the same PR so coverage claims stay honest.
- If a test genuinely isn't applicable, the PR says so explicitly rather than
  leaving the section blank.

## 4. Failing CI

The PR is opened — or left — with a red check on the latest commit, and the
description either ignores it or waves it away as "unrelated" without evidence.
Required checks are the shared contract every contributor is held to, so a
failing one is treated as unfinished work, not a formality. This fails review 3
of the [Self-Review Checklist](self-review-checklist.md#3-ci) and section 3 of
the [Issue Approval Readiness Checklist](issue-approval-readiness-checklist.md#3-ci-status).

### Poor example — opening the PR with red checks

> CI shows `typecheck` and `test` failing. PR description: *"The failing checks
> look unrelated to my change, should be fine to merge."*

**Why it's insufficient:**

- "Looks unrelated" is an assertion, not evidence. A failing `typecheck` on the
  branch is almost always caused by the branch.
- A reviewer cannot tell a genuinely pre-existing failure from one the change
  introduced, so the burden of proof is on the author to show it.
- Merging over red checks erodes the guarantee that `main` stays green for
  everyone else.

### Improved alternative — green checks, or a substantiated explanation

Run the same checks CI runs, locally, before opening the PR:

```bash
npm run typecheck
npm run lint
npm test
npm run api:check   # when the change touches
                    # src/types/pocketpay-sdk.d.ts or src/sdk-stub/
```

- Every required check passes on the latest commit, or the failure is
  reproduced on `main` and the PR links that evidence to prove it predates the
  change.
- If a check is failing for a reason you can't explain, work through the
  [CI Troubleshooting Guide](ci-troubleshooting.md) before assuming it's
  unrelated.
- No check is skipped, muted, or bypassed to force a mergeable state — see the
  [Evaluation Readiness Checklist](evaluation-readiness-checklist.md).

## See Also

- [Meaningful Change Guide](meaningful-change-guide.md#examples-of-incomplete-changes)
  — the bar every change is measured against, and the brief catalogue of
  incomplete-submission shapes this guide expands into worked examples.
- [Self-Review Checklist](self-review-checklist.md) — the fast pass to run over
  your own branch before opening a PR.
- [Test-First Contribution Guide](test-first-contribution-guide.md) — what
  counts as adequate happy-path and negative-path coverage.
- [Issue Approval Readiness Checklist](issue-approval-readiness-checklist.md)
  and [Evaluation Readiness Checklist](evaluation-readiness-checklist.md) — the
  gates that a merged PR still has to clear, because merging does not guarantee
  payment approval.
- [UI State Catalogue](ui-states.md) and
  [Accessibility Checklist](accessibility.md) — the state and accessibility
  contracts the improved examples above satisfy.

