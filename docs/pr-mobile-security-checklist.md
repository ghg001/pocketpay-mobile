# PR: Add Mobile Security Checklist

## Description
This PR introduces a **Mobile Security Checklist** to help contributors review security‑sensitive changes in the PocketPay mobile app. The checklist covers secret handling, signing flows, logging, screenshots, secure storage, error handling, and more. Additionally, the README has been updated to link to this new checklist.

## Motivation
- Ensure consistent security practices across all contributions.
- Provide a clear, reviewer‑friendly reference to verify that new code does not introduce security regressions.
- Align with the existing Security Guide and improve overall code health.

## Changes Made
- **New file:** `docs/mobile-security-checklist.md` – contains the comprehensive checklist.
- **README update:** Added a bullet link under the **Security** section pointing to the new checklist.

## Testing / Verification
- Run the app locally and verify that the README link resolves correctly.
- Review the checklist manually to ensure it covers all relevant security aspects.
- Ensure the project builds without lint or type errors (`npm run lint`, `npm test`).

## Checklist for Reviewers
- [ ] Documentation updated and linked correctly.
- [ ] No new lint warnings introduced.
- [ ] Build passes (`npm run build` / `npm start`).
- [ ] Security checklist content is accurate and complete.
- [ ] All tests (if any) pass.

## Related Issues
- None (new feature).

---
*Generated automatically by Antigravity on 2026‑07‑25.*
