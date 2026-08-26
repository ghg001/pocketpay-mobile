# SDK API Compatibility Check

## Why this exists

The real `pocketpay-sdk` package isn't published yet — the app builds against
[`src/sdk-stub`](../src/sdk-stub) locally and codes against the ambient type
declaration in [`src/types/pocketpay-sdk.d.ts`](../src/types/pocketpay-sdk.d.ts).
That declaration file **is** the public contract every screen, hook, and
service in this app relies on. Because it's just a `.d.ts` file sitting in
`src/`, it's easy to change its shape by accident during a refactor (rename a
param, tighten a return type, drop an export) without anything failing —
`tsc --noEmit` only checks that current call sites still compile, not that the
contract itself stayed the same.

The API compatibility check closes that gap: it snapshots the exported
members of `pocketpay-sdk` and fails when the snapshot no longer matches a
committed baseline.

## How it works

[`scripts/check-sdk-api.js`](../scripts/check-sdk-api.js) parses
`src/types/pocketpay-sdk.d.ts` with the TypeScript compiler API, extracts
every statement inside `declare module 'pocketpay-sdk' { ... }`, and prints
each one in a normalized, sorted form. That output is compared against the
baseline committed at [`api-reports/pocketpay-sdk.api.md`](../api-reports/pocketpay-sdk.api.md).

- Exports added, removed, renamed, or changed in signature → snapshot differs
  from the baseline → the check fails and prints a diff.
- No change to the contract → the check passes, regardless of unrelated edits
  to the SDK stub's implementation, other type files, or app code.

No network access, credentials, or published package are required — the
check is entirely local to this repo.

## Running it locally

```bash
# Check the current API against the committed baseline (exit 1 on drift)
npm run api:check

# Regenerate the baseline from the current declaration file
npm run api:update
```

## Documenting an intentional change

When you deliberately change the `pocketpay-sdk` contract:

1. Update `src/types/pocketpay-sdk.d.ts` (and the stub implementation in
   `src/sdk-stub/pocketpay-sdk.js` if applicable).
2. Run `npm run api:update` and commit the regenerated
   `api-reports/pocketpay-sdk.api.md` alongside your change.
3. Add a line under **Changed** (or **Removed**, for a breaking removal) in
   [`CHANGELOG.md`](../CHANGELOG.md) describing the change to the SDK
   surface, e.g. `importWallet now returns secretKey in addition to
   publicKey`.

A PR that changes the declaration file without an updated baseline and
changelog entry should be treated the same as any other unreviewed public API
break.

## Extending the check

The script is intentionally scoped to the single `declare module
'pocketpay-sdk'` block. If the project later adds other packages meant for
external consumption (or the real `pocketpay-sdk` is published and gains its
own `.d.ts` output), point `DECL_FILE`/`MODULE_NAME` at the new source, or
duplicate the pattern with a second baseline file — the extraction and diff
logic doesn't need to change.
