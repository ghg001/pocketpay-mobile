import { getDiagnostics } from '../src/utils/diagnostics';
import { useWalletStore } from '../src/store/walletStore';
import { reportError, clearLastErrorReport } from '../src/utils/errorReporting';
import { FEATURE_FLAGS } from '../src/config/featureFlags';
import * as SecureStore from 'expo-secure-store';

const SAMPLE_SECRET_KEY = 'S' + 'A'.repeat(55);
const SAMPLE_PUBLIC_KEY = 'G' + 'B'.repeat(55);

describe('getDiagnostics', () => {
  const originalNetwork = process.env.EXPO_PUBLIC_STELLAR_NETWORK;

  afterEach(() => {
    process.env.EXPO_PUBLIC_STELLAR_NETWORK = originalNetwork;
    clearLastErrorReport();
    useWalletStore.setState({ error: null });
    jest.restoreAllMocks();
  });

  it('redacts a Stellar secret key that leaked into the wallet store error', async () => {
    useWalletStore.setState({ error: `Signing failed for secret ${SAMPLE_SECRET_KEY}` });

    const raw = await getDiagnostics();

    expect(raw).not.toContain(SAMPLE_SECRET_KEY);
    expect(raw).toContain('[REDACTED_SECRET]');
  });

  it('redacts a Stellar public key that leaked into the wallet store error', async () => {
    useWalletStore.setState({ error: `Account not found: ${SAMPLE_PUBLIC_KEY}` });

    const raw = await getDiagnostics();

    expect(raw).not.toContain(SAMPLE_PUBLIC_KEY);
    expect(raw).toContain('[REDACTED_PUBLIC_KEY]');
  });

  it('never includes a raw secret or public key anywhere in the payload, regardless of source', async () => {
    // Even if some future field accidentally included one of these directly
    // (not just through walletState.error), the full serialized payload
    // must never contain an unredacted key. This is a blanket safety net,
    // not just a check on the one field that's redacted today.
    useWalletStore.setState({ error: `${SAMPLE_SECRET_KEY} and ${SAMPLE_PUBLIC_KEY}` });

    const raw = await getDiagnostics();

    expect(raw).not.toMatch(/\bS[A-Z0-9]{55}\b/);
    expect(raw).not.toMatch(/\bG[A-Z0-9]{55}\b/);
  });

  it('reports null for lastError when the wallet store has no error', async () => {
    useWalletStore.setState({ error: null });

    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.walletState.lastError).toBeNull();
  });

  it('includes network tier and label derived from EXPO_PUBLIC_STELLAR_NETWORK', async () => {
    process.env.EXPO_PUBLIC_STELLAR_NETWORK = 'TESTNET';
    const testnetParsed = JSON.parse(await getDiagnostics());
    expect(testnetParsed.network.tier).toBe('testnet');
    expect(testnetParsed.network.label).toBe('Testnet');

    process.env.EXPO_PUBLIC_STELLAR_NETWORK = 'PUBLIC';
    const mainnetParsed = JSON.parse(await getDiagnostics());
    expect(mainnetParsed.network.tier).toBe('mainnet');
    expect(mainnetParsed.network.label).toBe('Public Network (Mainnet)');
  });

  it('exposes only hostnames for Horizon/Soroban, never a full URL', async () => {
    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.network.horizonHost).not.toMatch(/^https?:\/\//);
    expect(parsed.network.sorobanHost).not.toMatch(/^https?:\/\//);
  });

  it('reports the vault as mock mode with no raw contract ID when unconfigured', async () => {
    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.network.vaultMode).toBe('mock');
    expect(parsed.network.vaultContractLabel).toBe('Mock (no contract)');
  });

  it('includes every configured feature flag with its enabled state', async () => {
    const parsed = JSON.parse(await getDiagnostics());

    for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
      expect(parsed.featureFlags[key]).toBe(flag.enabled);
    }
  });

  it('reports secure storage as available when the platform check succeeds', async () => {
    jest.spyOn(SecureStore, 'isAvailableAsync').mockResolvedValueOnce(true);

    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.storage.secureStoreAvailable).toBe(true);
  });

  it('reports secure storage as unavailable rather than throwing when the platform check fails', async () => {
    jest.spyOn(SecureStore, 'isAvailableAsync').mockRejectedValueOnce(new Error('no keychain'));

    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.storage.secureStoreAvailable).toBe(false);
  });

  it('includes the most recent reported error with an already-redacted message', async () => {
    reportError(new Error(`boom ${SAMPLE_SECRET_KEY}`), { source: 'GlobalJsHandler', isFatal: true });

    const parsed = JSON.parse(await getDiagnostics());

    expect(parsed.lastReportedError).not.toBeNull();
    expect(parsed.lastReportedError.source).toBe('GlobalJsHandler');
    expect(parsed.lastReportedError.isFatal).toBe(true);
    expect(parsed.lastReportedError.message).not.toContain(SAMPLE_SECRET_KEY);
  });

  it('never exposes the wallet balance or full transaction list, only counts/booleans', async () => {
    useWalletStore.setState({
      balance: '1234.5670000',
      transactions: [{ id: '1' } as never, { id: '2' } as never],
    });

    const raw = await getDiagnostics();
    const parsed = JSON.parse(raw);

    expect(raw).not.toContain('1234.5670000');
    expect(parsed.walletState.transactionsCount).toBe(2);
    expect(parsed.walletState).not.toHaveProperty('balance');
    expect(parsed.walletState).not.toHaveProperty('transactions');
  });
});
