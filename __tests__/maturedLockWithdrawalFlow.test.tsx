import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VaultLockDetail } from '../src/components/VaultLockDetail';
import { useVaultStore, Lock } from '../src/store/vaultStore';
import { withdrawFromVault } from '../src/services/vault';

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

const mockWalletState = {
  publicKey: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH' as string | null,
  getSecretKey: jest.fn(async () => 'SECRET'),
};

jest.mock('../src/store/walletStore', () => ({
  useWalletStore: jest.fn((selector?: (state: unknown) => unknown) =>
    selector ? selector(mockWalletState) : mockWalletState
  ),
}));

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: {
      primary: '#00E5FF',
      primaryDark: '#00B8CC',
      secondary: '#7B61FF',
      background: '#0B0D17',
      surface: '#15192B',
      surfaceLight: '#1E243D',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0AABF',
      textMuted: '#637087',
      border: '#2A314A',
      success: '#00E676',
      warning: '#FFC400',
      error: '#FF3D00',
    },
  }),
}));

jest.mock('lucide-react-native', () => ({
  Calendar: () => null,
  Clock: () => null,
  DollarSign: () => null,
  Lock: () => null,
  Unlock: () => null,
  Info: () => null,
  Timer: () => null,
  HelpCircle: () => null,
  ArrowUpCircle: () => null,
  CheckCircle: () => null,
  AlertTriangle: () => null,
  Network: () => null,
  ShieldAlert: () => null,
  X: () => null,
}));

const maturedLock: Lock = {
  id: 'lock-matured',
  amount: '50.5000000',
  unlockDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  status: 'matured',
  createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
};

const lockedLock: Lock = {
  id: 'lock-pending',
  amount: '10.0000000',
  unlockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'locked',
  createdAt: new Date().toISOString(),
};

const seedVault = (isConfigured = false) => {
  useVaultStore.setState({
    locks: [maturedLock, lockedLock],
    isConfigured,
    contractId: isConfigured ? 'CDVAULTCONTRACTID' : '',
    isSubmitting: false,
  });
};

describe('matured lock withdrawal flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletState.publicKey = 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH';
    seedVault();
  });

  it('shows eligibility and offers withdrawal for a matured lock', () => {
    const { getByText, getByTestId } = render(<VaultLockDetail lock={maturedLock} />);

    getByText('Ready to withdraw');
    getByText(/ready to withdraw whenever you like/i);
    expect(getByTestId('withdraw-funds-button').props.accessibilityState.disabled).toBe(false);
  });

  it('does not offer withdrawal while the lock is still locked', () => {
    const { queryByTestId, getByText } = render(<VaultLockDetail lock={lockedLock} />);

    expect(queryByTestId('withdraw-funds-button')).toBeNull();
    getByText(/You can withdraw on/i);
  });

  it('disables withdrawal and explains why when no wallet is loaded', () => {
    mockWalletState.publicKey = null;
    const { getByTestId, getByText } = render(<VaultLockDetail lock={maturedLock} />);

    expect(getByTestId('withdraw-funds-button').props.accessibilityState.disabled).toBe(true);
    getByText('Connect a wallet before withdrawing from the vault.');
  });

  it('requires an explicit confirmation step before withdrawing', () => {
    const { getByTestId, getByText, getAllByText, queryByTestId } = render(
      <VaultLockDetail lock={maturedLock} />
    );

    expect(queryByTestId('matured-lock-withdrawal-modal')).toBeNull();

    fireEvent.press(getByTestId('withdraw-funds-button'));

    getByText('Withdraw matured lock');
    getByText('Matured on');
    // The amount appears on the lock card and again in the confirmation.
    expect(getAllByText('50.5000000 XLM')).toHaveLength(2);
    getByTestId('confirm-withdrawal-button');
  });

  it('states that no funds move while no vault contract is configured', () => {
    const { getByTestId, getByText } = render(<VaultLockDetail lock={maturedLock} />);
    fireEvent.press(getByTestId('withdraw-funds-button'));

    getByText(/No vault contract is configured yet/i);
  });

  it('shows a loading state and then a success state, removing the lock', async () => {
    seedVault(true);
    const { getByTestId, getByText } = render(<VaultLockDetail lock={maturedLock} />);

    fireEvent.press(getByTestId('withdraw-funds-button'));
    fireEvent.press(getByTestId('confirm-withdrawal-button'));

    getByTestId('withdrawal-loading');

    await waitFor(() => getByText('Withdrawal complete'));
    getByText('withdraw-hash');
    expect(useVaultStore.getState().locks.map((lock) => lock.id)).toEqual([lockedLock.id]);
  });

  it('cancels back out of the confirmation without withdrawing', () => {
    const { getByTestId, getByText, queryByText } = render(<VaultLockDetail lock={maturedLock} />);

    fireEvent.press(getByTestId('withdraw-funds-button'));
    fireEvent.press(getByText('Cancel'));

    expect(queryByText('Withdraw matured lock')).toBeNull();
    expect(useVaultStore.getState().locks).toHaveLength(2);
  });

  it('surfaces a retryable failure and succeeds on retry', async () => {
    seedVault(true);
    (withdrawFromVault as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

    const { getByTestId, getByText } = render(<VaultLockDetail lock={maturedLock} />);

    fireEvent.press(getByTestId('withdraw-funds-button'));
    fireEvent.press(getByTestId('confirm-withdrawal-button'));

    await waitFor(() => getByText('Network problem'));
    getByText(/still locked in the vault/i);
    expect(useVaultStore.getState().locks).toHaveLength(2);

    fireEvent.press(getByTestId('retry-withdrawal-button'));

    await waitFor(() => getByText('Withdrawal complete'));
    expect(useVaultStore.getState().locks).toHaveLength(1);
  });

  it('does not offer a retry for a failure that cannot succeed on a second attempt', async () => {
    seedVault(true);
    useVaultStore.setState({ locks: [lockedLock] });

    const { getByTestId, getByText, queryByTestId } = render(
      <VaultLockDetail lock={maturedLock} />
    );

    fireEvent.press(getByTestId('withdraw-funds-button'));
    fireEvent.press(getByTestId('confirm-withdrawal-button'));

    await waitFor(() => getByText('Lock unavailable'));
    expect(queryByTestId('retry-withdrawal-button')).toBeNull();
  });
});
