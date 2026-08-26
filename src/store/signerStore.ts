import { create } from 'zustand';
import type {
  SignerType,
  SignerInfo,
  HandoffPhase,
  TransactionReview,
  SignerError,
  SigningResult,
} from '../types/signer';

interface SignerState {
  /** The active signer type for this session */
  activeSignerType: SignerType;
  /** Available signers discovered in the app */
  availableSigners: SignerInfo[];
  /** Current phase of the signing handoff */
  phase: HandoffPhase;
  /** Transaction pending review / signing */
  currentReview: TransactionReview | null;
  /** Last signing result, if any */
  lastResult: SigningResult | null;
  /** Current or last error */
  error: SignerError | null;

  // Actions
  setActiveSignerType: (type: SignerType) => void;
  setAvailableSigners: (signers: SignerInfo[]) => void;
  startReview: (review: TransactionReview) => void;
  enterHandoff: () => void;
  enterSigning: () => void;
  enterSubmitting: () => void;
  enterConfirming: () => void;
  completeSigning: (result: SigningResult) => void;
  failSigning: (error: SignerError) => void;
  cancelSigning: () => void;
  reset: () => void;
}

const initialState = {
  activeSignerType: 'local' as SignerType,
  availableSigners: [] as SignerInfo[],
  phase: 'idle' as HandoffPhase,
  currentReview: null as TransactionReview | null,
  lastResult: null as SigningResult | null,
  error: null as SignerError | null,
};

export const useSignerStore = create<SignerState>((set, get) => ({
  ...initialState,

  setActiveSignerType: (type) => set({ activeSignerType: type }),

  setAvailableSigners: (signers) => set({ availableSigners: signers }),

  startReview: (review) =>
    set({
      phase: 'review',
      currentReview: review,
      error: null,
      lastResult: null,
    }),

  enterHandoff: () => set({ phase: 'handoff' }),

  enterSigning: () => set({ phase: 'signing' }),

  enterSubmitting: () => set({ phase: 'submitting' }),

  enterConfirming: () => set({ phase: 'confirming' }),

  completeSigning: (result) =>
    set({
      phase: 'completed',
      lastResult: result,
      error: null,
    }),

  failSigning: (error) =>
    set({
      phase: 'failed',
      error,
    }),

  cancelSigning: () =>
    set({
      phase: 'cancelled',
      currentReview: null,
      lastResult: null,
      error: null,
    }),

  reset: () => set({ ...initialState }),
}));
