import { Lock } from '../../src/store/vaultStore';

/**
 * Vault lock fixtures for wallet/vault UI and store tests.
 *
 * `Lock.status` only has two real states (`'locked'` | `'matured'`) — there is
 * no separate `'withdrawn'` status in `vaultStore`; once a lock is withdrawn
 * it is simply removed from the `locks` array. Fixtures below reflect that.
 */

const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_VAULT_LOCKS: Lock[] = [
  {
    id: 'lock-1',
    amount: '100.0000000',
    unlockDate: inDays(30),
    status: 'locked',
    createdAt: inDays(-5),
  },
  {
    id: 'lock-2',
    amount: '50.5000000',
    unlockDate: inDays(-10),
    status: 'matured',
    createdAt: inDays(-40),
  },
  {
    id: 'lock-3',
    amount: '200.0000000',
    unlockDate: inDays(60),
    status: 'locked',
    createdAt: inDays(-15),
  },
  {
    id: 'lock-4',
    amount: '75.0000000',
    unlockDate: inDays(-2),
    status: 'matured',
    createdAt: inDays(-32),
  },
];

/**
 * Scenario builders for vault lock lists, grouped by the states a screen or
 * store test actually needs to assert against. Use these instead of the flat
 * `MOCK_VAULT_LOCKS` array when the test cares about a specific state mix.
 */
export const vaultLockScenarios: {
  /** A mix of locked and matured locks — the general-purpose default. */
  mixed: Lock[];
  /** Only immature (not yet unlockable) locks. */
  allLocked: Lock[];
  /** Only matured (withdrawable) locks. */
  allMatured: Lock[];
  /** No locks at all — the empty-state case. */
  empty: Lock[];
} = {
  mixed: MOCK_VAULT_LOCKS,
  allLocked: MOCK_VAULT_LOCKS.filter((lock) => lock.status === 'locked'),
  allMatured: MOCK_VAULT_LOCKS.filter((lock) => lock.status === 'matured'),
  empty: [],
};
