import {
  createWithdrawalError,
  describeWithdrawalError,
  evaluateWithdrawalEligibility,
  isVaultWithdrawalError,
  toWithdrawalErrorCode,
} from '../src/features/vault/maturedLockWithdrawal';

const PUBLIC_KEY = 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH';

const matured = { amount: '50.0000000', unlockDate: new Date(Date.now() - 1000).toISOString() };
const pending = {
  amount: '50.0000000',
  unlockDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('evaluateWithdrawalEligibility', () => {
  it('marks a matured lock with a loaded wallet as eligible', () => {
    const eligibility = evaluateWithdrawalEligibility(matured, { publicKey: PUBLIC_KEY });

    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.reason).toBeNull();
    expect(eligibility.message).toMatch(/matured/i);
    expect(eligibility.availableFrom).toBeTruthy();
  });

  it('blocks a lock that has not reached its unlock date and says when it will', () => {
    const eligibility = evaluateWithdrawalEligibility(pending, { publicKey: PUBLIC_KEY });

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reason).toBe('not-matured');
    expect(eligibility.message).toMatch(/unlock on/i);
    expect(eligibility.message).toMatch(/remaining/i);
  });

  it('derives maturity from the unlock date rather than a stale status field', () => {
    const justMatured = { amount: '1.0000000', unlockDate: new Date(1_000).toISOString() };

    expect(evaluateWithdrawalEligibility(justMatured, { publicKey: PUBLIC_KEY, now: 500 })
      .isEligible).toBe(false);
    expect(evaluateWithdrawalEligibility(justMatured, { publicKey: PUBLIC_KEY, now: 2_000 })
      .isEligible).toBe(true);
  });

  it('blocks withdrawal when no wallet is loaded', () => {
    const eligibility = evaluateWithdrawalEligibility(matured, { publicKey: null });

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reason).toBe('no-wallet');
  });

  it('blocks a lock with no withdrawable amount', () => {
    const eligibility = evaluateWithdrawalEligibility(
      { ...matured, amount: '0' },
      { publicKey: PUBLIC_KEY }
    );

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reason).toBe('invalid-amount');
  });

  it('treats an unparseable unlock date as not withdrawable', () => {
    const eligibility = evaluateWithdrawalEligibility(
      { amount: '5', unlockDate: 'not-a-date' },
      { publicKey: PUBLIC_KEY }
    );

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reason).toBe('not-matured');
    expect(eligibility.availableFrom).toBeNull();
  });
});

describe('withdrawal errors', () => {
  it('tags created errors with a recognizable code', () => {
    const error = createWithdrawalError('network');

    expect(isVaultWithdrawalError(error)).toBe(true);
    expect(toWithdrawalErrorCode(error)).toBe('network');
  });

  it('classifies unknown network failures from their message', () => {
    expect(toWithdrawalErrorCode(new Error('Network request failed'))).toBe('network');
    expect(toWithdrawalErrorCode(new Error('contract trapped'))).toBe('unknown');
    expect(toWithdrawalErrorCode(undefined)).toBe('unknown');
  });

  it('does not treat a plain error as a tagged withdrawal error', () => {
    expect(isVaultWithdrawalError(new Error('boom'))).toBe(false);
    expect(isVaultWithdrawalError('boom')).toBe(false);
  });

  it('offers retry only for failures that can succeed on a second attempt', () => {
    expect(describeWithdrawalError('network').canRetry).toBe(true);
    expect(describeWithdrawalError('secret-unavailable').canRetry).toBe(true);
    expect(describeWithdrawalError('unknown').canRetry).toBe(true);

    expect(describeWithdrawalError('not-matured').canRetry).toBe(false);
    expect(describeWithdrawalError('lock-not-found').canRetry).toBe(false);
    expect(describeWithdrawalError('no-wallet').canRetry).toBe(false);
  });

  it('reassures the user that funds are untouched when a withdrawal fails', () => {
    expect(describeWithdrawalError('network').message).toMatch(/still locked in the vault/i);
    expect(describeWithdrawalError('unknown').message).toMatch(/still in the vault/i);
    expect(describeWithdrawalError('secret-unavailable').message).toMatch(/nothing was withdrawn/i);
  });
});
