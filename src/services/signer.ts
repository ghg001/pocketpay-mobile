import * as StellarSdk from '@stellar/stellar-sdk';
import type { Transaction, Keypair } from '@stellar/stellar-sdk';
import type {
  Signer,
  SignerType,
  SignerInfo,
  TransactionReview,
  SignerError,
} from '../types/signer';
import { WALLET_SECRET_ACCESS_MESSAGE } from '../utils/walletStorageErrors';

/**
 * Local signer implementation.
 * Signs transactions using the device-local secret key from SecureStore.
 * The secret key is fetched at the last moment and never stored outside SecureStore.
 */
export class LocalSigner implements Signer {
  readonly type: SignerType = 'local';
  readonly label = 'This Device';

  private getSecretKey: () => Promise<string | null>;

  constructor(getSecretKey: () => Promise<string | null>) {
    this.getSecretKey = getSecretKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const key = await this.getSecretKey();
      return key !== null;
    } catch {
      return false;
    }
  }

  async sign(
    _review: TransactionReview,
    buildTransaction: () => Promise<Transaction>,
  ): Promise<Transaction> {
    const secretKey = await this.getSecretKey();
    if (!secretKey) {
      throw createSignerError('signer_unavailable', WALLET_SECRET_ACCESS_MESSAGE);
    }

    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const transaction = await buildTransaction();
    transaction.sign(keypair);

    return transaction;
  }
}

/**
 * Creates a structured signer error for consistent error handling.
 */
export function createSignerError(type: SignerError['type'], message: string, raw?: unknown): SignerError {
  return { type, message, raw };
}

/**
 * Resolves the best available signer for the given type.
 * Falls back to local if the requested type is unavailable.
 */
export function resolveSigner(
  requestedType: SignerType,
  signers: Signer[],
): Signer | null {
  const requested = signers.find((s) => s.type === requestedType);
  if (requested) return requested;
  // Fallback to local
  return signers.find((s) => s.type === 'local') ?? null;
}

/**
 * Maps a SignerType to a SignerInfo for UI display.
 */
export function signerTypeToInfo(
  type: SignerType,
  publicKey: string,
  isAvailable: boolean,
): SignerInfo {
  const labels: Record<SignerType, string> = {
    local: 'This Device',
    external: 'External Wallet',
    hardware: 'Hardware Wallet',
  };
  const descriptions: Record<SignerType, string | undefined> = {
    local: 'Signed securely on this device using the stored key.',
    external: 'Hand off to an external wallet app for approval.',
    hardware: 'Connect and approve on your hardware wallet.',
  };

  return {
    type,
    label: labels[type],
    publicKey,
    isAvailable,
    description: descriptions[type],
  };
}
