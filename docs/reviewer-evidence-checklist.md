# Reviewer Evidence Checklist

## Purpose

A checklist for **maintainers reviewing a PocketPay Mobile pull request** — not
for the contributor who opened it. It exists so a reviewer decides *merge* or
*changes requested* against the same evidence every time, instead of merging on
a green checkmark or a convincing description alone.

Contributors have their own pre-PR gates (the
[Self-Review Checklist](self-review-checklist.md) and
[Contributor Self-Assessment](contributor-self-assessment.md)). This page is the
mirror image: it tells the reviewer what to confirm on the diff itself before
approving, and what counts as evidence rather than a claim.

> **Reviewing a PR is verifying evidence, not trusting a description.** A ticked
> box in the PR body is a claim. Your job is to confirm the claim against the
> diff, the test output, and the CI run before you approve.

## When To Use This Checklist

- Before approving or merging any PR, however small it looks.
- Again after a contributor pushes new commits to an already-reviewed PR — a
  re-review starts from the same bar, not from your earlier approval.

## 1. Implementation Scope

- [ ] The PR links a specific issue, and the diff addresses that issue rather
      than an adjacent or partial version of it.
- [ ] The change is complete: every new interactive element is wired up, with no
      buttons or screens that render but do nothing.
- [ ] No unrelated files, renames, dependency bumps, or formatting-only churn
      are bundled in that would make the change harder to evaluate.
- [ ] Any intentional scope limit or deferred work is disclosed in the PR
      description, not left for the reviewer to discover in the diff.

## 2. Implementation Quality

- [ ] The change is a real implementation, not a superficial workaround that
      hides the problem the issue describes.
- [ ] Loading, empty, error, and disabled states affected by the change are
      handled, not just the happy path (see the
      [UI State Catalogue](ui-states.md)).
- [ ] No leftover TODOs, dead code, commented-out blocks, or placeholder values
      remain in the diff.
- [ ] Naming, copy, and structure are clear enough that the implementation can
      be followed without asking the author.

## 3. Test Evidence

- [ ] New or changed behaviour has a corresponding automated test, or the PR
      gives a specific no-test justification you find reasonable.
- [ ] Both a happy path and at least one negative or edge case are covered — a
      single happy-path assertion is not sufficient coverage.
- [ ] The tests actually exercise the changed code. A test that passes whether
      or not the fix is present is not evidence.
- [ ] Test output (not just a claim that `npm test` passed) is present in the PR
      or visible in the CI run. See the
      [Test-First Contribution Guide](test-first-contribution-guide.md) for what
      counts as adequate coverage.

## 4. CI Status

- [ ] All required checks are green on the **latest** commit, not on an earlier
      push that was since changed.
- [ ] `npm test`, `npm run typecheck`, and `npm run lint` pass on CI.
- [ ] `npm run api:check` passes where the change touches
      `src/types/pocketpay-sdk.d.ts` or `src/sdk-stub/`.
- [ ] No required check was skipped, muted, or bypassed to reach a mergeable
      state. Any known-flaky or unrelated failure is explained in the PR rather
      than left unaddressed (see the
      [CI Troubleshooting Guide](ci-troubleshooting.md)).

## 5. Documentation Impact

- [ ] Contributor, user, or architecture documentation affected by the change is
      updated, or the PR states why no update is needed.
- [ ] README links, code comments, and examples touched by the change still
      match the current behaviour.
- [ ] If the change adds or moves a doc, script, or user-facing feature, the
      README references it.

## 6. Acceptance Criteria

- [ ] Every acceptance criterion on the linked issue is checked individually
      against the diff, not assumed from the PR passing in general.
- [ ] Each criterion maps to concrete evidence — a test, a screenshot, or a
      short explanation — rather than a bare checkmark.
- [ ] Any criterion that is not fully met is flagged, with the reason, instead
      of being silently skipped. A partial implementation is only mergeable if
      the gap is disclosed and agreed.

## 7. Risk

- [ ] The blast radius of the change is understood — what breaks if it is wrong,
      and whether it touches security-sensitive areas (keys, storage, signing,
      auth).
- [ ] Screenshots or recordings, where the change touches visible UI or flow,
      show the actual final result and contain only Testnet or dummy data — no
      real keys, balances, or personal data.
- [ ] Boundary conditions relevant to the change (empty, minimum, maximum,
      offline, stale state) are covered or explicitly out of scope.
- [ ] Follow-up work or residual risk the merge leaves behind is captured in the
      PR or an issue, not lost.

## Ready To Approve When

- [ ] Sections 1–7 above are confirmed against the diff, the test output, and
      the CI run — not against the PR description alone.
- [ ] Every claim in the PR body that you relied on has been verified, or asked
      about, rather than taken on trust.
- [ ] You would be comfortable defending the merge if the change later turned
      out to be incomplete.

If any box above is unchecked, request changes rather than approving.

## Related Guidance

- [Self-Review Checklist](self-review-checklist.md)
- [Contributor Self-Assessment](contributor-self-assessment.md)
- [Issue Approval Readiness Checklist](issue-approval-readiness-checklist.md)
- [Evaluation Readiness Checklist](evaluation-readiness-checklist.md)
- [Test-First Contribution Guide](test-first-contribution-guide.md)
- [CI Troubleshooting Guide](ci-troubleshooting.md)
