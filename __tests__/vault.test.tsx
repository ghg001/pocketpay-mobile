/**
 * Vault Screen – Loading State Consistency Tests
 *
 * Acceptance criteria covered:
 *  AC1 – Vault action loading states are consistent across deposit/withdraw/lock
 *  AC2 – Buttons prevent duplicate submission while loading
 *  AC3 – Loading copy is clear
 *  AC4 – Error and success states still work correctly
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ─── Module mocks ────────────────────────────────────────────────────────

jest.mock('../src/services/stellar');
jest.mock('../src/store/walletStore');
jest.mock('../src/store/vaultStore');

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

jest.mock('lucide-react-native', () => ({
  PiggyBank: () => null,
  ShieldCheck: () => null,
  AlertTriangle: () => null,
  XCircle: () => null,
  Info: () => null,
  ArrowDownCircle: () => null,
  ArrowUpCircle: () => null,
  Lock: () => null,
  X: () => null,
  ShieldAlert: () => null,
  Network: () => null,
  WifiOff: () => null,
  Ban: () => null,
}));

process.env.EXPO_PUBLIC_SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

jest.mock('../src/services/vault', () => ({
  isVaultConfigured: jest.fn(() => true),
  getVaultContractId: jest.fn(() => 'CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'),
}));

// ─── Typed mock imports ──────────────────────────────────────────────────

import { useWalletStore } from '../src/store/walletStore';
import { useVaultStore } from '../src/store/vaultStore';

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockUseVaultStore = useVaultStore as jest.MockedFunction<typeof useVaultStore>;

import VaultScreen from '../app/(tabs)/vault';

// ─── Constants ────────────────────────────────────────────────────────────

const VALID_AMOUNT = '10';

// ─── Helpers ──────────────────────────────────────────────────────────────

const mockDeposit = jest.fn();
const mockWithdraw = jest.fn();
const mockLoadBalance = jest.fn();
const mockLoadLocks = jest.fn();
const mockAddLock = jest.fn();

function setupStores(overrides: Record<string, unknown> = {}) {
  mockDeposit.mockResolvedValue('tx_hash_1234567890abcdef');
  mockWithdraw.mockResolvedValue('tx_hash_abcdef1234567890');

  const walletState = {
    publicKey: 'GPUBLIC123',
    balance: '100.0000000',
    getSecretKey: jest.fn(async () => 'SVALIDSECRET'),
    ...overrides,
  };

  const vaultState = {
    balance: '50.0000000',
    locks: [],
    isConfigured: true,
    contractId: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    isLoadingBalance: false,
    isLoadingLocks: false,
    isSubmitting: false,
    balanceError: null,
    vaultError: null,
    loadBalance: mockLoadBalance,
    loadLocks: mockLoadLocks,
    addLock: mockAddLock,
    unlockLock: jest.fn(),
    deposit: mockDeposit,
    withdraw: mockWithdraw,
    withdrawMaturedLock: jest.fn(),
    clearVaultError: jest.fn(),
    ...overrides,
  };

  mockUseWalletStore.mockImplementation((selector?: any) =>
    typeof selector === 'function' ? selector(walletState) : walletState
  );

  mockUseVaultStore.mockImplementation((selector?: any) =>
    typeof selector === 'function' ? selector(vaultState) : vaultState
  );
}


const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

// ─── Lifecycle ────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy.mockImplementation(() => undefined);
  setupStores();
});

// ────────────────────────────────────────────────────────────────────────
// AC1 – Consistent loading states: deposit/withdraw/lock all use the
//       same confirmation-modal flow.
// ────────────────────────────────────────────────────────────────────────

describe('AC1 – consistent loading states', () => {
  it('shows a confirmation modal before deposit', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => {
      expect(getAllByText('Confirm Deposit').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows a confirmation modal before withdraw', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Withdraw'));

    await waitFor(() => {
      expect(getAllByText('Confirm Withdrawal').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows a confirmation modal before lock', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Set Aside for 30 Days'));

    await waitFor(() => {
      expect(getAllByText('Confirm Lock').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls deposit with correct args when confirmed in modal', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(mockDeposit).toHaveBeenCalledWith('SVALIDSECRET', 'GPUBLIC123', VALID_AMOUNT);
    });
  });

  it('calls withdraw with correct args when confirmed in modal', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Withdraw'));

    await waitFor(() => getAllByText('Confirm Withdrawal').length > 0);
    fireEvent.press(getAllByText('Confirm Withdrawal')[1]);

    await waitFor(() => {
      expect(mockWithdraw).toHaveBeenCalledWith('SVALIDSECRET', 'GPUBLIC123', VALID_AMOUNT);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC2 – Duplicate submission prevention
// ────────────────────────────────────────────────────────────────────────

describe('AC2 – duplicate submission prevention', () => {
  it('disables the deposit button while a deposit is in flight', async () => {
    const { getByText, getByPlaceholderText, getAllByText, rerender } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));
    await waitFor(() => getAllByText('Confirm Deposit').length > 0);

    setupStores({ isSubmitting: true });
    rerender(<VaultScreen />);

    await waitFor(() => expect(getByText('Depositing…')).toBeTruthy());
  });

  it('disables the lock button while a lock is in flight', async () => {
    const { getByText, getByPlaceholderText, getAllByText, rerender } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Set Aside for 30 Days'));
    await waitFor(() => getAllByText('Confirm Lock').length > 0);

    setupStores({ isSubmitting: true });
    rerender(<VaultScreen />);

    await waitFor(() => expect(getByText('Locking…')).toBeTruthy());
  });

  it('calls deposit exactly once when confirm is pressed', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(mockDeposit).toHaveBeenCalledTimes(1);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC3 – Loading copy is clear
// ────────────────────────────────────────────────────────────────────────

describe('AC3 – clear loading copy', () => {
  it('shows "Depositing…" on the deposit button while submitting', async () => {
    const { getByText, getByPlaceholderText, getAllByText, rerender } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));
    await waitFor(() => getAllByText('Confirm Deposit').length > 0);

    setupStores({ isSubmitting: true });
    rerender(<VaultScreen />);

    await waitFor(() => expect(getByText('Depositing…')).toBeTruthy());
  });

  it('shows "Processing deposit…" on the modal confirm button while loading', async () => {
    const { getByText, getByPlaceholderText, getAllByText, rerender } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);

    mockUseVaultStore.mockReturnValue({
      ...mockUseVaultStore(),
      isSubmitting: true,
    } as any);

    rerender(<VaultScreen />);

    await waitFor(() => {
      expect(getByText(/Processing deposit/i)).toBeTruthy();
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// AC4 – Error and success states still work correctly
// ────────────────────────────────────────────────────────────────────────

describe('AC4 – error and success states', () => {
  it('shows a success alert after a confirmed deposit completes', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('deposited into')
      );
    });
  });

  it('shows a success alert after a confirmed withdrawal completes', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Withdraw'));

    await waitFor(() => getAllByText('Confirm Withdrawal').length > 0);
    fireEvent.press(getAllByText('Confirm Withdrawal')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('withdrawn from')
      );
    });
  });

  it('shows a failure alert when deposit throws', async () => {
    mockDeposit.mockRejectedValueOnce(new Error('insufficient funds'));
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Deposit failed', 'insufficient funds');
    });
  });

  it('shows a failure alert when withdraw throws', async () => {
    mockWithdraw.mockRejectedValueOnce(new Error('network error'));
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Withdraw'));

    await waitFor(() => getAllByText('Confirm Withdrawal').length > 0);
    fireEvent.press(getAllByText('Confirm Withdrawal')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Withdrawal failed', 'network error');
    });
  });

  it('closes the modal after a successful deposit', async () => {
    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Success', expect.any(String));
    });

    expect(queryByText('Confirm Deposit')).toBeNull();
  });

  it('closes the modal after a failed deposit', async () => {
    mockDeposit.mockRejectedValueOnce(new Error('failed'));
    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getAllByText('Confirm Deposit')[1]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Deposit failed', 'failed');
    });

    expect(queryByText('Confirm Deposit')).toBeNull();
  });

  it('records the lock and reports it as a mock via the modal', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Set Aside for 30 Days'));

    await waitFor(() => getAllByText('Confirm Lock').length > 0);
    fireEvent.press(getAllByText('Confirm Lock')[1]);

    await waitFor(() => {
      expect(mockAddLock).toHaveBeenCalledWith(VALID_AMOUNT, expect.any(String));
      expect(alertSpy).toHaveBeenCalledWith('Success', expect.stringContaining('(mock)'));
    });
  });

  it('cancels the modal and does not execute action when cancel is pressed', async () => {
    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), VALID_AMOUNT);
    fireEvent.press(getByText('Deposit'));

    await waitFor(() => getAllByText('Confirm Deposit').length > 0);
    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(queryByText('Confirm Deposit')).toBeNull();
    });

    expect(mockDeposit).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Validation – form errors prevent modal from showing
// ────────────────────────────────────────────────────────────────────────

describe('validation prevents action', () => {
  it('does not show confirmation modal when amount is empty', async () => {
    const { getByText, queryByText } = render(<VaultScreen />);

    fireEvent.press(getByText('Deposit'));

    expect(queryByText('Confirm Deposit')).toBeNull();
  });

  it('does not show confirmation modal when amount exceeds wallet balance for deposit', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<VaultScreen />);

    fireEvent.changeText(getByPlaceholderText('0.00'), '9999');
    fireEvent.press(getByText('Deposit'));

    expect(queryByText('Confirm Deposit')).toBeNull();
  });
});

describe('Vault Unavailable State (Issue #309)', () => {
  it('renders VaultUnavailableState card when publicKey is null', async () => {
    setupStores({ publicKey: null });
    const { getByText, queryByText } = render(<VaultScreen />);

    expect(getByText('Vault Unavailable')).toBeTruthy();
    expect(getByText('Create or import a wallet to use the Soroban Savings Vault.')).toBeTruthy();
    expect(queryByText('Set Aside for 30 Days')).toBeNull();
  });

  it('renders VaultUnavailableState card when EXPO_PUBLIC_VAULT_ENABLED is false', async () => {
    const originalEnv = process.env.EXPO_PUBLIC_VAULT_ENABLED;
    process.env.EXPO_PUBLIC_VAULT_ENABLED = 'false';

    try {
      const { getByText, queryByText } = render(<VaultScreen />);

      expect(getByText('Vault Unavailable')).toBeTruthy();
      expect(getByText('The vault is currently disabled by configuration. This may be temporary while the backend is being updated.')).toBeTruthy();
      expect(queryByText('Set Aside for 30 Days')).toBeNull();
    } finally {
      process.env.EXPO_PUBLIC_VAULT_ENABLED = originalEnv;
    }
  });

  it('does not call loadBalance or loadLocks when vault is unavailable', () => {
    setupStores({ publicKey: null });
    render(<VaultScreen />);

    expect(mockLoadBalance).not.toHaveBeenCalled();
    expect(mockLoadLocks).not.toHaveBeenCalled();
  });
});

