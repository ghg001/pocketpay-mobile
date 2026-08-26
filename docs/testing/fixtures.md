# Test Fixture Framework

Reusable, typed fixtures for the states this app's screens and stores need to
render/test: wallet balance, payment readiness, vault locks, transaction
records, network/API errors, and diagnostics export payloads. All fixtures
live under `tests/fixtures/` and are re-exported from `tests/fixtures/index.ts`,
so a test only needs one import line regardless of how many categories it uses.

## Why this exists

Before this framework, mock data for wallet/vault/transaction states was
either hand-rolled inline per test or scattered across a handful of
`tests/fixtures/*.ts` files that had drifted from the types they were meant to
model — for example, `tests/fixtures/vaultLocks.ts` shipped a flat mock array
while a separate `tests/fixtures/vault.ts` shipped a richer, *broken* variant
(it imported a `VaultLock` type that had been removed from `src/types/vault.ts`
and was never actually exported or used anywhere). Both existed side by side,
neither was consumed by a single test. This framework consolidates that into
one place per domain, keeps each fixture's shape pinned to the real store/type
it models, and — critically — is actually imported by tests, so it can't drift
silently again without a test failing.

## What's available

```ts
import {
  walletFixture,
  balanceFixture,
  contactsFixture,
  transactionFixtures,
  errorFixtures,
  MOCK_VAULT_LOCKS,
  vaultLockScenarios,
  walletReadinessFixtures,
  paymentAttemptFixtures,
  diagnosticsFixtures,
} from '../tests/fixtures'; // adjust the relative path to your test file
```

| File | Exports | Models |
|---|---|---|
| `wallet.ts` | `walletFixture`, `balanceFixture` | A public key and a Horizon-shaped balances array. |
| `contacts.ts` | `contactsFixture` | A short address-book list. |
| `transactions.ts` | `transactionFixtures` | A mixed set of Horizon-shaped payment/create-account records, including one with no `status` field (mirrors real records — Horizon never sends one). |
| `errors.ts` | `errorFixtures` | API/network failure shapes: `networkError`, `timeoutError`, `offlineError`, `rateLimitError`, `accountNotFound`, `insufficientBalance`. |
| `vaultLocks.ts` | `MOCK_VAULT_LOCKS`, `vaultLockScenarios` | Vault locks typed as `Lock` from `src/store/vaultStore` (not a separate, drifted type). `vaultLockScenarios` groups them into `mixed` / `allLocked` / `allMatured` / `empty` so a test can pick the state mix it actually needs instead of filtering the flat array itself. |
| `payment.ts` | `walletReadinessFixtures`, `paymentAttemptFixtures` | `walletReadinessFixtures` covers the `BalanceState` × `FundingStatus` combinations from `src/types/balance.ts` that gate whether a payment can be sent (`idle`, `loading`, `readyToPay`, `fundedZeroBalance`, `unfunded`, `balanceUnavailable`). `paymentAttemptFixtures` covers a single outgoing payment at each `TransactionStatus` stage. |
| `diagnostics.ts` | `diagnosticsFixtures` | Full redacted diagnostics snapshots (the shape `getDiagnostics()` in `src/utils/diagnostics.ts` produces), for testing anything that renders or shares a diagnostics report without needing a real device or store. Includes a healthy snapshot, one with `secureStoreAvailable: false`, and one with an active network error plus a reported crash. |

No fixture contains a real secret key, seed phrase, or RPC credential — public
keys are syntactically valid but not real Stellar accounts, matching the
existing `walletFixture`/`contactsFixture` convention.

## Usage patterns

**Rendering a component with a specific data shape** — pass a fixture (or a
field from one) straight in as a prop:

```tsx
import { render } from '@testing-library/react-native';
import { MultiLockList } from '../src/components/MultiLockList';
import { vaultLockScenarios } from '../tests/fixtures';

it('shows both locked and matured locks', () => {
  const { getAllByText } = render(<MultiLockList locks={vaultLockScenarios.mixed} />);
  expect(getAllByText('Locked').length).toBeGreaterThan(0);
});
```

**Mocking an async data-fetch function** — `mockResolvedValue` a fixture (or
`JSON.stringify` it, if the function returns a serialized string like
`getDiagnostics()` does):

```tsx
import { getDiagnostics } from '../src/utils/diagnostics';
import { diagnosticsFixtures } from '../tests/fixtures';

jest.mock('../src/utils/diagnostics', () => ({ getDiagnostics: jest.fn() }));
const mockGetDiagnostics = getDiagnostics as jest.MockedFunction<typeof getDiagnostics>;

it('renders a healthy diagnostics snapshot', async () => {
  mockGetDiagnostics.mockResolvedValue(JSON.stringify(diagnosticsFixtures.healthy));
  // render + assert
});
```

**Driving a store mock** — spread a fixture's fields into the store state
override your test already builds (see `setupStores()` in `__tests__/vault.test.tsx`
for the pattern):

```tsx
mockUseWalletStore.mockReturnValue({
  ...baseState,
  ...walletReadinessFixtures.unfunded,
});
```

See `__tests__/MultiLockList.test.tsx`, `__tests__/diagnosticsScreen.test.tsx`,
and `__tests__/FundingStatusBanner.test.tsx` for complete, currently-passing
examples of each pattern above.

## Adding a new fixture

1. Put it in the file for its domain (or add a new `tests/fixtures/<domain>.ts`
   file if it's a genuinely new domain).
2. Type it against the **real** type the store/component uses — import from
   `src/`, don't redeclare the shape locally. This is what caught the
   `vault.ts`/`vaultLocks.ts` drift described above; a fixture typed against a
   type that no longer exists fails to compile instead of silently drifting.
3. Export it from `tests/fixtures/index.ts`.
4. Prefer a `Record<string, T>` of named scenarios (e.g. `walletReadinessFixtures.unfunded`)
   over a single flat value when the domain has more than one meaningfully
   different state — it documents itself at the call site.
