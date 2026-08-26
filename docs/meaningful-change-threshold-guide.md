# Meaningful Change Threshold Guide

When contributing to PocketPay Mobile, we value quality and completeness over mere line count. This guide clarifies what constitutes a meaningful change and helps contributors and reviewers assess whether a pull request sufficiently addresses the issue it aims to solve.

## Line Count is Not the Only Measure

A Pull Request (PR) should not be judged solely by how many lines of code are changed. A 5-line change can be highly meaningful if it fixes a critical bug or fully implements a requested feature. Conversely, a 500-line change that consists of auto-generated code, unnecessary refactoring, or incomplete features may not meet the threshold for a meaningful change.

The primary standard for a meaningful change is **completeness, test coverage, and alignment with the issue requirements**.

## Small Complete vs. Small Incomplete Changes

A meaningful change, no matter how small, must be complete.

### Small but Complete Changes (Meaningful)
*   **Targeted Bug Fixes:** Changing a single line to fix a crash or a logical error, accompanied by a test verifying the fix.
*   **UI Tweaks:** Updating a color code or padding value to match the design spec exactly, verified across different screen sizes.
*   **Documentation Updates:** Adding a missing paragraph to the README that clarifies a setup step that was previously confusing.

### Small Incomplete Changes (Insufficient)
*   **Partial Implementations:** Adding a UI button without wiring it up to the corresponding action or state.
*   **Unverified Fixes:** Changing a line of code to "see if it works" without adding a test or providing evidence (e.g., screenshots/videos) that the issue is resolved.
*   **Superficial Changes:** Modifying code style, variable names, or adding comments without addressing the core functionality requested in the issue (unless the issue explicitly called for a refactor).

## Examples of Insufficient Changes

The following examples typically do not meet the threshold for a meaningful change and may be rejected or require substantial revision:

1.  **"Drive-by" formatting:** PRs that only run a linter or formatter without making functional changes, unless specifically requested in an issue.
2.  **Adding dead code:** Introducing new functions or components that are not used anywhere in the application.
3.  **Tests without implementation:** Writing a test for a feature, but leaving the feature itself unimplemented (unless part of a coordinated TDD effort).
4.  **Addressing only part of the Acceptance Criteria:** An issue asks for an API integration and a UI state update, but the PR only updates the UI to show a hardcoded mock value.

## Reviewer Assessment Guidance

Reviewers should use the following guidelines when assessing the scope and meaningfulness of a PR:

1.  **Check Acceptance Criteria:** Does the PR fully satisfy all acceptance criteria listed in the original issue? If not, is there a clear, documented reason why (e.g., agreed-upon scope reduction)?
2.  **Verify Completeness:** Is the feature or fix end-to-end? Does it handle edge cases and error states appropriately?
3.  **Evaluate Tests:** Does the PR include adequate tests (unit, integration, or UI) to prove the change works and to prevent regressions?
4.  **Demand Evidence:** For UI changes, does the PR description include screenshots or videos? For logic changes, are the test results clearly documented?
5.  **Quality over Quantity:** Do not reject a PR simply because it is small. Focus on whether the PR solves the underlying problem effectively.

If a PR is deemed insufficient, reviewers should provide constructive feedback, pointing out exactly which requirements are missing and suggesting how the contributor can expand the PR to meet the meaningful change threshold.
