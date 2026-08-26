# Traceability Table Guide

This guide explains how to map mobile changes to issue acceptance criteria using the Traceability Table in the pull request template. This improves review clarity and ensures that mobile contributors demonstrate how their changes satisfy every acceptance criterion.

## Expected Behavior

Mobile PRs should clearly map:
- Changed screens
- Tests
- Screenshots
- Behavior

to the original issue criteria.

## Format

The Pull Request template includes the following table under the **Acceptance Criteria** section:

| Acceptance criterion | Implementation or evidence | Status |
| --- | --- | --- |
| [Issue criterion text] | [Links to files, tests, screenshots, or explanations] | Pass / Not applicable |

## How to Fill Out the Table

When submitting a PR, list each acceptance criterion from the linked issue. Then, for each criterion, provide specific evidence that it has been met.

### 1. Changed Screens
If a criterion requires a UI change, link directly to the modified screen component file (e.g., in `app/`).

### 2. Tests
Map the criterion to the specific unit or integration tests that verify the behavior. Link to the test files or describe the test cases added.

### 3. Screenshots
Where relevant (especially for UI and flow changes), attach or link to screenshots or recordings that demonstrate the criterion being satisfied. 

### 4. Behavior
If the criterion involves non-visual logic (e.g., state management or API calls), explain the implementation approach or link to the relevant logic files (`src/store/`, `src/services/`, etc.).

## Example Table

| Acceptance criterion | Implementation or evidence | Status |
| --- | --- | --- |
| "The Send screen should display an error if the amount exceeds the balance" | `app/send.tsx`, `__tests__/send.test.tsx` line 45, see attached screenshot `error-state.png` | Pass |
| "User can view transaction history" | `src/store/walletStore.ts`, `app/(tabs)/activity.tsx` | Pass |
