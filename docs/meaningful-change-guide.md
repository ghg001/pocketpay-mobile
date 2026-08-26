# What Counts as Meaningful Work

A PR that technically merges is not the same as a PR that actually solves an
issue. This guide exists because small mobile PRs can change styling, rename
a variable, or touch a few unrelated lines without addressing the behaviour
an issue actually asked for — and merging does not, by itself, mean the work
is complete or payment-ready.

> ⚠️ **Merging a PR does not guarantee payment approval.** GrantFox
> evaluation looks at whether the requested behaviour, tests, and acceptance
> criteria were actually delivered — not just whether the diff was accepted.
> See the [Evaluation Readiness Checklist](evaluation-readiness-checklist.md)
> for the full bar, and the
> [Self-Review Checklist](self-review-checklist.md) to check your own work
> against it before you open a PR.

## The Bar: What "Meaningful" Requires

A change is meaningful when it addresses **all** of the following for the
issue it claims to close — not just the parts that were easy:

1. **The requested behaviour**, as written in the issue's Expected Behaviour
   and Acceptance Criteria — not a partial or adjacent version of it.
2. **Tests** for the new or changed behaviour. Check the screen's row in the
   [Screen Test Matrix](screen-test-matrix.md) — if the screen you touched
   has a ❌ or ⚠️ there, "I didn't add a test" is now a visible gap, not an
   invisible one.
3. **Screenshots or a screen recording** for any visual change. A reviewer
   should not have to pull your branch and run the app just to see what you
   built.
4. **Accessibility**, where the change touches UI — see the
   [Accessibility Checklist](accessibility.md). A new interactive element
   without an `accessibilityLabel` is not a finished element.
5. **Every item in the issue's acceptance criteria**, checked individually
   against your actual diff. Partially solving 3 of 6 checkboxes and opening
   the PR anyway is a different (and acceptable, if disclosed) thing from
   silently claiming the issue is done.

## Examples of Incomplete Changes

These are realistic shapes an incomplete PR takes in this codebase — the
common thread is that each one *looks* like it addresses the issue title
without actually delivering the behaviour, tests, or evidence the issue
asked for.

- **Styling-only fix for a functional bug.** The issue asks for the Send
  screen to show a validation error when the amount exceeds the balance; the
  PR only restyles the existing (unrelated) error banner and adds no
  validation logic or test. The title matches the issue; the diff doesn't.
- **Dead UI.** A new "Copy Address" button is added to the Receive screen,
  but it isn't wired to the clipboard — pressing it does nothing. It looks
  finished in a screenshot and is not finished at all.
- **Happy-path-only fix for a multi-state issue.** An issue about the Vault
  lock list asks for correct behaviour across locked, matured, and withdrawn
  states; the PR only handles the locked case and the other two are
  silently left broken, with no test and no note that they're out of scope.
- **No test for new behaviour.** A new screen or interactive control is
  added with zero corresponding entry in `__tests__/` or `tests/`, and the
  [Screen Test Matrix](screen-test-matrix.md) is not updated to reflect the
  new screen at all — the next contributor has no way to know the gap
  exists.
- **No visual evidence for a visual change.** A PR changes a screen's layout
  or adds a new state (loading/empty/error) but includes no screenshot or
  recording, so the reviewer either has to trust the description or spend
  their own time reproducing it.
- **Accessibility left out.** A new icon-only button (e.g. a delete or copy
  action) ships with no `accessible`/`accessibilityLabel`, failing the
  [Accessibility Checklist](accessibility.md) minimums silently, because
  nothing in CI catches missing accessibility props.
- **Unrelated scope bundled in.** A PR "fixes" the requested issue but also
  reformats unrelated files or renames unrelated variables, making the diff
  harder to review and harder to evaluate against the issue alone.

## Examples of Acceptable Changes

- **A full validation fix.** The Send-screen validation issue above, done
  completely: the validation logic is added, the error state matches the
  [UI State Catalogue](ui-states.md#send) Error row, a test exercises the
  new validation branch (both the failing and passing case), and the PR
  description includes a screenshot of the new error state.
- **A new screen, fully landed.** A new screen ships with: a component test,
  a new row added to the [Screen Test Matrix](screen-test-matrix.md),
  accessible labels on every interactive element, and a screenshot or
  recording in the PR description showing it rendered on-device or in a
  simulator.
- **An honestly partial PR.** The PR covers wallet creation but not wallet
  import from the same issue, and the description says so explicitly —
  "Import is intentionally out of scope here; tracked as a follow-up because
  X" — instead of implying full coverage. Disclosed partial scope is a
  legitimate outcome; undisclosed partial scope is not.
- **A bug fix with a regression test.** The fix includes a test that would
  have failed before the fix and passes after it, so the specific bug can't
  silently come back.

## Required Testing Evidence

Every PR should let a reviewer verify the work **without** re-running it
themselves:

- The exact commands you ran and their result: `npm run typecheck`,
  `npm run lint`, `npm test` (see the
  [CI Troubleshooting Guide](ci-troubleshooting.md) if any of them fail for
  a reason you can't explain — don't open a PR with a known-failing check).
- For any UI change: a screenshot or short recording of the changed
  screen/state. For a multi-state change (e.g. adding an error state),
  show each state that changed, not just the happy path.
- For a behavioural fix: which acceptance-criteria checkbox(es) from the
  issue each part of your change satisfies. Don't make the reviewer guess
  which line addresses which requirement.

## Reviewer Expectations

- Reviewers check the PR against the issue's acceptance criteria **line by
  line**, not against the PR title or description alone.
- If a claimed behaviour has no test and no screenshot, a reviewer may ask
  for one before approving — that's expected, not a sign something went
  wrong.
- A green CI run is necessary but not sufficient. CI catches typechecking,
  lint, and test failures; it does not catch a validation rule that was
  never implemented, or an accessibility label that was never added.
- Scope that's intentionally left out should be stated in the PR
  description. Scope that's silently missing is treated as incomplete work,
  not as an acceptable interpretation of the issue.

## See Also

- [Evaluation Readiness Checklist](evaluation-readiness-checklist.md) — the
  full pre-evaluation checklist for GrantFox contract issues.
- [Self-Review Checklist](self-review-checklist.md) — check your own PR
  against this guide before opening it.
- [Screen Test Matrix](screen-test-matrix.md) — required test types per
  screen.
- [Accessibility Checklist](accessibility.md) and
  [UI State Catalogue](ui-states.md) — the concrete bars a UI change is
  measured against.
