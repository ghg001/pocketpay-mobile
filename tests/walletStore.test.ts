import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk', () => {
  return {
    Keypair: {
      fromSecret: jest.fn((secret: string) => {
        if (secret === 'SVALIDSECRET') {
          return {
            publicKey: () => 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
            secret: () => 'SVALIDSECRET',
          };
        }
        throw new Error('Invalid secret');
      }),
    },
  };
});

(global as any).StellarSdk = require('@stellar/stellar-sdk');

// Mock stellar services
jest.mock('../src/services/stellar', () => ({
  fetchXlmBalance: jest.fn(),
  fetchTransactionsPage: jest.fn(),
  fundWithFriendbot: jest.fn(),
}));

// Mock AsyncStorage with an in-memory store so persistence across calls
// (and injected failures) can be asserted, mirroring the SecureStore mock above.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchXlmBalance, fetchTransactionsPage, fundWithFriendbot } from '../src/services/stellar';
import { useWalletStore } from '../src/store/walletStore';

const mockFetchXlmBalance = fetchXlmBalance as jest.MockedFunction<typeof fetchXlmBalance>;
const mockFetchTransactionsPage = fetchTransactionsPage as jest.MockedFunction<typeof fetchTransactionsPage>;
const mockFundWithFriendbot = fundWithFriendbot as jest.MockedFunction<typeof fundWithFriendbot>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const resetStore = () => {
  useWalletStore.setState({
    publicKey: null,
    balance: '0.0000000',
    transactions: [],
    isLoading: false,
    isFunding: false,
    fundError: null,
    error: null,
    isLoadingMore: false,
    hasMoreTransactions: false,
    nextCursor: null,
    showBackupReminder: false,
  });
};

describe('useWalletStore State Transitions', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    resetStore();
    // The AsyncStorage mock's backing store is a module-level object that
    // survives jest.clearAllMocks(), so clear it explicitly between tests.
    await mockedAsyncStorage.removeItem('@pocketpay_backup_acknowledged');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // 1. Create & Import Flow
  describe('Create & Import Flow', () => {
    it('sets public key and balance on successful setWallet', async () => {
      const success = await useWalletStore.getState().setWallet(
        'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        'SVALIDSECRET'
      );
      expect(success).toBe(true);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBe('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
      expect(state.balance).toBe('0.0000000');
      expect(state.error).toBeNull();
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret', 'SVALIDSECRET');
    });

    it('sets error and resets state if SecureStore write fails during setWallet', async () => {
      mockedSecureStore.setItemAsync.mockRejectedValueOnce(new Error('Write failed'));
      const success = await useWalletStore.getState().setWallet(
        'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        'SVALIDSECRET'
      );
      expect(success).toBe(false);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBeNull();
      expect(state.error).toBe('Failed to persist wallet securely');
    });
  });

  // 2. Restore Flow
  describe('Restore Flow', () => {
    it('restores public key from valid stored secret', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(true);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBe('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
      expect(state.error).toBeNull();
    });

    it('returns false and resets state if no key in storage', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(false);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBeNull();
      expect(state.error).toBeNull();
    });

    it('returns false and sets error if stored key is invalid JSON / string', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('INVALIDSECRET');
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(false);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBeNull();
      expect(state.error).toBe('Failed to restore wallet securely');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret');
    });

    it('clears invalid JSON stored secret that does not have secretKey field', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('{"publicKey":"GPUBLIC"}');
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(false);
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret');
    });

    it('does not delete credentials if secure storage read throws an error', async () => {
      mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Device locked or permission denied'));
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(false);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBeNull();
      expect(state.error).toBe('Failed to restore wallet securely');
      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('restores successfully from valid JSON secret with secretKey field', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ secretKey: 'SVALIDSECRET' }));
      const restored = await useWalletStore.getState().loadWalletFromStorage();
      expect(restored).toBe(true);
      expect(useWalletStore.getState().publicKey).toBe('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
    });
  });

  // 3. Logout Flow
  describe('Logout Flow', () => {
    it('clears wallet state and secure store key on clearWallet', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H', balance: '10.50' });
      const cleared = await useWalletStore.getState().clearWallet();
      expect(cleared).toBe(true);
      const state = useWalletStore.getState();
      expect(state.publicKey).toBeNull();
      expect(state.balance).toBe('0.0000000');
      expect(state.error).toBeNull();
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret');
    });

    it('sets error and returns false if clearWallet throws', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });
      mockedSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Delete error'));
      const cleared = await useWalletStore.getState().clearWallet();
      expect(cleared).toBe(false);
      expect(useWalletStore.getState().error).toBe('Failed to clear wallet securely');
    });
  });

  // 4. Balance & Data Refresh Flow
  describe('Balance Refresh Flow', () => {
    it('does not refresh if publicKey is null', async () => {
      await useWalletStore.getState().refreshWalletData();
      expect(mockFetchXlmBalance).not.toHaveBeenCalled();
    });

    it('loads balance and transactions page on successful refreshWalletData', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });
      mockFetchXlmBalance.mockResolvedValueOnce('55.1200000');
      mockFetchTransactionsPage.mockResolvedValueOnce({
        records: [{ id: 'tx1', type: 'payment', amount: '10.0' }],
        nextCursor: 'next-cursor-123',
        hasMore: true,
      });

      await useWalletStore.getState().refreshWalletData();

      const state = useWalletStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.balance).toBe('55.1200000');
      expect(state.transactions).toHaveLength(1);
      expect(state.nextCursor).toBe('next-cursor-123');
      expect(state.hasMoreTransactions).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets error if refreshWalletData calls fail', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });
      mockFetchXlmBalance.mockRejectedValueOnce(new Error('Network disconnected'));

      await useWalletStore.getState().refreshWalletData();

      const state = useWalletStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network disconnected');
    });
  });

  // 5. Friendbot Funding Flow
  describe('Friendbot Funding Flow', () => {
    it('funds wallet successfully and refreshes data', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });
      mockFundWithFriendbot.mockResolvedValueOnce(undefined);
      mockFetchXlmBalance.mockResolvedValueOnce('10000.0000000');
      mockFetchTransactionsPage.mockResolvedValueOnce({ records: [], nextCursor: null, hasMore: false });

      await useWalletStore.getState().fundWallet();

      const state = useWalletStore.getState();
      expect(state.isFunding).toBe(false);
      expect(state.fundError).toBeNull();
      expect(state.balance).toBe('10000.0000000');
      expect(mockFundWithFriendbot).toHaveBeenCalledWith('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
    });

    it('sets fundError on funding failure', async () => {
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });
      mockFundWithFriendbot.mockRejectedValueOnce(new Error('Friendbot rate limit'));

      await useWalletStore.getState().fundWallet();

      const state = useWalletStore.getState();
      expect(state.isFunding).toBe(false);
      expect(state.fundError).toBe('Friendbot rate limit');
    });
  });

  // 6. Get Secret Key Flow
  describe('Get Secret Key Flow', () => {
    it('returns key from secure store', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');
      const key = await useWalletStore.getState().getSecretKey();
      expect(key).toBe('SVALIDSECRET');
    });

    it('returns null if getItemAsync throws', async () => {
      mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Read error'));
      const key = await useWalletStore.getState().getSecretKey();
      expect(key).toBeNull();
    });
  });

  // 7. Backup Reminder Flow
  describe('Backup Reminder Flow', () => {
    it('shows the reminder and persists it as pending on markBackupPending', async () => {
      await useWalletStore.getState().markBackupPending();

      expect(useWalletStore.getState().showBackupReminder).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        '@pocketpay_backup_acknowledged',
        'false'
      );
    });

    it('hides the reminder and persists it as acknowledged on acknowledgeBackupReminder', async () => {
      await useWalletStore.getState().markBackupPending();

      await useWalletStore.getState().acknowledgeBackupReminder();

      expect(useWalletStore.getState().showBackupReminder).toBe(false);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        '@pocketpay_backup_acknowledged',
        'true'
      );
    });

    it('re-shows the reminder on restore if it was left pending from a prior session', async () => {
      // Simulate: user created a wallet, the reminder was marked pending,
      // then the app was killed before they acknowledged it.
      await useWalletStore.getState().markBackupPending();
      resetStore(); // Fresh in-memory state, as on a real app relaunch.

      mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');
      const restored = await useWalletStore.getState().loadWalletFromStorage();

      expect(restored).toBe(true);
      expect(useWalletStore.getState().showBackupReminder).toBe(true);
    });

    it('does not show the reminder on restore once it has been acknowledged', async () => {
      await useWalletStore.getState().markBackupPending();
      await useWalletStore.getState().acknowledgeBackupReminder();
      resetStore();

      mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');
      const restored = await useWalletStore.getState().loadWalletFromStorage();

      expect(restored).toBe(true);
      expect(useWalletStore.getState().showBackupReminder).toBe(false);
    });

    it('does not show the reminder on restore for a wallet that never had one pending (e.g. imported)', async () => {
      resetStore();

      mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');
      const restored = await useWalletStore.getState().loadWalletFromStorage();

      expect(restored).toBe(true);
      expect(useWalletStore.getState().showBackupReminder).toBe(false);
    });

    it('clears the persisted backup-ack flag on clearWallet', async () => {
      await useWalletStore.getState().markBackupPending();
      useWalletStore.setState({ publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H' });

      await useWalletStore.getState().clearWallet();

      expect(useWalletStore.getState().showBackupReminder).toBe(false);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('@pocketpay_backup_acknowledged');
    });
  });
});
