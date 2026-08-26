import { useCallback, useRef } from 'react';
import { useSignerStore } from '../store/signerStore';
import { useWalletStore } from '../store/walletStore';
import { LocalSigner, createSignerError } from '../services/signer';
import type {
  TransactionReview,
  SigningResult,
  SignerType,
  SignerError,
} from '../types/signer';

/** Timeout for the signing handoff (seconds) */
const SIGNING_TIMEOUT_SECONDS = 30;

/**
 * Generates a unique request ID for tracking signing requests.
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `tx_${timestamp}_${random}`;
}

/**
 * Hook for managing the signer handoff flow.
 *
 * This is the primary API for components that need to initiate signing.
 * It encapsulates the full lifecycle:
 *   idle -> review -> handoff -> signing -> submitting -> confirming -> completed/failed
 *
 * Usage:
 *   const { initiateSigning, cancelSigning } = useSignerHandoff();
 *   await initiateSigning({ destination, amount, memo, ... });
 */
export function useSignerHandoff() {
  const store = useSignerStore();
  const { getSecretKey, publicKey } = useWalletStore();
  const cancelledRef = useRef(false);

  const initiateSigning = useCallback(
    async (params: {
      destinationPublicKey: string;
      destinationLabel?: string | null;
      amount: string;
      memo?: string;
      buildTransaction: () => Promise<any>;
      onSubmit: (signedTx: any) => Promise<{ hash: string }>;
      network?: string;
      fee?: string;
    }) => {
      const {
        destinationPublicKey,
        destinationLabel,
        amount,
        memo,
        buildTransaction,
        onSubmit,
        network = 'Testnet',
        fee,
      } = params;

      if (!publicKey) {
        const error = createSignerError('signer_unavailable', 'No wallet loaded.');
        store.failSigning(error);
        return { success: false, error };
      }

      cancelledRef.current = false;

      // Build the review details
      const review: TransactionReview = {
        requestId: generateRequestId(),
        sourcePublicKey: publicKey,
        destinationPublicKey,
        destinationLabel,
        amount,
        assetCode: 'XLM',
        memo,
        network,
        fee,
        createdAt: new Date().toISOString(),
        timeoutSeconds: SIGNING_TIMEOUT_SECONDS,
      };

      // Enter review phase
      store.startReview(review);

      // Phase: handoff
      // In the local flow, this is immediate.
      // In external signer flows, this is where deep-link / redirect happens.
      store.enterHandoff();

      // Phase: signing
      store.enterSigning();

      try {
        const localSigner = new LocalSigner(getSecretKey);
        const isAvailable = await localSigner.isAvailable();
        if (!isAvailable) {
          const error = createSignerError(
            'signer_unavailable',
            'Signing key is not available. Please unlock your device and try again.',
          );
          store.failSigning(error);
          return { success: false, error };
        }

        // Check cancellation before signing
        if (cancelledRef.current) {
          store.cancelSigning();
          return { success: false, cancelled: true };
        }

        const signedTx = await localSigner.sign(review, buildTransaction);

        // Check cancellation before submission
        if (cancelledRef.current) {
          store.cancelSigning();
          return { success: false, cancelled: true };
        }

        // Phase: submitting
        store.enterSubmitting();

        const submitResult = await onSubmit(signedTx);

        // Phase: confirming (network responded, wrapping up before completed)
        store.enterConfirming();

        // Without a real gap here, React batches this with the completeSigning
        // call below into a single render and 'confirming' never paints.
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Phase: completed
        const result: SigningResult = {
          hash: submitResult.hash,
          review,
          signerType: 'local',
          completedAt: new Date().toISOString(),
        };
        store.completeSigning(result);

        return { success: true, result };
      } catch (err: any) {
        const error = classifySigningError(err);
        if (error.type === 'user_cancelled') {
          store.cancelSigning();
          return { success: false, cancelled: true, error };
        }

        store.failSigning(error);
        return { success: false, error };
      }
    },
    [publicKey, getSecretKey, store],
  );

  const cancelSigning = useCallback(() => {
    cancelledRef.current = true;
    store.cancelSigning();
  }, [store]);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    store.reset();
  }, [store]);

  return {
    /** Current signing phase */
    phase: store.phase,
    /** Transaction being reviewed */
    currentReview: store.currentReview,
    /** Last successful result */
    lastResult: store.lastResult,
    /** Current error */
    error: store.error,
    /** Active signer type */
    activeSignerType: store.activeSignerType,
    /** Available signers */
    availableSigners: store.availableSigners,
    /** Initiate the signing handoff flow */
    initiateSigning,
    /** Cancel an in-progress signing flow */
    cancelSigning,
    /** Reset state to idle */
    reset,
  };
}

/**
 * Classifies raw errors into structured SignerError types.
 */
function classifySigningError(err: any): SignerError {
  const message = err?.message || 'An unexpected error occurred.';

  if (/cancel|abort/i.test(message)) {
    return createSignerError('user_cancelled', 'Signing was cancelled.', err);
  }
  if (/timeout|timed out|expire/i.test(message)) {
    return createSignerError('signer_timeout', 'Signing timed out. Please try again.', err);
  }
  if (/network|connection|fetch|EHOSTUNREACH/i.test(message)) {
    return createSignerError('network_error', 'Network error. Please check your connection.', err);
  }
  if (/not found|ACCOUNT_NOT_FOUND/i.test(message)) {
    return createSignerError(
      'invalid_transaction',
      'Account not found on the network. Make sure the account is funded.',
      err,
    );
  }
  if (/bad request|invalid|op_no_destination/i.test(message)) {
    return createSignerError('invalid_transaction', 'Transaction is invalid. Please review and try again.', err);
  }

  return createSignerError('unknown', message, err);
}
