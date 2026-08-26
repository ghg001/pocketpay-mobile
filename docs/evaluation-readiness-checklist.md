# Evaluation Readiness Checklist

## Purpose

This checklist is for GrantFox contributors working on mobile issues. Use it before the payment evaluation period begins.

> Merging a mobile PR does **not** guarantee payment approval. Approval still depends on evaluator review, passing checks, adequate testing evidence, issue compliance, meaningful implementation, and overall quality.

## When To Use This Checklist

- Before requesting final review on a mobile issue PR
- Before the payment evaluation period starts
- After every substantial code, test, or scope update

## Evaluation Readiness

### 1. Issue Requirements

- [ ] I re-read the linked issue and matched the requested scope exactly.
- [ ] I confirmed the implementation satisfies the issue acceptance criteria.
- [ ] I documented any intentional scope limits, assumptions, or follow-up work in the PR.
- [ ] I verified the mobile behavior matches the expected user experience and issue outcome.
- [ ] I removed unfinished work, placeholders, dead code, and misleading TODOs that could affect evaluation.

### 2. Meaningful Implementation

- [ ] I made a real implementation change that solves the issue instead of a superficial workaround.
- [ ] I reviewed happy-path behavior across the affected screens, hooks, stores, or services.
- [ ] I reviewed failure, loading, empty, and disabled states introduced or affected by the change.
- [ ] I confirmed navigation, state updates, and user actions behave correctly before and after the change.
- [ ] I checked that naming, copy, and code structure make the implementation easy for evaluators to follow.

### 3. Mobile Testing Evidence

- [ ] I added or updated tests for the main behavior introduced by the issue.
- [ ] I added regression coverage for the bug or edge case that motivated the change.
- [ ] I covered both success and failure paths where the mobile flow can branch.
- [ ] I verified test fixtures, mocks, and app state setup still reflect real usage expectations.
- [ ] I manually tested the affected flow in the app and captured concise verification notes in the PR.

### 4. CI And Verification

- [ ] All required CI checks pass on the PR.
- [ ] Local test commands for the affected mobile area pass before review.
- [ ] Any lint, formatting, type, or static-analysis checks required by the repo pass.
- [ ] I did not ignore, mute, or bypass failing checks to get the PR merged.
- [ ] I included clear verification notes in the PR description.

### 5. Screenshots Or Recordings

- [ ] I attached screenshots or a short screen recording when the issue changes visible UI or user flow.
- [ ] The media clearly shows the final state that should be evaluated.
- [ ] I avoided placeholder evidence that does not demonstrate the actual fix or feature.
- [ ] I made sure screenshots or recordings do not expose secrets, personal data, or unsafe debug information.
- [ ] If the change is non-visual, I explained why screenshots or recordings are not applicable.

### 6. Acceptance Criteria And Edge Cases

- [ ] I tested zero, minimum, maximum, empty, and invalid input cases where applicable.
- [ ] I reviewed boundary conditions for form inputs, network states, persisted state, and repeated user actions.
- [ ] I checked behavior when preconditions are missing, stale, offline, or partially loaded.
- [ ] I verified errors, validation, and recovery actions remain clear enough for evaluators to review quickly.
- [ ] I checked each acceptance-criteria item one by one and confirmed it is satisfied in the implementation or evidence.

### 7. Self-Review

- [ ] I reviewed the full diff as if I were the evaluator.
- [ ] I removed unrelated changes that could make the issue harder to evaluate.
- [ ] I made sure naming, comments, and documentation explain non-obvious mobile behavior.
- [ ] I confirmed the PR description links the issue and explains what was tested.
- [ ] I honestly checked that the implementation is substantial enough to justify payment evaluation.
- [ ] I am confident the work is ready for evaluation even if I am not available to clarify it live.

## Final Reminder

Before the payment evaluation period starts, make sure the PR is fully reviewable on its own:

- [ ] The implementation matches the issue requirements.
- [ ] Tests and CI are passing.
- [ ] Screenshot or recording evidence is included when applicable.
- [ ] Acceptance criteria were checked one by one.
- [ ] The implementation is meaningful and evaluator-ready.
- [ ] The PR is evaluator-ready.

If any box is still unchecked, treat the work as not yet ready for payment evaluation.
