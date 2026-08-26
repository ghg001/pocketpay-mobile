# Test-First Contribution Guide

PocketPay Mobile changes should start with a test plan. Use this guide before editing wallet creation, wallet import, balance, send, receive, QR, address book, or vault flows.

## Required Test Plan

Every PR should describe the behavior being changed, the user flow affected, the expected happy path, and at least one negative path. Add this plan to the PR before requesting review so reviewers can compare the implementation, tests, and acceptance criteria.

## Screen Expectations

### Wallet Creation

- Cover successful wallet creation with the expected account state, stored secret handling, and first-screen navigation.
- Cover cancellation, invalid setup state, duplicate setup attempts, and storage failures.
- Verify secrets are not logged, copied, or rendered outside the intended confirmation UI.

### Wallet Import

- Cover valid secret import, imported account persistence, and post-import navigation.
- Cover invalid secret formats, wrong network assumptions, empty input, and storage failures.
- Verify error copy helps the user recover without exposing the submitted secret.

### Balance

- Cover loaded balances, empty accounts, refresh behavior, and stale or loading states.
- Cover API, SDK, or network failures with a visible retry path.
- Verify rounding, asset labels, and unavailable balances do not imply spendable funds.

### Send

- Cover valid recipient, amount entry, fee or network assumptions, confirmation, and submitted transaction state.
- Cover invalid address, insufficient balance, zero or negative amount, user cancellation, signing failure, and submission failure.
- Verify the app never signs or submits before the user reaches the final confirmation step.

### Receive And QR

- Cover displayed receive address, copied address feedback, QR rendering, and scan-to-pay review behavior.
- Cover missing address, camera permission denial, malformed QR payload, unsupported network, and user cancellation.
- Verify scanning a QR code leads to review, not automatic payment.

### Address Book

- Cover adding, editing, deleting, searching, and selecting saved contacts.
- Cover duplicate names, invalid addresses, empty states, and storage failures.
- Verify destructive actions require clear user intent.

### Vault

- Cover vault overview, deposit preparation, withdraw preparation, pending states, and disabled states when assumptions are missing.
- Cover SDK or contract failure, missing wallet, insufficient balance, unsupported network, and unavailable contract data.
- Verify the UI distinguishes simulated, testnet, pending, and confirmed vault states.

## Happy-Path And Negative-Path Rules

A meaningful test set includes both success and failure behavior. If a PR changes a mobile flow, include at least one happy-path test and one negative-path test for the affected screen, hook, store, or service. For documentation-only changes, explain why runtime tests are not applicable and list the static review performed.

## Local Verification Commands

Run the commands that match the change scope:

```bash
npm test -- --runInBand
npm run typecheck
npm run lint
npm run api:check
```

Use `npm run api:check` when the change touches PocketPay SDK assumptions, mocks, vault integration, or service boundaries. Use `npm run lint` and `npm run typecheck` for source, test, and documentation examples that include TypeScript snippets.

## No-Test Justification

A PR may omit runtime tests only when the change is documentation-only, copy-only, or otherwise impossible to exercise in the current test harness. The PR must then include:

- The reason no runtime test was added.
- The files reviewed manually.
- Any local commands that still ran.
- The risk that remains untested.
- Follow-up coverage needed if the implementation later changes.

## Evidence To Include In The PR

- The acceptance criteria covered by the change.
- Test files added or updated.
- Local commands run and their results.
- Manual verification notes for affected screens.
- Screenshots or recordings for visible UI changes when available.
- Known limitations, skipped checks, or follow-up work.

A merged PR can still fail evaluation if the test evidence is incomplete, CI is failing, or the implementation only covers part of the requested behavior.
