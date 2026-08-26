# Self-Review Checklist

## Purpose

A short, actionable checklist to run through **immediately before opening a
PR** — not before payment evaluation. It exists so contributors can catch the
same gaps a reviewer would catch, before a reviewer ever sees the diff.

This is not a replacement for the
[Evaluation Readiness Checklist](evaluation-readiness-checklist.md) (the full
pre-payment-evaluation bar) or the
[Contributor Self-Assessment](contributor-self-assessment.md) (the form you
paste into the PR description). Use this checklist first, as a fast pass over
your own branch; use the other two afterward, when you're ready to write up
evidence.

## When To Use This Checklist

- Right before you push your branch and click "Create Pull Request."
- Again after any substantial change to an already-open PR.

## 1. Feature Completion

- [ ] Every item in the issue's Acceptance Criteria is implemented, or its
      absence is explicitly disclosed in the PR description.
- [ ] The change matches the issue's Expected Behaviour, not a partial or
      adjacent version of it.
- [ ] Every new interactive element is actually wired up — no button that
      renders but does nothing when pressed.
- [ ] No unrelated files, renames, or formatting changes are bundled in.

## 2. Tests

- [ ] New or changed behaviour has a corresponding automated test, or the PR
      explains why a test isn't applicable.
- [ ] Both the happy path and at least one negative/edge case are covered.
- [ ] `npm test` passes locally on the latest commit.

## 3. CI

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run api:check` passes if the change touches
      `src/types/pocketpay-sdk.d.ts` or `src/sdk-stub/` (see
      [SDK API Compatibility](sdk-api-compatibility.md)).
- [ ] No required check is skipped, muted, or left failing on the latest
      commit. If a check is failing for a reason you can't explain, see the
      [CI Troubleshooting Guide](ci-troubleshooting.md) before opening the PR.

## 4. Screenshots Or Recordings

- [ ] A screenshot or short recording is attached for any change to visible
      UI or user flow.
- [ ] Every state that changed is shown (e.g. loading, error, and success —
      not just the happy path).
- [ ] The media shows the actual final result, not a mockup or an earlier
      draft of the change.
- [ ] Screenshots contain only Testnet or dummy data — no real keys,
      balances, or personal data.
- [ ] If the change is non-visual, the PR says so instead of leaving this
      section blank.

## 5. Device Or Emulator Verification

- [ ] The change was actually run on a physical device or a simulator/
      emulator — not verified by reading the code alone.
- [ ] The app loads without a red error overlay or crash after the change.
- [ ] The exact flow described in the issue was exercised end-to-end
      on-device, including any error or edge-case states the issue calls out.
- [ ] If the change is platform-specific (iOS or Android only), it was
      verified on that platform rather than assumed to work from the other.

## 6. Documentation

- [ ] Any contributor, user, or architecture documentation affected by the
      change is updated, or the PR states why no update is needed.
- [ ] README links, code comments, and examples touched by the change still
      match the current behaviour.

## Examples Of Incomplete Submissions

Each of these has shipped in a repo looking finished while failing one of the
sections above:

- A "Copy Address" button that renders correctly in a screenshot but isn't
  wired to the clipboard — passes review 4 (screenshot) and fails review 1
  (feature completion).
- A validation fix confirmed only by reading the diff, never launched in a
  simulator — fails review 5 even if the logic is correct.
- A new screen with no entry in `__tests__/` or `tests/` — fails review 2
  regardless of how polished the UI looks.
- A multi-state fix (e.g. locked / matured / withdrawn) that only handles one
  state, with the other two silently left broken — fails review 1 unless the
  gap is disclosed.
- A PR description with an empty or missing Screenshots section on a change
  that clearly touches UI — fails review 4 by omission.

See the [Meaningful Change Guide](meaningful-change-guide.md) for the fuller
set of examples and the reasoning behind them.

## Final Check

- [ ] I completed sections 1–6 above for this specific PR, not from memory of
      a previous one.
- [ ] I would be comfortable if a reviewer checked every box above against my
      diff directly.

If any box is unchecked, treat the PR as not ready to open.

## Related Guidance

- [Contributor Self-Assessment](contributor-self-assessment.md)
- [Evaluation Readiness Checklist](evaluation-readiness-checklist.md)
- [Meaningful Change Guide](meaningful-change-guide.md)
- [CI Troubleshooting Guide](ci-troubleshooting.md)
- [Accessibility Checklist](accessibility.md)
