// Manual mock for useWalletStore – provides controllable defaults.
// Individual tests can call (useWalletStore as jest.Mock).mockReturnValue({...})
// to override per-test.

const defaultState = {
  publicKey: 'GPUBLIC123',
  balance: '100.0000000',
  transactions: [],
  isLoading: false,
  isLoadingMore: false,
  hasMoreTransactions: false,
  nextCursor: null,
  error: null,
  showBackupReminder: false,
  getSecretKey: jest.fn(async () => 'SSECRET123'),
  refreshWalletData: jest.fn(),
  loadMoreTransactions: jest.fn(),
  setWallet: jest.fn(),
  loadWalletFromStorage: jest.fn(async () => true),
  clearWallet: jest.fn(),
  markBackupPending: jest.fn(),
  acknowledgeBackupReminder: jest.fn(),
};

export const useWalletStore = jest.fn(() => defaultState);
