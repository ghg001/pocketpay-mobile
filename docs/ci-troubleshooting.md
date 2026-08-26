# CI Troubleshooting Guide

A reference for the checks that run against every pull request — what they
check, the exact command to reproduce a failure locally, and fixes for the
errors contributors hit most often.

This guide is about **fixing red checks**. For initial project setup, see the
[Mobile Onboarding Checklist](mobile-onboarding-checklist.md). For what
evaluators look for on GrantFox contract issues, see the
[Evaluation Readiness Checklist](evaluation-readiness-checklist.md).

> ⚠️ **Failing CI can block PR approval and payment evaluation.** Reviewers
> and the GrantFox evaluation process expect all checks to pass before a PR
> is merged. Don't skip, mute, or work around a failing check — fix the
> underlying problem, or ask a maintainer if you believe the check itself is
> wrong.

## Run These Locally Before You Push

Reproduce what CI checks in four commands:

```bash
npm install --legacy-peer-deps   # dependencies
npm run typecheck                # TypeScript
npm run lint                     # lint / formatting
npm test                         # unit and integration tests
```

If your change touches `src/types/pocketpay-sdk.d.ts` or `src/sdk-stub/`,
also run `npm run api:check` (see
[SDK API Compatibility](sdk-api-compatibility.md)).

All four commands must exit cleanly before you open a PR.

---

## Dependency Errors

### `npm install` fails with peer dependency conflicts

```
npm error ERESOLVE unable to resolve dependency tree
```

This project has known React Native peer dependency conflicts. Always install
with:

```bash
npm install --legacy-peer-deps
```

A plain `npm install` (without the flag) is expected to fail — that's not a
broken project, it's a missing flag.

### Multiple lock files

Run `npx expo-doctor` and you may see:

```
✖ Check for lock file
Multiple lock files detected (pnpm-lock.yaml, package-lock.json, bun.lock).
This may result in unexpected behavior in CI environments, such as EAS
Build, which infer the package manager from the lock file.
```

Expo's CLI infers the package manager from whichever lock file it finds. If a
stray `bun.lock` or `pnpm-lock.yaml` ends up in your working tree (for
example, from running `bunx` or `pnpm install` once out of habit), Expo
tooling can silently switch to that package manager instead of npm. If that
package manager isn't installed, commands fail with something like:

```
✖ Failed to install eslint@^9.0.0, eslint-config-expo@~10.0.0 with error: spawn bun ENOENT
```

This project uses **npm** — `package-lock.json` is the only lock file that
should exist. If you see extra lock files in `git status`, delete the ones
you didn't intentionally create and reinstall with npm.

### `postinstall` seems stuck or the app fails to build with an SDK error

The `postinstall` script builds the PocketPay SDK from a pinned source commit
(it isn't published to npm), which takes longer than a typical install. Let
it run to completion. If a build genuinely fails partway through:

```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

---

## TypeScript Errors (`npm run typecheck`)

`npm run typecheck` runs `tsc --noEmit` — no output is emitted, only type and
syntax errors are reported. Read the **first** error in the output first;
syntax errors (unbalanced braces, unclosed JSX tags) frequently cascade into
dozens of unrelated-looking errors further down the file. Fixing the first
one often clears most of the rest. Common shapes you'll see:

- `error TS2657: JSX expressions must have one parent element.` — a
  component returns multiple sibling elements without a single wrapping
  element or `<>...</>` fragment.
- `error TS1005: '}' expected.` / `error TS17015: Expected corresponding
  closing tag for JSX fragment.` — a missing or extra closing brace/tag
  earlier in the file; scroll up from the reported line.

The TypeScript compiler reports the *symptom's* location, not always the
*cause's* location — if an error looks nonsensical at the reported line,
check the nearest unclosed brace or tag above it.

---

## Lint / Formatting (`npm run lint`)

This project doesn't have a separate `prettier`/`eslint` setup — linting goes
through Expo's built-in wrapper, which uses `eslint-config-expo` under the
hood:

```bash
npm run lint
```

- On a machine without ESLint configured yet, `expo lint` offers to install
  `eslint` and `eslint-config-expo` automatically. Let it — it only touches
  `devDependencies`.
- Auto-fix what can be auto-fixed (the `--` is required so npm passes `--fix`
  through to `expo lint` instead of swallowing it as an npm flag):
  ```bash
  npm run lint -- --fix
  ```
- If the auto-install step fails with `spawn bun ENOENT` (or a similar
  "package manager not found" error), see **Multiple lock files** above —
  Expo picked the wrong package manager because of a stray lock file.

---

## Test Failures (`npm test`)

`npm test` runs `jest --watchAll=false` once and exits. A few failure
patterns show up repeatedly:

### `SyntaxError: Unexpected token 'export'`

```
node_modules/some-package/dist/esm/some-package.mjs:8
export { default as Foo } from './icons/foo.mjs';
^^^^^^
SyntaxError: Unexpected token 'export'
```

Jest runs tests through Node, which doesn't understand ES module `export`
syntax out of the box. This happens when a `node_modules` package ships an
ESM build (`dist/esm/*.mjs`) and Jest's `transformIgnorePatterns` doesn't
include it, so Jest tries to run the raw `.mjs` file instead of transforming
it. It surfaces in any test that imports a component which imports the
untransformed package (for example, an icon library like
`lucide-react-native`).

**Fix:** add the offending package to the `transformIgnorePatterns` entry in
the `"jest"` block of `package.json` so Jest transforms it instead of
skipping it. If you're not sure which package is at fault, the file path in
the error (`node_modules/<package>/...`) tells you.

### `Your test suite must contain at least one test`

```
FAIL tests/SomeScreen.test.tsx
● Test suite failed to run
  Your test suite must contain at least one test.
```

A test file exists but has no `it(...)`/`test(...)` blocks — usually a
placeholder file created before the tests were written, or every test inside
was commented out. Either add at least one real test or delete the file; an
empty test file left in the repo will fail CI every time.

### `Exceeded timeout of 5000 ms for a test`

Jest's default per-test timeout is 5 seconds. This usually means a promise
never resolves — a mock that doesn't call back, or an `await` on something
that's waiting on a real timer/network call that doesn't exist in the test
environment. Check that every async dependency (Stellar SDK calls,
`SecureStore`, timers) is mocked — see the patterns in `__mocks__/` and
`src/services/__mocks__/`. Only raise the test's timeout
(`it('...', async () => { ... }, 10000)`) once you've confirmed the test is
legitimately slow rather than actually hung.

### Missing mocks for native/SDK modules

If a test throws while importing `expo-secure-store`, `expo-router`, or the
Stellar SDK, check whether an existing mock under `__mocks__/` or
`src/services/__mocks__/` already covers it before writing a new one — most
native and SDK dependencies already have a project-level mock to reuse.

---

## Expo-Specific Setup Issues (`npx expo-doctor`)

`npx expo-doctor` runs a broader set of Expo/EAS-oriented health checks
beyond what `tsc` and `jest` cover — config schema validity, native module
compatibility, and package manager consistency:

```bash
npx expo-doctor
```

- **Multiple lock files** — see above.
- **`Check Expo config (app.json/ app.config.js) schema` fails with `fetch
  failed`** — this check calls Expo's remote API to validate `app.json`
  against the current schema. In a sandboxed or offline environment without
  outbound network access, this check cannot run and will fail regardless of
  whether your config is valid. If every other check passes and you have no
  network access, this is expected — re-run it somewhere with internet
  access before relying on its result.
- **Blank screen or a stale Metro bundler error** — clear the Metro cache:
  ```bash
  npx expo start --clear
  ```

---

## Clean Install ("Nuke It From Orbit")

When in doubt, or after switching branches with very different dependencies:

```bash
rm -rf node_modules
rm -f pnpm-lock.yaml bun.lock   # keep only package-lock.json
npm install --legacy-peer-deps
npm run typecheck
npm run lint
npm test
```

If all four still fail identically after a clean install, the problem is
almost certainly in your changes rather than your environment.

---

## What Reviewers and Evaluators Expect

- All required checks pass on the PR — don't open a PR with known-failing
  checks and a promise to "fix it after."
- If a check fails for a reason unrelated to your change (a pre-existing
  issue on `main`), say so explicitly in the PR description rather than
  silently leaving it red.
- For GrantFox contract issues specifically, a green CI run is necessary but
  not sufficient — see the
  [Evaluation Readiness Checklist](evaluation-readiness-checklist.md) for the
  full bar before payment evaluation.
