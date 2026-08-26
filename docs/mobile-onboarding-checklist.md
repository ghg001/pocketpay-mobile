# Mobile Contributor Onboarding Checklist

A quick-reference checklist for getting PocketPay Mobile running locally. For
full details on any step, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Prerequisites

- [ ] Node.js v18 or later installed (`node -v`) — LTS recommended, use [nvm](https://github.com/nvm-sh/nvm) if you need to switch versions
- [ ] npm v9 or later (`npm -v`) — bundled with Node.js
- [ ] Git installed
- [ ] [Expo Go](https://expo.dev/go) installed on your physical iOS/Android device, **or** Xcode (macOS only) / Android Studio if you'd rather use a simulator/emulator

## Local Setup

- [ ] Fork the repo, then clone your fork:
```bash
  git clone https://github.com/<your-username>/pocketpay-mobile.git
  cd pocketpay-mobile
```
- [ ] Install dependencies with the required flag:
```bash
  npm install --legacy-peer-deps
```
  > The `--legacy-peer-deps` flag is **required**, not optional — this project
  > has known React Native peer dependency conflicts that a plain `npm install`
  > will fail on.
- [ ] Wait for the `postinstall` script to finish. It builds the PocketPay SDK
  from a pinned source commit, since the SDK isn't published to npm. This
  step can take longer than a typical `npm install` — let it run to
  completion rather than assuming it's hung.
- [ ] Copy the environment file:
```bash
  cp .env.example .env
```
  The defaults point at Stellar **Testnet** and work out of the box for most
  development. You only need to edit `.env` if you're testing the Soroban
  Savings Vault against a real deployed contract — otherwise leave
  `EXPO_PUBLIC_VAULT_CONTRACT_ID` empty and the vault screen runs in safe
  mock mode.

## Running the App

- [ ] Start the dev server:
```bash
  npm start
```
- [ ] From the Metro bundler screen, choose one:
  - Scan the QR code with **Expo Go** on your physical device
  - Press `a` for an Android emulator
  - Press `i` for an iOS simulator (macOS only)
- [ ] Confirm the app loads to the wallet welcome screen without a red error
  overlay

## Common Errors

- [ ] **`npm install` fails with peer dependency errors** — you forgot
  `--legacy-peer-deps`. Re-run with the flag.
- [ ] **App fails to build with an SDK-related error** — the `postinstall`
  script may not have completed. Try `rm -rf node_modules && npm install
  --legacy-peer-deps` again and let `postinstall` finish fully before
  starting the app.
- [ ] **Blank screen or Metro bundler error on first launch** — stop the
  server, clear the Metro cache, and restart: `npx expo start --clear`
- [ ] **Vault screen behaves unexpectedly / tries to hit a real contract** —
  check that `EXPO_PUBLIC_VAULT_CONTRACT_ID` in `.env` is empty unless you
  intentionally set it; a non-empty value switches the vault out of mock mode
- [ ] **Expo Go can't connect to the dev server** — make sure your phone and
  computer are on the same network, and no VPN is interfering with the LAN
  connection

## Common CI Failures

If your PR's checks fail once you're up and running, don't guess — the
[CI Troubleshooting Guide](ci-troubleshooting.md) covers the TypeScript,
lint, test, and Expo-specific failures contributors hit most often, with the
exact local command to reproduce each one.

## You're Ready When

- [ ] The app runs locally with no red error overlay
- [ ] You've read the [Design System Guide](design-system.md) if you plan to
  touch UI
- [ ] You've read the [Accessibility Checklist](accessibility.md) if you plan
  to touch UI
- [ ] You've read the [Security Guide](security.md) if you plan to touch key
  management, storage, or auth

Questions? Open a discussion or comment on the relevant issue.
