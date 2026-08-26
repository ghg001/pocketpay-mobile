/**
 * Root-level mock for @stellar/stellar-sdk.
 *
 * Provides only the subset of the SDK used in tests:
 *  - StrKey.isValidEd25519PublicKey  (validates G-addresses by length + checksum)
 *
 * Using a lightweight implementation avoids the stream/network initialisation
 * that the real SDK triggers on import, which crashes the Jest environment.
 */

/**
 * Minimal Stellar Ed25519 public key validation:
 *  - Must start with 'G'
 *  - Must be 56 characters
 *  - Must decode to 35 bytes (1 version + 32 key + 2 checksum) via base32
 *
 * We use a simplified regex-based check here since the full checksum
 * verification requires the same SDK we are trying to avoid.
 *
 * Stellar public keys follow StrKey encoding:
 *  Base32 alphabet, exactly 56 characters, starting with 'G' (version byte 0x06 << 3).
 */
function isValidEd25519PublicKey(address: string): boolean {
  if (typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length !== 56) return false;
  if (!trimmed.startsWith('G')) return false;
  // Stellar StrKey uses RFC 4648 base32 (A-Z, 2-7), no padding, exactly 56 chars.
  return /^[A-Z2-7]{56}$/.test(trimmed);
}

export const StrKey = {
  isValidEd25519PublicKey,
  isValidEd25519SecretSeed: (s: string) =>
    typeof s === 'string' && s.trim().length === 56 && s.trim().startsWith('S') && /^[A-Z2-7]{56}$/.test(s.trim()),
};

export const Keypair = {
  random: jest.fn(() => ({
    publicKey: () => 'GCUZ2OXRT2452M7FW5QJINMBPR7MDZLXPELCQIDPG5DBMJOZCOVHKICL',
    secret: () => 'SCZANGBA5RLKBLKCZQBIUZNIQQFXMBNCIBLQBMKGLWRFYCIHZASGFLKM',
  })),
  fromSecret: jest.fn((s: string) => ({
    publicKey: () => 'GCUZ2OXRT2452M7FW5QJINMBPR7MDZLXPELCQIDPG5DBMJOZCOVHKICL',
    secret: () => s,
    sign: jest.fn(),
  })),
  fromPublicKey: jest.fn((pk: string) => ({
    publicKey: () => pk,
  })),
};

export const Networks = {
  TESTNET: 'Test SDF Network ; September 2015',
  PUBLIC: 'Public Global Stellar Network ; September 2015',
};

export const Server = jest.fn(() => ({
  root: jest.fn(async () => ({
    network_passphrase: 'Test SDF Network ; September 2015',
  })),
  loadAccount: jest.fn(async () => ({ sequence: '0', balances: [] })),
  submitTransaction: jest.fn(async () => ({ hash: 'mockhash' })),
  payments: jest.fn(() => ({
    forAccount: jest.fn(() => ({
      limit: jest.fn(() => ({
        order: jest.fn(() => ({
          call: jest.fn(async () => ({ records: [], next: jest.fn() })),
          cursor: jest.fn(),
        })),
      })),
    })),
  })),
}));

export const TransactionBuilder = jest.fn(() => ({
  addOperation: jest.fn().mockReturnThis(),
  setTimeout: jest.fn().mockReturnThis(),
  addMemo: jest.fn().mockReturnThis(),
  build: jest.fn(() => ({
    sign: jest.fn(),
    toEnvelope: jest.fn(() => ({ toXDR: jest.fn(() => '') })),
  })),
}));

export const Operation = {
  payment: jest.fn(() => ({})),
};

export const Asset = {
  native: jest.fn(() => ({ isNative: () => true })),
};

export const Memo = {
  text: jest.fn((t: string) => ({ value: t, type: 'text' })),
  none: jest.fn(() => ({ type: 'none' })),
};

export const BASE_FEE = '100';

export const Horizon = {
  Server: Server,
};
