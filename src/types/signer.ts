import type { Transaction } from '@stellar/stellar-sdk';

/**
 * Identifies the type of signer that will handle transaction signing.
 * - "local": In-app signing via SecureStore secret key (current default)
 * - "external": External wallet or signer integration (future)
 * - "hardware": Hardware wallet (Ledger, etc.) (future)
 */
export type SignerType = 'local' | 'external' | 'hardware';

/**
 * Represents a signer capability discovered or registered in the app.
 */
export interface SignerInfo {
  type: SignerType;
  /** Human-readable label shown during transaction review */
  label: string;
  /** The public key this signer will sign for */
  publicKey: string;
  /** Whether this signer is currently available */
  isAvailable: boolean;
  /** Optional description for the user */
  description?: string;
}

/**
 * The current phase of the signing handoff flow.
 */
export type HandoffPhase =
  | 'idle'          // No signing in progress
  | 'review'        // User is reviewing the transaction details
  | 'handoff'       // Transaction has been sent to the signer
  | 'signing'       // Signer is actively signing
  | 'submitting'    // Signed transaction is being submitted to the network
  // Horizon's classic submit is synchronous (resolves already confirmed-or-failed), so
  // this isn't a real waiting window — it exists to separate "network responded" from
  // "UI flow fully done", so downstream UI never has to treat submit-resolved as final.
  | 'confirming'    // Network call resolved; wrapping up before the flow is done
  | 'completed'     // Flow finished successfully
  | 'failed'        // Signing or submission failed
  | 'cancelled';    // User or signer cancelled the flow

/**
 * Error classification for the signing flow.
 */
export type SignerErrorType =
  | 'user_cancelled'       // User explicitly cancelled
  | 'signer_rejected'      // External signer rejected the request
  | 'signer_unavailable'   // Signer not reachable / not connected
  | 'signer_timeout'       // Signer did not respond in time
  | 'network_error'        // Horizon / RPC submission failed
  | 'transaction_expired'  // Transaction timed out before signing
  | 'invalid_transaction'  // Transaction could not be built
  | 'unknown';             // Unclassified error

/**
 * Structured error from the signing flow.
 */
export interface SignerError {
  type: SignerErrorType;
  message: string;
  /** Raw error from the signer or network, if any */
  raw?: unknown;
}

/**
 * Transaction details presented for review before signing.
 * This is a signer-agnostic summary — the actual Stellar Transaction
 * object is constructed internally and never exposed to the signer.
 */
export interface TransactionReview {
  /** Unique identifier for this signing request */
  requestId: string;
  /** The source public key (signing account) */
  sourcePublicKey: string;
  /** Destination public key */
  destinationPublicKey: string;
  /** Destination contact label, if known */
  destinationLabel?: string | null;
  /** Amount as a string to avoid floating point issues */
  amount: string;
  /** Asset code (e.g. "XLM") */
  assetCode: string;
  /** Optional memo text */
  memo?: string;
  /** Network name (e.g. "Testnet", "Public") */
  network: string;
  /** Estimated fee in stroops */
  fee?: string;
  /** When this request was created (ISO timestamp) */
  createdAt: string;
  /** Expiry in seconds from creation */
  timeoutSeconds: number;
}

/**
 * Result after a successful signing + submission.
 */
export interface SigningResult {
  /** Stellar transaction hash */
  hash: string;
  /** The original review that was signed */
  review: TransactionReview;
  /** The signer type that performed the signing */
  signerType: SignerType;
  /** When the result was received */
  completedAt: string;
}

/**
 * Interface that all signers must implement.
 * The current LocalSigner handles SecureStore-based signing.
 * Future external signers will implement this interface to
 * handle wallet handoff, deep-link callbacks, etc.
 */
export interface Signer {
  /** The type of this signer */
  readonly type: SignerType;
  /** Human-readable label */
  readonly label: string;

  /** Check if this signer is available right now */
  isAvailable(): Promise<boolean>;

  /**
   * Sign a transaction. The signer receives the review details
   * (for display to the user) and a callback to build the actual
   * Transaction object. The signer never receives the secret key.
   *
   * @param review - Transaction details for the user to review
   * @param buildTransaction - Callback that builds the unsigned Transaction
   * @returns The signed transaction ready for submission
   */
  sign(
    review: TransactionReview,
    buildTransaction: () => Promise<Transaction>,
  ): Promise<Transaction>;
}
