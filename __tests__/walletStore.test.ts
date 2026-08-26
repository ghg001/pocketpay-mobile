jest.mock('../src/services/stellar', () => ({
  fetchXlmBalance: jest.fn(async () => '0.0000000'),
  fetchRecentTransactions: jest.fn(async () => []),
}));

jest.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    fromSecret: jest.fn((secret: string) => {
      if (secret === 'SVALIDSECRET') {
        return { publicKey: () => 'GPUBLICKEY' };
      }
      throw new Error('invalid secret value');
    }),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

import * as SecureStore from 'expo-secure-store';
import { useWalletStore } from '../src/store/walletStore';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const resetStore = () => {
  useWalletStore.setState({
    publicKey: null,
    balance: '0.0000000',
    transactions: [],
    isLoading: false,
    error: null,
  });
};

describe('walletStore secure storage handling', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockedSecureStore.getItemAsync.mockResolvedValue(null);
    mockedSecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('does not activate a created or imported wallet when secure storage write fails', async () => {
    mockedSecureStore.setItemAsync.mockRejectedValueOnce(new Error('secure storage write failed'));

    const saved = await useWalletStore.getState().setWallet('GPUBLICKEY', 'SVALIDSECRET');

    expect(saved).toBe(false);
    expect(useWalletStore.getState().publicKey).toBeNull();
    expect(useWalletStore.getState().error).toBe('Failed to persist wallet securely');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to persist wallet securely');
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('SVALIDSECRET');
  });

  it('restores a valid stored secret and derives the public key', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');

    const restored = await useWalletStore.getState().loadWalletFromStorage();

    expect(restored).toBe(true);
    expect(useWalletStore.getState().publicKey).toBe('GPUBLICKEY');
    expect(useWalletStore.getState().error).toBeNull();
  });

  it('handles missing stored values without crashing', async () => {
    useWalletStore.setState({ publicKey: 'GOLDPUBLICKEY' });
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

    const restored = await useWalletStore.getState().loadWalletFromStorage();

    expect(restored).toBe(false);
    expect(useWalletStore.getState().publicKey).toBeNull();
    expect(useWalletStore.getState().error).toBeNull();
  });

  it.each(['', '{"secretKey":', '{"publicKey":"GPUBLICKEY"}', 'not-a-valid-secret'])(
    'clears unsafe stored wallet values during restore',
    async (storedValue) => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(storedValue);

      const restored = await useWalletStore.getState().loadWalletFromStorage();

      expect(restored).toBe(false);
      expect(useWalletStore.getState().publicKey).toBeNull();
      expect(useWalletStore.getState().error).toBe('Failed to restore wallet securely');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret');
      if (storedValue) {
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(storedValue);
        expect(JSON.stringify(consoleWarnSpy.mock.calls)).not.toContain(storedValue);
      }
    }
  );

  it('does not delete credentials if secure storage read throws an error', async () => {
    mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Device locked or permission denied'));

    const restored = await useWalletStore.getState().loadWalletFromStorage();

    expect(restored).toBe(false);
    expect(useWalletStore.getState().publicKey).toBeNull();
    expect(useWalletStore.getState().error).toBe('Failed to restore wallet securely');
    expect(mockedSecureStore.deleteItemAsync).not.toLocaleString(); // not called
    expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('does not clear active wallet state when secure storage deletion fails', async () => {
    useWalletStore.setState({ publicKey: 'GPUBLICKEY', balance: '10.0000000' });
    mockedSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('delete failed'));

    const cleared = await useWalletStore.getState().clearWallet();

    expect(cleared).toBe(false);
    expect(useWalletStore.getState().publicKey).toBe('GPUBLICKEY');
    expect(useWalletStore.getState().balance).toBe('10.0000000');
    expect(useWalletStore.getState().error).toBe('Failed to clear wallet securely');
  });

  it('sets a distinguishable error when getSecretKey read fails, without leaking the secret', async () => {
    mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Keystore unavailable'));

    const key = await useWalletStore.getState().getSecretKey();

    expect(key).toBeNull();
    expect(useWalletStore.getState().error).toBe('Failed to read wallet securely');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to read wallet securely');
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('Keystore unavailable');
  });

  it('clears malformed stored secrets when getSecretKey reads them', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('{"secretKey":"not-a-valid-secret"}');

    const key = await useWalletStore.getState().getSecretKey();

    expect(key).toBeNull();
    expect(useWalletStore.getState().error).toBe('Failed to read wallet securely');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('pocketpay_wallet_secret');
  });

  it('clears any prior error when getSecretKey succeeds', async () => {
    useWalletStore.setState({ error: 'Failed to read wallet securely' });
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('SVALIDSECRET');

    const key = await useWalletStore.getState().getSecretKey();

    expect(key).toBe('SVALIDSECRET');
    expect(useWalletStore.getState().error).toBeNull();
  });
});
