# Issue Approval Readiness Checklist

A fast, top-level gate to run through before you consider a GrantFox mobile
issue done and ready for approval. Use it right before you ask for review and
again right before the payment evaluation period starts.

> **A merged pull request does not guarantee payment approval.** Merging only
> means the code landed on `main`. Approval still depends on evaluator review,
> passing CI, adequate test evidence, full acceptance-criteria compliance, and
> a meaningful implementation.

This page is intentionally short. For the detailed, fill-in-the-evidence
version of these same checks, use the
[Contributor Self-Assessment](contributor-self-assessment.md) form, which you
copy into your PR description. For the evaluator-facing rubric used during the
payment period, see the
[Evaluation Readiness Checklist](evaluation-readiness-checklist.md).

## 1. Implementation Completeness

- [ ] The change fully addresses the linked issue, not a partial or
      superficial version of it.
- [ ] No leftover TODOs, dead code, commented-out blocks, or placeholder
      values remain in the diff.
- [ ] Any intentional scope limits or follow-up work are called out in the PR
      description, not left implicit.

## 2. Testing

- [ ] Automated tests were added or updated for the behavior the issue
      introduces or fixes, or a no-test justification is documented.
- [ ] Both a happy path and at least one negative or edge case are covered.
- [ ] `npm test` passes locally on the latest commit.

See the [Test-First Contribution Guide](test-first-contribution-guide.md) for
what counts as adequate coverage.

## 3. CI Status

- [ ] All required checks are green on the latest commit — tests, typecheck,
      lint, and `api:check` where applicable.
- [ ] No check was skipped, muted, or bypassed to get the PR to a mergeable
      state.
- [ ] Any known-flaky or unrelated failing check is explained in the PR
      description rather than left unaddressed.

If a check fails and the cause isn't obvious, see the
[CI Troubleshooting Guide](ci-troubleshooting.md) before assuming it's
unrelated to your change.

## 4. Acceptance Criteria

- [ ] Every acceptance criterion listed on the issue has been checked
      individually against the implementation, not assumed from general
      testing.
- [ ] Each criterion maps to concrete evidence — a test, a screenshot, or a
      short explanation — not just a checkmark.
- [ ] Any criterion that can't be fully met is flagged explicitly, with the
      reason, rather than silently left out.

## 5. Documentation

- [ ] Contributor, user, or architecture documentation affected by the change
      is updated, or it's documented why no update is needed.
- [ ] Screenshots, code comments, and examples touched by the change still
      match the current behavior.
- [ ] The README is updated if the change adds or moves a doc, script, or
      user-facing feature it should reference.

## 6. Known Limitations

- [ ] Boundary conditions (empty, minimum, maximum, offline, stale state)
      were tested, not just the default case.
- [ ] Known limitations, assumptions, and risks are written down in the PR —
      "none known" is only valid after you've actually looked.
- [ ] The change doesn't claim to support behavior it doesn't actually
      implement.

## Ready for Approval When

- [ ] Sections 1–6 above are complete.
- [ ] The [Contributor Self-Assessment](contributor-self-assessment.md) is
      filled in and copied into the PR description.
- [ ] You've reviewed the full diff once as if you were the evaluator, not the
      author.

If any box above is unchecked, treat the issue as not yet ready for approval
or payment evaluation.
