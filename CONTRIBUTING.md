# Contributing to PocketPay Mobile

Thank you for your interest in contributing to PocketPay Mobile! We welcome pull requests, bug reports, and feature requests from everyone.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [UI & Design Guidelines](#ui--design-guidelines)
- [Accessibility](#accessibility)
- [Security](#security)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Contributor Self-Assessment](#contributor-self-assessment)
- [Code of Conduct](#code-of-conduct)

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | v18 or later | LTS recommended. Use [nvm](https://github.com/nvm-sh/nvm) to manage versions. |
| **npm** | v9 or later | Comes bundled with Node.js. |
| **Expo CLI** | Latest | Install globally: `npm install -g expo-cli` |
| **Expo Go** | Latest | Install on your iOS or Android device from the App Store / Play Store. |
| **Git** | Any recent version | Required for cloning and branching. |

> **iOS Simulator / Android Emulator (optional):** If you want to run the app without a physical device, install Xcode (macOS only) or Android Studio.

---

## Installation

1. **Fork** the repository on GitHub, then clone your fork locally:

   ```bash
   git clone https://github.com/<your-username>/pocketpay-mobile.git
   cd pocketpay-mobile
   ```

2. **Install dependencies.** This project requires the `--legacy-peer-deps` flag due to React Native peer dependency conflicts:

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in any required values. Do **not** commit real secret keys or credentials — see the [Security Guide](docs/security.md) for safe practices.

---

## Running the App

Start the Expo development server:

```bash
npm start
```

This opens the Expo Metro bundler in your browser. From there you can:

- Press `a` to open on an Android emulator or connected device.
- Press `i` to open on an iOS simulator (macOS only).
- Scan the QR code with the **Expo Go** app on your physical device.

Other available scripts:

```bash
npm run android   # Launch directly on Android
npm run ios       # Launch directly on iOS (macOS only)
npm run web       # Launch in a browser (limited support)
```

> ⚠️ **This app runs on the Stellar Testnet only.** Testnet XLM has no real monetary value. Never connect a Mainnet wallet during development.

---

## Project Structure

```
pocketpay-mobile/
├── app/                  # Expo Router screens (file-based routing)
│   ├── (auth)/           # Auth flow: welcome, create wallet, import wallet
│   └── (tabs)/           # Main tab navigation: home, history, vault, settings
├── src/
│   ├── components/       # Reusable UI components
│   ├── constants/        # Theme tokens (colours, spacing, typography)
│   ├── services/         # Stellar SDK integration
│   ├── store/            # Zustand state management
│   └── utils/            # Validation helpers and utilities
├── docs/                 # Project documentation
├── tests/                # Integration tests and fixtures
└── __tests__/            # Component and unit tests
```

---

## Testing

This project uses **Jest** with **jest-expo** and **React Native Testing Library**.

Run the full test suite once:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

### UI Testing Expectations

- Before touching a screen, check its row in the
  [Screen Test Matrix](docs/screen-test-matrix.md) for the test types it's
  expected to have and its current coverage status. If you add a new screen,
  add a row for it in the same PR.
- All new screens and interactive components **must include tests**.
- Use `@testing-library/react-native` to render components and interact with them via accessible queries (`getByRole`, `getByLabelText`, etc.).
- Test the key user-facing behaviours: form validation, loading states, error messages, and successful flows.
- Mock external dependencies (Stellar SDK, SecureStore, AsyncStorage) — see the existing mocks in `__mocks__/` and `src/services/__mocks__/` for patterns to follow.
- Tests should pass before you open a PR. CI will run the suite automatically on every push.

### SDK API Compatibility

If your change touches `src/types/pocketpay-sdk.d.ts` or `src/sdk-stub/`, run:

```bash
npm run api:check
```

This detects accidental changes to the `pocketpay-sdk` public contract. If the
change is intentional, run `npm run api:update`, commit the regenerated
`api-reports/pocketpay-sdk.api.md`, and note the change in `CHANGELOG.md`. See
[docs/sdk-api-compatibility.md](docs/sdk-api-compatibility.md) for details.

---

## UI & Design Guidelines

Before adding new screens or components, read the [Design System Guide](docs/design-system.md). Key rules:

- **Always import design tokens** from `src/constants/theme.ts` (`COLORS`, `SIZES`, `RADIUS`, `FONTS`). Never hardcode hex values or pixel sizes.
- The app uses a **dark-only palette** — there is no light mode.
- Use `COLORS.primary` (`#00E5FF`) for the primary action on a screen and `COLORS.secondary` (`#7B61FF`) for a competing secondary action.
- Follow the card, button, and input patterns documented in the design system.
- Review every changed screen and reusable component against the [UI State Catalogue](docs/ui-states.md), including loading, empty, error, success, disabled, and pending behavior.

---

## Accessibility

We strive to build a wallet that is accessible to everyone. Before submitting a PR for any UI changes, verify your work against the [Accessibility Checklist](docs/accessibility.md). Highlights:

- Add `accessible={true}` and descriptive `accessibilityLabel` props to interactive elements.
- Minimum touch target size of **44×44 dp** for all tappable elements.
- Maintain a **4.5:1 contrast ratio** for text.
- Announce loading states and errors to screen readers using `accessibilityState` and `accessibilityLiveRegion`.

---

## Security

- **Never commit secret keys, `.env` files, or credentials** to version control.
- All key storage must go through `expo-secure-store` as documented in the [Storage Guide](docs/storage.md).
- Read the full [Security Guide](docs/security.md) before touching key management, storage, or any authentication flow.
- Unexpected crashes are handled by the root ErrorBoundary and redacted reporting funnel — see [Global Error Handling](docs/error-handling.md).
- If you discover a security vulnerability, please report it privately rather than opening a public issue.

---

## Submitting a Pull Request

1. **Create a branch** from `main` with a descriptive name:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes**, following the code style, design system, accessibility, and testing guidelines above.

3. **Run the tests** and make sure everything passes:

   ```bash
   npm test
   ```

   Also run `npm run typecheck` and `npm run lint` — all three, plus your
   tests, are expected to pass before you open a PR. If any of them fail and
   you're not sure why, see the
   [CI Troubleshooting Guide](docs/ci-troubleshooting.md).

4. **Commit** with a clear, descriptive message:

   ```bash
   git commit -m "feat: add QR code sharing on Receive screen"
   ```

5. **Push** your branch and open a pull request against `main`:

   ```bash
   git push -u origin feat/your-feature-name
   ```

6. Before opening the PR, run through the [Self-Review Checklist](docs/self-review-checklist.md) — feature completion, tests, CI, screenshots, and device/emulator verification.

7. In the PR description:
   - Summarise what changed and why.
   - Reference any related issues using `Closes #<issue-number>`.
   - Describe how you tested the change.
   - Note any accessibility or security considerations.
   - For GrantFox mobile issues, run through the [Issue Approval Readiness Checklist](docs/issue-approval-readiness-checklist.md) before requesting review, then the full [Evaluation Readiness Checklist](docs/evaluation-readiness-checklist.md) before the payment evaluation period. A merged PR does not guarantee payment approval.

8. A maintainer will review your PR. Please respond to feedback and update your branch as needed.

---

## Contributor Self-Assessment

Before requesting review, complete the
[Contributor Self-Assessment Form](docs/contributor-self-assessment.md). The
form asks you to confirm the issue scope, provide test evidence and CI status,
review documentation, disclose known limitations, and map every acceptance
criterion to evidence.

Update the assessment after substantial changes to the pull request. Check an
item only after verifying it; if an item does not apply, write
`Not applicable — <reason>`. An incomplete assessment means the pull request is
not ready for review or payment evaluation.

The pull request template contains a concise version of the assessment. The
standalone form provides the full prompts and should be used when more detail is
needed.

---

## Code of Conduct

Be respectful and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Harassment, discrimination, or hostile behaviour will not be tolerated.

### Payment-Period Communication

Merging a pull request does **not** trigger or guarantee payment — approval is
decided by the GrantFox evaluation process. During the payment evaluation period,
contributors are expected to communicate professionally and to:

- **Avoid spam and pressure.** Do not post repeated or duplicate payment-status
  messages, tag maintainers to demand faster responses, or direct complaints at
  reviewers because a merge did not result in immediate payment.
- **Self-review first.** Before raising any payment concern, confirm your work
  against the [Self-Review Checklist](docs/self-review-checklist.md), the
  [Contributor Self-Assessment](docs/contributor-self-assessment.md), and the
  [Evaluation Readiness Checklist](docs/evaluation-readiness-checklist.md).
- **Raise genuine concerns once.** If a specific, evidenced concern remains,
  post it a single time in the relevant thread and wait for a response.

See the full [Payment-Period Communication Policy](docs/payment-period-communication-policy.md)
for the complete expectations.

---

*Happy building! If you have questions, open a discussion or leave a comment on the relevant issue.*
