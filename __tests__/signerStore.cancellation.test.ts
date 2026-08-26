/**
 * signerStore - payment cancellation vs. failure semantics (issue #250)
 *
 * Issue #250 ("Add mobile payment cancellation states") requires the signing
 * flow to treat an intentional cancellation differently from a failure:
 *   - cancellation is a distinct state, not an error;
 *   - no error is surfaced for an intentional cancel;
 *   - cancelled flows return safely and clear the pending transaction;
 *   - a user-cancelled signer error stays distinguishable from a real failure.
 *
 * The existing suite (see __tests__/send.test.tsx) exercises the send-form and
 * QR-scan cancel paths, but nothing asserts the signerStore state machine that
 * backs the review -> handoff -> signing -> submitting flow. These tests cover
 * that gap without changing any production behaviour.
 */
import { useSignerStore } from '../src/store/signerStore';
import type {
  SignerError,
  SignerErrorType,
  SigningResult,
  TransactionReview,
} from '../src/types/signer';

const makeReview = (
  overrides: Partial<TransactionReview> = {},
): TransactionReview => ({
  requestId: 'tx_test_0001',
  sourcePublicKey: 'GSOURCE0000000000000000000000000000000000000000000000',
  destinationPublicKey: 'GDEST00000000000000000000000000000000000000000000000',
  destinationLabel: null,
  amount: '12.5',
  assetCode: 'XLM',
  network: 'Testnet',
  createdAt: '2026-01-01T00:00:00.000Z',
  timeoutSeconds: 30,
  ...overrides,
});

const makeResult = (
  review: TransactionReview,
  overrides: Partial<SigningResult> = {},
): SigningResult => ({
  hash: 'abcdef0123456789',
  review,
  signerType: 'local',
  completedAt: '2026-01-01T00:00:05.000Z',
  ...overrides,
});

const makeError = (
  type: SignerErrorType,
  message = 'something happened',
): SignerError => ({ type, message });

const store = () => useSignerStore.getState();

beforeEach(() => {
  store().reset();
});

describe('signerStore: cancellation is a distinct state from failure', () => {
  it('cancelSigning moves to the "cancelled" phase, never "failed"', () => {
    store().startReview(makeReview());
    store().enterSigning();

    store().cancelSigning();

    expect(store().phase).toBe('cancelled');
    expect(store().phase).not.toBe('failed');
  });

  it('failSigning moves to the "failed" phase, never "cancelled"', () => {
    store().startReview(makeReview());
    store().enterSigning();

    store().failSigning(makeError('network_error'));

    expect(store().phase).toBe('failed');
    expect(store().phase).not.toBe('cancelled');
  });
});

describe('signerStore: no error is surfaced for an intentional cancel', () => {
  it('clears any prior error when cancelling', () => {
    store().startReview(makeReview());
    store().enterSigning();
    store().failSigning(makeError('network_error'));
    expect(store().error).not.toBeNull();

    store().cancelSigning();

    expect(store().phase).toBe('cancelled');
    expect(store().error).toBeNull();
  });

  it('keeps the structured error when failing so the UI can show it', () => {
    store().startReview(makeReview());
    store().enterSigning();

    const err = makeError('invalid_transaction', 'could not build transaction');
    store().failSigning(err);

    expect(store().error).toEqual(err);
    expect(store().error?.message).toBe('could not build transaction');
  });
});

describe('signerStore: cancelled flows return safely and clear state', () => {
  it('clears the pending review and last result on cancel', () => {
    const review = makeReview();
    store().startReview(review);
    store().enterSigning();
    expect(store().currentReview).toEqual(review);

    store().cancelSigning();

    expect(store().currentReview).toBeNull();
    expect(store().lastResult).toBeNull();
  });

  it('reset() returns from "cancelled" to a clean idle state', () => {
    store().startReview(makeReview());
    store().cancelSigning();
    expect(store().phase).toBe('cancelled');

    store().reset();

    expect(store().phase).toBe('idle');
    expect(store().currentReview).toBeNull();
    expect(store().lastResult).toBeNull();
    expect(store().error).toBeNull();
  });
});

describe('signerStore: cancel is available at every pre-submission phase', () => {
  const preSubmissionPhases: Array<[string, () => void]> = [
    ['review', () => {}],
    ['handoff', () => store().enterHandoff()],
    ['signing', () => store().enterSigning()],
  ];

  it.each(preSubmissionPhases)(
    'can cancel from the "%s" phase and land in "cancelled"',
    (_label, advance) => {
      store().startReview(makeReview());
      advance();

      store().cancelSigning();

      expect(store().phase).toBe('cancelled');
      expect(store().error).toBeNull();
      expect(store().currentReview).toBeNull();
    },
  );
});

describe('signerStore: a user-cancelled signer error stays distinguishable from a real failure', () => {
  it('both are "failed", but the error type separates a cancel from a network error', () => {
    store().startReview(makeReview());
    store().enterSigning();
    store().failSigning(makeError('user_cancelled', 'User aborted signing'));
    const cancelledLikeError = store().error;

    store().reset();

    store().startReview(makeReview());
    store().enterSigning();
    store().failSigning(makeError('network_error', 'Horizon submission failed'));
    const realFailureError = store().error;

    expect(cancelledLikeError?.type).toBe('user_cancelled');
    expect(realFailureError?.type).toBe('network_error');
    expect(cancelledLikeError?.type).not.toBe(realFailureError?.type);
  });
});

describe('signerStore: re-entry after a cancellation starts fresh', () => {
  it('startReview after cancel resets error/result and enters "review"', () => {
    store().startReview(makeReview({ requestId: 'tx_first' }));
    store().enterSigning();
    store().cancelSigning();

    const next = makeReview({ requestId: 'tx_second' });
    store().startReview(next);

    expect(store().phase).toBe('review');
    expect(store().currentReview).toEqual(next);
    expect(store().error).toBeNull();
    expect(store().lastResult).toBeNull();
  });

  it('a successful sign after a prior cancel records the result cleanly', () => {
    store().startReview(makeReview());
    store().cancelSigning();

    const review = makeReview({ requestId: 'tx_ok' });
    store().startReview(review);
    store().enterHandoff();
    store().enterSigning();
    store().enterSubmitting();
    const result = makeResult(review);
    store().completeSigning(result);

    expect(store().phase).toBe('completed');
    expect(store().lastResult).toEqual(result);
    expect(store().error).toBeNull();
  });
});