import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVaultStore, Lock } from '../src/store/vaultStore';
import { withdrawFromVault } from '../src/services/vault';
import { mockWithdrawFromVault } from '../src/services/stellar';
import { toWithdrawalErrorCode } from '../src/features/vault/maturedLockWithdrawal';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

jest.mock('../src/services/vault', () => ({
  isVaultConfigured: jest.fn(() => false),
  getVaultContractId: jest.fn(() => ''),
  getVaultBalance: jest.fn(async () => '0.0000000'),
  depositToVault: jest.fn(async () => 'deposit-hash'),
  withdrawFromVault: jest.fn(async () => 'withdraw-hash'),
}));

jest.mock('../src/services/stellar', () => ({
  fetchXlmBalance: jest.fn(async () => '0.0000000'),
  fetchTransactionsPage: jest.fn(async () => ({ records: [], nextCursor: null, hasMore: false })),
  fundWithFriendbot: jest.fn(async () => {}),
  mockFetchVaultBalance: jest.fn(async () => '0.0000000'),
  mockDepositToVault: jest.fn(async () => true),
  mockWithdrawFromVault: jest.fn(async () => true),
}));

const PUBLIC_KEY = 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH';

const maturedLock: Lock = {
  id: 'lock-matured',
  amount: '50.5000000',
  unlockDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  status: 'matured',
  createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
};

const pendingLock: Lock = {
  id: 'lock-pending',
  amount: '10.0000000',
  unlockDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  // A stale status: the lock has not actually matured yet.
  status: 'matured',
  createdAt: new Date().toISOString(),
};

const getSecretKey = jest.fn(async () => 'SECRET');

const seedStore = (overrides: Partial<ReturnType<typeof useVaultStore.getState>> = {}) => {
  useVaultStore.setState({
    locks: [maturedLock, pendingLock],
    isConfigured: false,
    contractId: '',
    isSubmitting: false,
    balance: '0.0000000',
    ...overrides,
  });
};

describe('vaultStore.withdrawMaturedLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStore();
  });

  it('withdraws a matured lock through the placeholder when no contract is configured', async () => {
    const result = await useVaultStore
      .getState()
      .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey });

    expect(result).toEqual({ amount: '50.5000000', hash: null, isPreview: true });
    expect(mockWithdrawFromVault).toHaveBeenCalled();
    expect(withdrawFromVault).not.toHaveBeenCalled();
    expect(getSecretKey).not.toHaveBeenCalled();
  });

  it('submits through the vault service and returns the hash when a contract is configured', async () => {
    seedStore({ isConfigured: true, contractId: 'CDVAULT' });

    const result = await useVaultStore
      .getState()
      .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey });

    expect(withdrawFromVault).toHaveBeenCalledWith('SECRET', '50.5000000');
    expect(result).toEqual({ amount: '50.5000000', hash: 'withdraw-hash', isPreview: false });
  });

  it('removes the lock and persists the remaining locks after a successful withdrawal', async () => {
    await useVaultStore
      .getState()
      .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey });

    expect(useVaultStore.getState().locks.map((lock) => lock.id)).toEqual([pendingLock.id]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@pocketpay_vault_locks',
      JSON.stringify([pendingLock])
    );
  });

  it('clears the submitting flag once the withdrawal resolves', async () => {
    await useVaultStore
      .getState()
      .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey });

    expect(useVaultStore.getState().isSubmitting).toBe(false);
  });

  it('rejects a lock whose unlock date has not passed, even if its status says matured', async () => {
    await expect(
      useVaultStore
        .getState()
        .withdrawMaturedLock(pendingLock.id, { publicKey: PUBLIC_KEY, getSecretKey })
    ).rejects.toMatchObject({ code: 'not-matured' });

    expect(mockWithdrawFromVault).not.toHaveBeenCalled();
    expect(useVaultStore.getState().locks).toHaveLength(2);
  });

  it('rejects when the lock is no longer in the vault', async () => {
    await expect(
      useVaultStore
        .getState()
        .withdrawMaturedLock('missing-lock', { publicKey: PUBLIC_KEY, getSecretKey })
    ).rejects.toMatchObject({ code: 'lock-not-found' });
  });

  it('rejects when no wallet is loaded', async () => {
    await expect(
      useVaultStore
        .getState()
        .withdrawMaturedLock(maturedLock.id, { publicKey: null, getSecretKey })
    ).rejects.toMatchObject({ code: 'no-wallet' });
  });

  it('rejects without touching the vault when the wallet key cannot be read', async () => {
    seedStore({ isConfigured: true });
    const noSecret = jest.fn(async () => null);

    await expect(
      useVaultStore
        .getState()
        .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey: noSecret })
    ).rejects.toMatchObject({ code: 'secret-unavailable' });

    expect(withdrawFromVault).not.toHaveBeenCalled();
    expect(useVaultStore.getState().locks).toHaveLength(2);
  });

  it('keeps the lock and reports a network failure when submission fails', async () => {
    seedStore({ isConfigured: true });
    (withdrawFromVault as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

    const error = await useVaultStore
      .getState()
      .withdrawMaturedLock(maturedLock.id, { publicKey: PUBLIC_KEY, getSecretKey })
      .catch((caught) => caught);

    expect(toWithdrawalErrorCode(error)).toBe('network');
    expect(useVaultStore.getState().locks).toHaveLength(2);
    expect(useVaultStore.getState().isSubmitting).toBe(false);
  });
});
