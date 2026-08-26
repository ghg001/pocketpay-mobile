# PR: Add Analytics Security Design Document

## Description
This PR adds a **Analytics Security Design** document (`docs/analytics-security-design.md`) that outlines safe, privacy‑preserving screen‑level analytics events for the PocketPay mobile app. The design covers event scope, naming conventions, redaction rules, opt‑out handling, and implementation guidance.

## Motivation
- Prevent accidental collection of wallet secrets, transaction data, or personal information.
- Provide a clear, reviewer‑friendly reference for contributors building new analytics events.
- Align analytics practices with the existing security checklist and overall security posture of the app.

## Changes Made
- **New file:** `docs/analytics-security-design.md` – comprehensive analytics design and guidelines.
- **README update:** Added an "Analytics Design" section with a link to the new document (see line 100‑102).

## Testing / Verification
- Verify that the README link resolves to the new document.
- Run `npm run lint` and `npm test` to ensure no new lint warnings or failing tests.
- Manually review the design to confirm no secret or transaction data is included in example events.

## Review Checklist
- [ ] Documentation is clear, complete, and follows the repository’s style guidelines.
- [ ] No new lint warnings introduced.
- [ ] Build passes (`npm run build` / `npm start`).
- [ ] All examples respect the redaction rules defined in the design.
- [ ] Links in README are correct and functional.

## Related Issues
- None – this is a new design document.

---
*Generated automatically by Antigravity on 2026‑07‑25.*
